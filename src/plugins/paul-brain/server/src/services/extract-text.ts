import { inflateRawSync, inflateSync } from 'zlib';

/** Cap stored extraction so one file cannot fill the row. */
export const EXTRACTED_TEXT_MAX = 500_000;

const TEXT_MIMES = new Set([
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'text/csv',
  'text/html',
]);

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function cap(text: string): string {
  const trimmed = text.replace(/\u0000/g, '').trim();
  if (trimmed.length <= EXTRACTED_TEXT_MAX) return trimmed;
  return trimmed.slice(0, EXTRACTED_TEXT_MAX);
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function unescapePdfString(input: string): string {
  let out = '';
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char !== '\\') {
      out += char;
      continue;
    }
    const next = input[(i += 1)];
    if (next === undefined) break;
    if (next === 'n') out += '\n';
    else if (next === 'r') out += '\r';
    else if (next === 't') out += '\t';
    else if (next === '(' || next === ')' || next === '\\') out += next;
    else if (next >= '0' && next <= '7') {
      let octal = next;
      for (let extra = 0; extra < 2; extra += 1) {
        const digit = input[i + 1];
        if (digit === undefined || digit < '0' || digit > '7') break;
        octal += digit;
        i += 1;
      }
      out += String.fromCharCode(parseInt(octal, 8));
    } else {
      out += next;
    }
  }
  return out;
}

function mostlyPrintable(text: string): boolean {
  if (!text) return false;
  let ok = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (char === '\n' || char === '\t' || char === '\r' || (code >= 32 && code !== 127)) ok += 1;
  }
  return ok / text.length > 0.85;
}

function stringsFromPdfContent(content: string): string {
  const parts: string[] = [];
  const literal = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
  let match: RegExpExecArray | null;
  while ((match = literal.exec(content))) {
    const text = unescapePdfString(match[1]);
    if (text.trim() && mostlyPrintable(text)) parts.push(text);
  }

  const arrays = /\[([\s\S]*?)\]\s*TJ/g;
  while ((match = arrays.exec(content))) {
    const inner = match[1];
    const pieces = [...inner.matchAll(/\(((?:\\.|[^\\)])*)\)/g)].map((item) => unescapePdfString(item[1]));
    const text = pieces.join('');
    if (text.trim() && mostlyPrintable(text)) parts.push(text);
  }

  return parts.join('\n');
}

function inflatePdfStream(raw: Buffer): Buffer {
  try {
    return inflateSync(raw);
  } catch {
    return inflateRawSync(raw);
  }
}

function pdfStreams(buffer: Buffer): string[] {
  const latin = buffer.toString('latin1');
  const marker = /stream\r?\n/g;
  const outputs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = marker.exec(latin))) {
    const start = match.index + match[0].length;
    const endRel = latin.indexOf('endstream', start);
    if (endRel < 0) break;
    let end = endRel;
    if (latin[end - 1] === '\n') end -= 1;
    if (latin[end - 1] === '\r') end -= 1;
    const raw = buffer.subarray(start, end);
    const dict = latin.slice(Math.max(0, match.index - 500), match.index);
    const flate = /FlateDecode/.test(dict);
    try {
      const decoded = flate ? inflatePdfStream(raw) : raw;
      outputs.push(decoded.toString('latin1'));
    } catch {
      outputs.push(raw.toString('latin1'));
    }
  }
  return outputs;
}

export function extractPdfText(buffer: Buffer): string {
  const chunks = pdfStreams(buffer);
  if (chunks.length === 0) chunks.push(buffer.toString('latin1'));
  return cap(chunks.map(stringsFromPdfContent).filter(Boolean).join('\n'));
}

/**
 * Read a stored or deflated zip without a dependency. DOCX is a zip whose
 * body text lives in word/document.xml. Stops at the central directory.
 */
export function unzipStored(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  let offset = 0;
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const name = buffer.subarray(nameStart, nameStart + nameLength).toString('utf8');
    const dataStart = nameStart + nameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buffer.length) break;
    const compressed = buffer.subarray(dataStart, dataEnd);
    let content = Buffer.alloc(0);
    try {
      if (method === 0) content = Buffer.from(compressed);
      else if (method === 8) content = inflateRawSync(compressed);
    } catch {
      content = Buffer.alloc(0);
    }
    entries.set(name, content);
    offset = dataEnd;
  }
  return entries;
}

export function extractDocxText(buffer: Buffer): string {
  const xml = unzipStored(buffer).get('word/document.xml');
  if (!xml) return '';
  const source = xml.toString('utf8');
  const paragraphs = source.split(/<\/w:p>/);
  const text = paragraphs
    .map((paragraph) => {
      const pieces = [...paragraph.matchAll(/<w:t\b[^>]*>([^<]*)<\/w:t>/g)].map((item) =>
        decodeXml(item[1])
      );
      return pieces.join('');
    })
    .filter((paragraph) => paragraph.trim().length > 0)
    .join('\n');
  return cap(text);
}

function extensionOf(filename: string): string {
  const match = /\.([A-Za-z0-9]+)$/.exec(filename.trim());
  return match ? `.${match[1].toLowerCase()}` : '';
}

/**
 * Pull text from plain text, markdown, PDF content streams, and DOCX.
 * Scanned PDFs, legacy .doc, and anything else return an empty string.
 */
export function extractResourceText(buffer: Buffer, mime: string, filename: string): string {
  const normalized = mime.split(';')[0].trim().toLowerCase();
  const extension = extensionOf(filename);

  if (TEXT_MIMES.has(normalized) || extension === '.txt' || extension === '.md' || extension === '.markdown' || extension === '.csv') {
    return cap(buffer.toString('utf8'));
  }

  if (normalized === 'application/pdf' || extension === '.pdf') {
    return extractPdfText(buffer);
  }

  if (normalized === DOCX_MIME || extension === '.docx') {
    return extractDocxText(buffer);
  }

  return '';
}
