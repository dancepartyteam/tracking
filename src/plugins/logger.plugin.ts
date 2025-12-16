import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import logger from '../utils/logger';

async function httpLoggerPlugin(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.log = logger as any; // Make logger available on request
  });

  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const responseTime = reply.getResponseTime();
    const message = `${request.method} ${request.url} ${reply.statusCode} - ${responseTime.toFixed(2)}ms - ${request.ip}`;
    
    if (reply.statusCode >= 500) {
      logger.error(message);
    } else if (reply.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.http(message);
    }
  });
}

export default fp(httpLoggerPlugin);