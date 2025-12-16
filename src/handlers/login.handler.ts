import { FastifyRequest } from 'fastify';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { TokenService } from '../services/token.service';
import { ErrorCode, TrackingError } from '../constants/errorCodes';
import { createLogger } from '../utils/logger';

const logger = createLogger('activatekey');

export async function handleLogin(body: any, request: FastifyRequest) {
  const { token, product_code, product_password, env } = body;

  // Validate required fields
  if (!token || !product_code || !product_password || !env) {
    logger.error('Missing required parameters', { 
      token: !!token, 
      product_code: !!product_code,
      product_password: !!product_password,
      env
    });
    throw new TrackingError('Missing required parameters', ErrorCode.INTERNAL_ERROR);
  };
  
  // Find product
  const product = await Product.findOne({
    code: product_code,
    password: product_password,
    environment: env
  });
  const productName = product?.name || 'Unknown';

  if (!product) {
    logger.error('Product not found', { product_code, product_password, env });
    throw new TrackingError('Product not found', ErrorCode.UNKNOWN_PRODUCT);
  }

  // Decrypt token to get MAC address
  const decrypted = TokenService.decryptToken(token, product.token);
  if (!decrypted) {
    logger.error('Invalid token', { token });
    throw new TrackingError('Invalid token', ErrorCode.TOKEN_INCORRECT);
  }

  const { macAddress } = decrypted;
  const userHashkey = TokenService.generateHashKey([macAddress]);

  // Find or create user
  let user = await User.findOne({ userHashkey });
  if (!user) {
    logger.info('New user created', { userHashkey, macAddress });
    user = await User.create({
      userHashkey,
      macAddress,
      shardId: 'MAIN_Shard'
    });
  }

  // Create session
  const sessionHashkey = TokenService.generateHashKey([
    macAddress,
    Date.now().toString(),
    product.productHashkey
  ]);

  await Session.create({
    sessionHashkey,
    userMacAddress: macAddress,
    userHashkey: user.userHashkey,
    ipv4: request.ip,
    productHashkey: product.productHashkey,
    environment: env
  });

  logger.info('Login successful', { userHashkey, macAddress, env, productName });
  return {
    product_id: product.productHashkey,
    user_id: user.userHashkey,
    session_id: sessionHashkey,
    return_code: ErrorCode.LOGIN_SUCCESSFUL
  };
}