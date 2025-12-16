import { FastifyInstance } from 'fastify';
import { UniqueKey } from '../models/UniqueKey';
import { isKeyValid, generateRandomKey } from '../utils/wii';
import { createLogger } from '../utils/logger';

const logger = createLogger('keys');

export default async (server: FastifyInstance) => {
  // List all keys
  server.get('/admin/keys', async (request, reply) => {
    const { env, status, gameCode } = request.query as any;
    const query = request.query as any;

    const filter: any = {};
    if (env) filter.environment = env;
    if (gameCode) filter.gameCode = gameCode;
    if (status === 'activated') filter.userMacAddress = { $ne: null };
    if (status === 'available') filter.userMacAddress = null;

    const keys = await UniqueKey.find(filter).sort({ createdAt: -1 });

    return reply.view('keys/list', {
      keys,
      filters: { env, status, gameCode },
      message: query.message,
      messageType: query.messageType
    });
  });

  // Create key form
  server.get('/admin/keys/create', async (request, reply) => {
    return reply.view('keys/create');
  });

  // Bulk create keys
  server.get('/admin/keys/bulk-create', async (request, reply) => {
    return reply.view('keys/bulk-create');
  });

  // Create single key
  server.post('/admin/keys/create', async (request, reply) => {
    let {
      keyCode,
      privilegeList,
      privilegeName,
      description,
      environment,
      gameCode,
      maxActivations,
      json,
      prefix,
    } = request.body as any;

    // default the prefix
    if (!prefix || prefix.length < 3) {
      prefix = '000';
    }

    try {
      // 🔑 Auto-generate if missing
      if (!keyCode) {
        keyCode = generateRandomKey(prefix);
      }

      keyCode = keyCode.toUpperCase();

      if (!isKeyValid(keyCode)) {
        throw new Error('Invalid key format');
      }

      const result = await UniqueKey.create({
        keyCode,
        privilegeList: parseInt(privilegeList),
        privilegeName: privilegeName || '',
        description: description || '',
        environment: environment || 'prod',
        gameCode: gameCode || '',
        maxActivations: parseInt(maxActivations) || 1
      });

      if (json) {
        return reply.send({ keyCode, result });
      }

      return reply.redirect(`/admin/keys?message=Key created successfully&messageType=success`);
    } catch (error: any) {
      if (json) {
        return reply.send({ error: error.message });
      }
      return reply.redirect(`/admin/keys?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });


  // Bulk create keys
  server.post('/admin/keys/bulk-create', async (request, reply) => {
    const {
      prefix,
      count,
      privilegeList,
      privilegeName,
      description,
      environment,
      gameCode,
      maxActivations
    } = request.body as any;

    try {
      const keys = [];
      const numKeys = parseInt(count) || 10;

      for (let i = 0; i < numKeys; i++) {
        const keyCode = generateKey(prefix);
        keys.push({
          keyCode: keyCode.toUpperCase(),
          privilegeList: parseInt(privilegeList),
          privilegeName: privilegeName || '',
          description: description || '',
          environment: environment || 'prod',
          gameCode: gameCode || '',
          maxActivations: parseInt(maxActivations) || 1
        });
      }

      await UniqueKey.insertMany(keys);

      return reply.redirect(`/admin/keys?message=${numKeys} keys created successfully&messageType=success`);
    } catch (error: any) {
      return reply.redirect(`/admin/keys?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });

  // View key details
  server.get('/admin/keys/:id', async (request, reply) => {
    const { id } = request.params as any;
    const key = await UniqueKey.findById(id);

    if (!key) {
      return reply.redirect('/admin/keys?message=Key not found&messageType=error');
    }

    return reply.view('keys/view', { key });
  });

  // Edit key form
  server.get('/admin/keys/:id/edit', async (request, reply) => {
    const { id } = request.params as any;
    const key = await UniqueKey.findById(id);

    if (!key) {
      return reply.redirect('/admin/keys?message=Key not found&messageType=error');
    }

    return reply.view('keys/edit', { key });
  });

  // Update key
  server.post('/admin/keys/:id/edit', async (request, reply) => {
    const { id } = request.params as any;
    const {
      privilegeList,
      privilegeName,
      description,
      environment,
      gameCode,
      maxActivations
    } = request.body as any;

    try {
      await UniqueKey.findByIdAndUpdate(id, {
        privilegeList: parseInt(privilegeList),
        privilegeName,
        description,
        environment,
        gameCode,
        maxActivations: parseInt(maxActivations)
      });

      return reply.redirect(`/admin/keys?message=Key updated successfully&messageType=success`);
    } catch (error: any) {
      return reply.redirect(`/admin/keys?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });

  // Deactivate/reset key
  server.post('/admin/keys/:id/reset', async (request, reply) => {
    const { id } = request.params as any;

    try {
      await UniqueKey.findByIdAndUpdate(id, {
        userMacAddress: null,
        activatedAt: null,
        activationCount: 0
      });

      return reply.redirect(`/admin/keys?message=Key reset successfully&messageType=success`);
    } catch (error: any) {
      return reply.redirect(`/admin/keys?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });

  // Delete key
  server.post('/admin/keys/:id/delete', async (request, reply) => {
    const { id } = request.params as any;

    try {
      await UniqueKey.findByIdAndDelete(id);
      return reply.redirect('/admin/keys?message=Key deleted successfully&messageType=success');
    } catch (error: any) {
      return reply.redirect(`/admin/keys?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });

  // Export keys as CSV
  server.get('/admin/keys/export/csv', async (request, reply) => {
    const { env } = request.query as any;

    const filter: any = {};
    if (env) filter.environment = env;

    const keys = await UniqueKey.find(filter);

    let csv = 'Key Code,Privilege,Privilege Name,Status,MAC Address,Activated At,Environment,Game Code\n';

    keys.forEach(key => {
      const status = key.userMacAddress ? 'Activated' : 'Available';
      const activatedAt = key.activatedAt ? key.activatedAt.toISOString() : '';
      csv += `${key.keyCode},${key.privilegeList},"${key.privilegeName}",${status},${key.userMacAddress || ''},${activatedAt},${key.environment},${key.gameCode}\n`;
    });

    reply.header('Content-Type', 'text/csv');
    reply.header('Content-Disposition', `attachment; filename="keys-${Date.now()}.csv"`);
    return csv;
  });
};

// Helper function to generate random key
function generateKey(prefix: string = '000'): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTVWXY';

  const parts = [prefix.toUpperCase()];

  for (let i = 0; i < 4; i++) {
    let part = '';
    for (let j = 0; j < 4; j++) {
      part += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(part);
  }

  return parts.join('-');
}