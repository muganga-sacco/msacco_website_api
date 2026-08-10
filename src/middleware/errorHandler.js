const { validationResult } = require("express-validator");
const { badRequest, error } = require("../utils/response");

// Express-validator middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest(res, "Validation failed", errors.array());
  }
  next();
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  // PostgreSQL unique violation
  if (err.code === "23505") {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || "field";
    return badRequest(res, `${field} already exists`);
  }

  // PostgreSQL foreign key violation
  if (err.code === "23503") {
    return badRequest(res, "Referenced resource not found");
  }

  // PostgreSQL not-null violation
  if (err.code === "23502") {
    return badRequest(res, `${err.column} is required`);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") return error(res, "Invalid token", 401);
  if (err.name === "TokenExpiredError") return error(res, "Token expired", 401);

  return error(res, err.message || "Internal server error", err.statusCode || 500);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
};

module.exports = { validate, errorHandler, notFoundHandler };
