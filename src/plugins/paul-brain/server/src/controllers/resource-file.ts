import type { Core } from '@strapi/strapi';
import { createResourceService } from '../services/resource';
import { verifyFileToken } from '../services/resource-file';

function safeDownloadName(name: string): string {
  return name.replace(/["\r\n]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_') || 'file';
}

async function sendFile(ctx: any, strapi: Core.Strapi, documentId: string) {
  const resources = createResourceService(strapi);
  const file = await resources.fileContent(documentId);
  ctx.set('Content-Type', file.mime);
  ctx.set('Content-Disposition', `attachment; filename="${safeDownloadName(file.filename)}"`);
  ctx.set('Cache-Control', 'private, no-store');
  ctx.set('X-Content-Type-Options', 'nosniff');
  ctx.body = file.buffer;
}

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async download(ctx: any) {
    try {
      const documentId = String(ctx.params?.documentId || '');
      if (!documentId) {
        ctx.status = 400;
        ctx.body = { error: 'documentId is required' };
        return;
      }
      await sendFile(ctx, strapi, documentId);
    } catch (error: any) {
      const missing = /not found|no file/i.test(error?.message || '');
      ctx.status = missing ? 404 : 400;
      ctx.body = { error: missing ? 'File not found' : error?.message || 'Could not read file' };
    }
  },

  async signed(ctx: any) {
    try {
      const documentId = verifyFileToken(strapi, String(ctx.params?.token || ''));
      await sendFile(ctx, strapi, documentId);
    } catch (error: any) {
      const missing = /not found|no file/i.test(error?.message || '');
      ctx.status = missing ? 404 : 401;
      ctx.body = { error: missing ? 'File not found' : 'Invalid or expired file link' };
    }
  },
});

export default controller;
