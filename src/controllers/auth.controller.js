const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshExpiry } = require("../utils/jwt");
const { success, created, error, unauthorized, badRequest } = require("../utils/response");

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "member" } = req.body;

    const exists = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) return badRequest(res, "Email already registered");

    const hashed = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, hashed, role === "admin" ? "member" : role] // prevent self-elevation to admin
    );

    const user = result.rows[0];
    const accessToken  = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, getRefreshExpiry()]
    );

    return created(res, { user, accessToken, refreshToken }, "Registration successful");
  } catch (err) { next(err); }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      "SELECT id, name, email, password, role, is_active FROM users WHERE email = $1",
      [email]
    );

    if (!result.rows.length) return unauthorized(res, "Invalid credentials");
    const user = result.rows[0];

    if (!user.is_active) return unauthorized(res, "Account is deactivated");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return unauthorized(res, "Invalid credentials");

    const accessToken  = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id });

    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, getRefreshExpiry()]
    );

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const { password: _, ...userOut } = user;
    return success(res, { user: userOut, accessToken, refreshToken }, "Login successful");
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return badRequest(res, "Refresh token required");

    const stored = await query(
      "SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    if (!stored.rows.length) return unauthorized(res, "Invalid or expired refresh token");

    const decoded = verifyRefreshToken(token);
    const userResult = await query(
      "SELECT id, role, is_active FROM users WHERE id = $1",
      [decoded.id]
    );

    if (!userResult.rows.length || !userResult.rows[0].is_active) {
      return unauthorized(res, "User not found or inactive");
    }

    const user = userResult.rows[0];
    const newAccessToken  = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    await query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    await query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, newRefreshToken, getRefreshExpiry()]
    );

    return success(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, "Token refreshed");
  } catch (err) { next(err); }
};

// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    return success(res, {}, "Logged out successfully");
  } catch (err) { next(err); }
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, email, role, avatar, is_active, last_login, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/auth/me
const updateMe = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const result = await query(
      `UPDATE users SET name = COALESCE($1, name), avatar = COALESCE($2, avatar), updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, email, role, avatar, updated_at`,
      [name, avatar, req.user.id]
    );
    return success(res, result.rows[0], "Profile updated");
  } catch (err) { next(err); }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query("SELECT password FROM users WHERE id = $1", [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password);
    if (!isMatch) return badRequest(res, "Current password is incorrect");
    const hashed = await bcrypt.hash(newPassword, 12);
    await query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [hashed, req.user.id]);
    await query("DELETE FROM refresh_tokens WHERE user_id = $1", [req.user.id]);
    return success(res, {}, "Password changed. Please login again.");
  } catch (err) { next(err); }
};

module.exports = { register, login, refreshToken, logout, getMe, updateMe, changePassword };
