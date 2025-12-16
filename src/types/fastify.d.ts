import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    isJson: boolean;
  }

  interface FastifyReply {
    wii(data: Record<string, any>): void;
  }
}
