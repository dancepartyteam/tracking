import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about our colors
winston.addColors(colors);

// Determine log level from environment
const level = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  return isDev ? 'debug' : 'info';
};

// Define format for console logs with service prefix
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const service = info.service ? `[${info.service}]` : '';
    const { timestamp, level, message, service: _, ...meta } = info;
    
    // Only add metadata if there's something to log
    const metaString = Object.keys(meta).length 
      ? `\n${JSON.stringify(meta, null, 2)}` 
      : '';
    
    return `${timestamp} ${service} ${level}: ${message}${metaString}`;
  }),
);

// Define format for file logs (no colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info) => {
    const service = info.service ? `[${info.service}]` : '';
    const { timestamp, level, message, service: _, ...meta } = info;
    
    // Compact JSON for file logs
    const metaString = Object.keys(meta).length 
      ? ` ${JSON.stringify(meta)}` 
      : '';
    
    return `${timestamp} ${service} ${level}: ${message}${metaString}`;
  }),
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: fileFormat,
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: fileFormat,
  }),
  // HTTP requests log
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'http.log'),
    level: 'http',
    format: fileFormat,
  }),
];

// Create the base logger
const baseLogger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: fileFormat,
    }),
  ],
});

// Create a logger factory that adds service context
export const createLogger = (service: string) => {
  return {
    error: (message: string, meta?: any) => baseLogger.error(message, { service, ...meta }),
    warn: (message: string, meta?: any) => baseLogger.warn(message, { service, ...meta }),
    info: (message: string, meta?: any) => baseLogger.info(message, { service, ...meta }),
    http: (message: string, meta?: any) => baseLogger.http(message, { service, ...meta }),
    debug: (message: string, meta?: any) => baseLogger.debug(message, { service, ...meta }),
  };
};

// Default logger (no service prefix)
const logger = {
  error: (message: string, meta?: any) => baseLogger.error(message, meta),
  warn: (message: string, meta?: any) => baseLogger.warn(message, meta),
  info: (message: string, meta?: any) => baseLogger.info(message, meta),
  http: (message: string, meta?: any) => baseLogger.http(message, meta),
  debug: (message: string, meta?: any) => baseLogger.debug(message, meta),
};

export default logger;