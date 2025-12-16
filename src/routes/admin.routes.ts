import { FastifyInstance } from 'fastify';
import { Product } from '../models/Product';
import { UniqueKey } from '../models/UniqueKey';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { Tag } from '../models/Tag';

import { version } from '../../package.json';
import { createLogger } from '../utils/logger';

const logger = createLogger('admin');

export default async (server: FastifyInstance) => {
  // Admin home page
  server.get('/admin', async (request, reply) => {
    try {
      // Gather statistics
      const [totalProducts, totalKeys, activatedKeys, totalUsers] = await Promise.all([
        Product.countDocuments(),
        UniqueKey.countDocuments(),
        UniqueKey.countDocuments({ userMacAddress: { $ne: null } }),
        User.countDocuments()
      ]);

      return reply.view('admin/home', {
        stats: {
          totalProducts,
          totalKeys,
          activatedKeys,
          totalUsers
        },
        version
      });
    } catch (error: any) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Sessions view
  server.get('/admin/sessions', async (request, reply) => {
    const { env, limit = '50' } = request.query as any;
    
    const filter: any = {};
    if (env) filter.environment = env;

    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return reply.view('admin/sessions', {
      sessions,
      filters: { env, limit }
    });
  });

  // Analytics view
  server.get('/admin/analytics', async (request, reply) => {
    const { env = 'prod' } = request.query as any;

    // Get stats for the selected environment
    const [
      totalTags,
      totalSessions,
      uniqueUsers,
      products,
      recentTags
    ] = await Promise.all([
      Tag.countDocuments({ environment: env }),
      Session.countDocuments({ environment: env }),
      Session.distinct('userMacAddress', { environment: env }).then(arr => arr.length),
      Product.find({ environment: env }),
      Tag.find({ environment: env })
        .sort({ createdAt: -1 })
        .limit(100)
    ]);

    // Group tags by name
    const tagCounts: Record<string, number> = {};
    recentTags.forEach(tag => {
      tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
    });

    return reply.view('admin/analytics', {
      env,
      stats: {
        totalTags,
        totalSessions,
        uniqueUsers,
        products: products.length
      },
      tagCounts,
      recentTags: recentTags.slice(0, 20)
    });
  });

  // API Documentation
  server.get('/admin/docs', async (request, reply) => {
    return reply.view('admin/docs');
  });
};