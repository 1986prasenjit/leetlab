class ApiError extends Error {
  constructor(statusCode, message = "Something went Wrong", stack, error = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.data = null;
    this.error = error;
    this.success = false;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
