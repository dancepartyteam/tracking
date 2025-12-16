// Tracking Server Error Codes
// We found these by reverse engineering JD15 and JD14.

export enum ErrorCode {
  // Undefined error
  INTERNAL_ERROR = 0,
  
  // Login is successful
  LOGIN_SUCCESSFUL = 1,
  
  // Tag has been received
  TAG_RECEIVED = 2,
  
  // Tag not configured (TODO)
  TAG_NOT_CONFIGURED = 3,
  
  // Console token is invalid
  TOKEN_INCORRECT = 4,
  
  // Key activation succeeded
  KEY_ACTIVATION_SUCCESSFUL = 5,
  
  // Key already activated by another user
  KEY_ALREADY_ACTIVATED = 6,
  
  // The key does not exist
  INVALID_KEY = 7,

  // Unknown product
  UNKNOWN_PRODUCT = 8
}

// Custom error class for tracking errors
export class TrackingError extends Error {
  constructor(
    message: string,
    public returnCode: ErrorCode
  ) {
    super(message);
    this.name = 'TrackingError';
  }
}