import { User } from '../models/User';
import { Tag } from '../models/Tag';
import { ErrorCode, TrackingError } from '../constants/errorCodes';
import { createLogger } from '../utils/logger';
import { FastifyRequest } from 'fastify';
import { Session } from '../models/Session';
import { Product } from '../models/Product';

const logger = createLogger('track');

export async function handleTrack(body: any, request: FastifyRequest) {
  const {
    product_id,
    user_id,
    session_id,
    tag,
    attributes,
    delta,
    sequence,
    env
  } = body;

  // Validate required fields
  if (!product_id || !user_id || !session_id || !tag || !env) {
    logger.error('Missing required parameters', { 
      product_id: !!product_id,
      user_id: !!user_id,
      session_id: !!session_id,
      tag: !!tag,
      env
    });
    throw new TrackingError('Missing required parameters', ErrorCode.INTERNAL_ERROR);
  }

  // Find product
  const product = await Product.findOne({
    productHashkey: product_id
  });

  const productName = product?.name || 'Unknown';

  if (!product) {
    logger.error('Product not found', { product_id });
    throw new TrackingError('Product not found', ErrorCode.UNKNOWN_PRODUCT);
  }

  // Verify user exists
  const user = await User.findOne({ userHashkey: user_id });
  if (!user) {
    logger.error('User not found - please login again', { user_id });
    throw new TrackingError('User not found - please login again', ErrorCode.INTERNAL_ERROR);
  }

  // Check if session exists
  const session = await Session.findOne({ sessionHashkey: session_id });
  if (!session) {
    logger.error('Session not found - please login again', { session_id });
    throw new TrackingError('Session not found - please login again', ErrorCode.INTERNAL_ERROR);
  }

  // Save tag
  try {
    await Tag.create({
      name: tag,
      attributes: attributes || '',
      delta: parseInt(delta) || 0,
      sequence: parseInt(sequence) || 0,
      sessionHashkey: session_id,
      productHashkey: product_id,
      environment: env
    });

    logger.info('Tag received', { tag, attributes, env, productName });

    return {
      return_code: ErrorCode.TAG_RECEIVED
    };
  } catch (error) {
    console.error('Failed to save tag:', error);
    throw new TrackingError('Failed to save tag', ErrorCode.INTERNAL_ERROR);
  }
}