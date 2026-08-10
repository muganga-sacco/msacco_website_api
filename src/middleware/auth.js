const { verifyAccessToken } = require("../utils/jwt");
const { unauthorized, forbidden } = require("../utils/response");
const { query } = require("../config/db");

// Verify JWT and attach user to request
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return unauthorized(res, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const result = await query(
      "SELECT id, name, email, role, is_active FROM users WHERE id = $1",
      [decoded.id]
    );

    if (!result.rows.length) return unauthorized(res, "User not found");
    if (!result.rows[0].is_active) return unauthorized(res, "Account is deactivated");

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return unauthorized(res, "Token expired");
    if (err.name === "JsonWebTokenError")  return unauthorized(res, "Invalid token");
    return unauthorized(res, "Authentication failed");
  }
};

// Role-based access control — pass one or more allowed roles
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return unauthorized(res);
  if (!roles.includes(req.user.role)) {
    return forbidden(res, `Access denied. Required role: ${roles.join(" or ")}`);
  }
  next();
};

// Shorthand guards
const adminOnly   = authorize("admin");
const editorOrAdmin = authorize("admin", "editor");

// Optional auth — attaches user if token present but doesn't block
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);
      const result = await query(
        "SELECT id, name, email, role FROM users WHERE id = $1 AND is_active = TRUE",
        [decoded.id]
      );
      if (result.rows.length) req.user = result.rows[0];
    }
  } catch (_) { /* silent */ }
  next();
};

module.exports = { protect, authorize, adminOnly, editorOrAdmin, optionalAuth };
