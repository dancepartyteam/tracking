/**
 * DanceParty Tracking Server
 * 
 * Used for logging the metrics Just Dance 2-3-4-2014 and 2015 sends.
 * Also used for activating keys (redeeming codes) to unlock special content.
 */

import 'dotenv/config';
import Fastify, { fastify, FastifyReply, FastifyRequest } from 'fastify';
import formbody from '@fastify/formbody';
import view from '@fastify/view';
import ejs from 'ejs';
import path from 'path';
import ipaddr from "ipaddr.js";

import { connectDB } from './config/database';
import { TrackingError, ErrorCode } from './constants/errorCodes';
import { formatWiiResponse } from './utils/wii';
import { isDev } from './utils';
import { createLogger } from './utils/logger';

import httpLoggerPlugin from './plugins/logger.plugin';

import { handleLogin } from './handlers/login.handler';
import { handleTrack } from './handlers/track.handler';
import { handleActivateKey } from './handlers/activatekey.handler';

import productsRoutes from './routes/products.routes';
import keysRoutes from './routes/keys.routes';
import adminRoutes from './routes/admin.routes';

const logger = createLogger("tracking");

const server = Fastify({
  // logger: isDev,
  trustProxy: true
});

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "password";

// Parse form data
server.register(formbody);

// Register HTTP logger plugin if not in production
if (!isDev) {
  server.register(httpLoggerPlugin);
}

// Register view engine BEFORE routes
server.register(view, {
  engine: { ejs },
  root: path.join(__dirname, 'views'),
});

// Register admin routes
server.register(adminRoutes);
server.register(productsRoutes);
server.register(keysRoutes);

// Decorate request by adding isJSON property
server.decorateRequest('isJson', false);
server.addHook('onRequest', (request, _reply, done) => {
  const query = request.query as any;
  request.isJson = query?.json === 'true';
  done();
});

// Basic Auth for /admin
server.addHook("onRequest", (request, reply, done) => {
  if (request.url.startsWith("/admin")) {
    // Basic Auth check
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      reply
        .header("WWW-Authenticate", 'Basic realm="Admin Panel"')
        .status(401)
        .send();
      return;
    }

    // Decode credentials
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [username, password] = credentials.split(":");

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      reply
        .header("WWW-Authenticate", 'Basic realm="Admin Panel"')
        .status(401)
        .send();
      return;
    }
  }

  done();
});

// Decorate reply by adding the Wii response method
// If `isJson` is true, send the response as JSON
// Otherwise, send the response as Wii protocol
server.decorateReply('wii', function (
  this: FastifyReply,
  data: Record<string, any>
) {
  const request = this.request as FastifyRequest;

  if (request.isJson) {
    return this.send(data);
  }

  return this.send(formatWiiResponse(data));
});

/**
 * Main endpoint for Wii
 */
server.post('/', async (request, reply) => {
  const body = request.body as any;

  try {
    switch (body.action) {
      case 'login':
        return reply.wii(await handleLogin(body, request));

      case 'track':
        return reply.wii(await handleTrack(body, request));

      case 'activatekey':
        return reply.wii(await handleActivateKey(body, request));

      default:
        throw new TrackingError('Invalid action', ErrorCode.INTERNAL_ERROR);
    }
  } catch (err: any) {
    const code =
      err instanceof TrackingError
        ? err.returnCode
        : ErrorCode.INTERNAL_ERROR;

    return reply.wii({ return_code: code });
  }
});

/**
 * Health check
 */
server.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
});

/**
 * Bootstrap
 */
const start = async () => {
  try {
    await connectDB();

    const port = Number(process.env.PORT ?? 3000);
    await server.listen({ port, host: '0.0.0.0' });

    const fqdn = process.env.FQDN ?? `http://localhost:${port}`;

    logger.info(`Tracking server running on port ${port}`);
    logger.info(`Admin panel at: ${fqdn}/admin`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
