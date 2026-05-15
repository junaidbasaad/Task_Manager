import { AppError } from "../utils/AppError.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err instanceof AppError ? err.statusCode : err.statusCode || 500;
  const message =
    err instanceof AppError
      ? err.message
      : err.message && status !== 500
        ? err.message
        : "Internal server error";

  if (process.env.NODE_ENV === "development") {
    console.error(err);
  } else if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(err instanceof AppError && err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV === "development" && err.stack ? { stack: err.stack } : {}),
  });
}
