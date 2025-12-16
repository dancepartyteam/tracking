import { FastifyRequest } from 'fastify';
import { Product } from '../models/Product';
import { UniqueKey } from '../models/UniqueKey';
import { TokenService } from '../services/token.service';
import { ErrorCode, TrackingError } from '../constants/errorCodes';
import { isKeyValid } from '../utils/wii';
import { createLogger } from '../utils/logger';

const logger = createLogger('activatekey');

export async function handleActivateKey(body: any, request: FastifyRequest) {
  const { token, product_code, product_password, env, key } = body;

  // Validate required fields
  if (!token || !product_code || !product_password || !env || !key) {
    logger.error('Missing required parameters', { 
      token: !!token, 
      product_code: !!product_code,
      product_password: !!product_password,
      env,
      key: key?.substring(0, 10) + '...' // Partial key for security
    });
    throw new TrackingError('Missing required parameters', ErrorCode.INTERNAL_ERROR);
  }

  // Validate key format
  if (!isKeyValid(key)) {
    logger.error('Invalid key format', { key });
    throw new TrackingError('Invalid key format', ErrorCode.INVALID_KEY);
  }

  // Find product
  const product = await Product.findOne({
    code: product_code,
    password: product_password,
    environment: env
  });

  const productName = product?.name || 'Unknown';

  if (!product) {
    logger.warn('Product not found', { product_code, product_password, env });
    throw new TrackingError('Product not found', ErrorCode.TOKEN_INCORRECT);
  }

  // Decrypt token
  const decrypted = TokenService.decryptToken(token, product.token);
  if (!decrypted) {
    logger.error('Invalid token', { token });
    throw new TrackingError('Invalid token', ErrorCode.TOKEN_INCORRECT);
  }

  const { macAddress } = decrypted;

  // Find key in database
  const uniqueKey = await UniqueKey.findOne({ 
    keyCode: key.toUpperCase(),
    environment: env 
  });

  if (!uniqueKey) {
    logger.error('Key not found', { key });
    throw new TrackingError('Key not found', ErrorCode.INVALID_KEY);
  }

  // Check if key has reached max activations
  if (uniqueKey.activationCount >= uniqueKey.maxActivations) {
    // NOTE: We disabled this to not let people use a key after it's been used
    // If already activated by this user, allow (idempotent)
    // if (uniqueKey.userMacAddress === macAddress) {
    //   return {
    //     return_code: ErrorCode.KEY_ACTIVATION_SUCCESSFUL,
    //     unlocked_privileges: uniqueKey.privilegeList
    //   };
    // }
    logger.error('Key already activated by another user', { key });
    throw new TrackingError('Key already activated by another user', ErrorCode.KEY_ALREADY_ACTIVATED);
  }

  // Check if already activated by different user
  if (uniqueKey.userMacAddress && uniqueKey.userMacAddress !== macAddress) {
    logger.error('Key already activated by another user', { key });
    throw new TrackingError('Key already activated by another user', ErrorCode.KEY_ALREADY_ACTIVATED);
  }

  // Activate key
  uniqueKey.userMacAddress = macAddress;
  uniqueKey.activatedAt = new Date();
  uniqueKey.activationCount += 1;
  await uniqueKey.save();

  logger.info('Key activated successfully', { key, env, productName });

  return {
    return_code: ErrorCode.KEY_ACTIVATION_SUCCESSFUL,
    unlocked_privileges: uniqueKey.privilegeList
  };
}