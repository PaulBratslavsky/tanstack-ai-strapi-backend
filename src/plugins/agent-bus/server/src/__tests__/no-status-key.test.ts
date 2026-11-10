/**
 * Test that no document-service call uses 'status' as a key in data/filters
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

describe('Document Service Calls Should Not Use "status" Key - Agent Bus', () => {
  function getAllTsFiles(dir: string): string[] {
    const files: string[] = [];
    
    function walk(currentDir: string) {
      const entries = readdirSync(currentDir);
      
      for (const entry of entries) {
        const fullPath = join(currentDir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist' && entry !== '__tests__') {
          walk(fullPath);
        } else if (stat.isFile() && entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
          files.push(fullPath);
        }
      }
    }
    
    walk(dir);
    return files;
  }

  const serverDir = join(__dirname, '..');
  const files = getAllTsFiles(serverDir);

  it('should find TypeScript files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('no strapi.documents() calls should use status in data/filters/fields/populate/sort', () => {
    const violations: { file: string; line: number; content: string }[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for strapi.documents() or db.query() calls with status in data/filters
        // Skip comments and external API mappings, but NOT quoted object keys
        if (line.includes('//')) continue;
        if (line.match(/status:\s*\w+\.state/)) continue;  // Mapping state to status is OK
        if (line.match(/metadata:\s*{.*status/)) continue;  // audit metadata OK
        if (line.match(/lastStatusCode/)) continue;  // HTTP status codes OK
        if (line.match(/ctx\.status\s*=/)) continue;  // HTTP response status OK
        if (line.match(/throw new Error.*status/i)) continue;  // Error message strings only
        if (line.match(/Error\(.*status.*\)/)) continue;  // Error constructor strings
        
        // Detect problematic patterns
        if (line.match(/\bstatus:\s*{?\s*\$/) ||  // status: { $eq, $in, $notIn, etc
            line.match(/data:\s*{[^}]*\bstatus:\s*['"]/) ||  // data: { status: 'value'
            line.match(/filters:\s*{[^}]*\bstatus:\s*{/) ||  // filters: { status: {
            line.match(/fields:\s*\[[^\]]*['"]status['"]/) ||  // fields: ['status']
            line.match(/state:\s*{[^}]*\bstatus:\s*/)  // state: { status: (nested)
        ) {
          violations.push({
            file: file.replace(serverDir, ''),
            line: i + 1,
            content: line.trim(),
          });
        }
      }
    }

    if (violations.length > 0) {
      console.error('\n❌ Found document-service calls using "status" key:');
      violations.forEach(v => {
        console.error(`  ${v.file}:${v.line} - ${v.content}`);
      });
    }

    expect(violations).toEqual([]);
  });
});
