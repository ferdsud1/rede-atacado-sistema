export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode: number, code?: string, public readonly originalError?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
