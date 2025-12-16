import { FastifyInstance } from 'fastify';
import { Product } from '../models/Product';
import { TokenService } from '../services/token.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('products');

export default async (server: FastifyInstance) => {
  // List all products
  server.get('/admin/products', async (request, reply) => {
    const { env, search } = request.query as any;
    
    const filter: any = {};
    if (env) filter.environment = env;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    
    return reply.view('products/list', {
      products,
      filters: { env, search },
      message: request.query.message,
      messageType: request.query.messageType
    });
  });

  // Create product form
  server.get('/admin/products/create', async (request, reply) => {
    return reply.view('products/create');
  });

  // Create product
  server.post('/admin/products/create', async (request, reply) => {
    const { name, code, environment, product_code, password } = request.body as any;

    try {
      let productHashkey: string;
      let productCode: string;
      let productPassword: string;
      let token: string;

      if (product_code && password) {
        // Use custom values
        productHashkey = TokenService.generateHashKey([code, environment]);
        productCode = product_code;
        productPassword = password;
        token = TokenService.generateHashKey([productCode, productPassword]);
      } else {
        // Auto-generate
        productHashkey = TokenService.generateHashKey([code, environment]);
        productCode = TokenService.generateHashKey([code]);
        productPassword = TokenService.generatePassword(8);
        token = TokenService.generateHashKey([productCode, productPassword]);
      }

      await Product.create({
        productHashkey,
        name,
        code: productCode,
        password: productPassword,
        token,
        environment
      });

      return reply.redirect(`/admin/products?message=Product created successfully&messageType=success`);
    } catch (error: any) {
      return reply.redirect(`/admin/products?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });

  // View product details
  server.get('/admin/products/:id', async (request, reply) => {
    const { id } = request.params as any;
    const product = await Product.findById(id);

    if (!product) {
      return reply.redirect('/admin/products?message=Product not found&messageType=error');
    }

    return reply.view('products/view', { product });
  });

  // Edit product form
  server.get('/admin/products/:id/edit', async (request, reply) => {
    const { id } = request.params as any;
    const product = await Product.findById(id);

    if (!product) {
      return reply.redirect('/admin/products?message=Product not found&messageType=error');
    }

    return reply.view('products/edit', { product });
  });

  // Update product
  server.post('/admin/products/:id/edit', async (request, reply) => {
    const { id } = request.params as any;
    const { name, code, environment, password } = request.body as any;

    try {
      await Product.findByIdAndUpdate(id, {
        name,
        code,
        environment,
        password
      });

      return reply.redirect(`/admin/products?message=Product updated successfully&messageType=success`);
    } catch (error: any) {
      return reply.redirect(`/admin/products?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });

  // Delete product
  server.post('/admin/products/:id/delete', async (request, reply) => {
    const { id } = request.params as any;

    try {
      await Product.findByIdAndDelete(id);
      return reply.redirect('/admin/products?message=Product deleted successfully&messageType=success');
    } catch (error: any) {
      return reply.redirect(`/admin/products?message=${encodeURIComponent(error.message)}&messageType=error`);
    }
  });
};