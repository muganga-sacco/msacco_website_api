const { query } = require("../config/db");
const { success, created, notFound } = require("../utils/response");

/**
 * Safely serialize `features` for PostgreSQL JSONB.
 * Accepts an array, an object, or an already-stringified JSON string.
 * Returns null when no value is provided so COALESCE leaves the column unchanged.
 */
const serializeFeatures = (features) => {
  if (features === undefined || features === null) return null;
  if (typeof features === "string") {
    // Validate it is actually JSON before passing through
    try { JSON.parse(features); return features; }
    catch { return JSON.stringify([]); }
  }
  return JSON.stringify(features);
};

// ── PUBLIC ─────────────────────────────────────────────────────────────────

/**
 * GET /api/digital-services
 * Returns all active digital services ordered by sort_order, then created_at.
 */
const getAll = async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, description, icon_bg, icon_color, image_url,
              features, cta_label, cta_link, sort_order, is_active,
              created_at, updated_at
       FROM digital_services
       WHERE is_active = TRUE
       ORDER BY sort_order ASC, created_at DESC`
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

/**
 * GET /api/digital-services/:id
 * Returns a single active digital service by ID.
 */
const getOne = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, description, icon_bg, icon_color, image_url,
              features, cta_label, cta_link, sort_order, is_active,
              created_at, updated_at
       FROM digital_services
       WHERE id = $1 AND is_active = TRUE`,
      [req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Digital service not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

// ── ADMIN ──────────────────────────────────────────────────────────────────

/**
 * GET /api/digital-services/admin/all
 * Returns ALL digital services (including inactive) for the admin panel.
 */
const adminGetAll = async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id, title, description, icon_bg, icon_color, image_url,
              features, cta_label, cta_link, sort_order, is_active,
              created_by, created_at, updated_at
       FROM digital_services
       ORDER BY sort_order ASC, created_at DESC`
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

/**
 * POST /api/digital-services
 * Creates a new digital service.
 * Columns: title, description, icon_bg, icon_color, image_url,
 *          features, cta_label, cta_link, sort_order, created_by
 */
const create = async (req, res, next) => {
  try {
    const {
      title,
      description,
      icon_bg,
      icon_color,
      image_url,
      features,
      cta_label,
      cta_link,
      sort_order,
    } = req.body;

    const result = await query(
      `INSERT INTO digital_services
         (title, description, icon_bg, icon_color, image_url,
          features, cta_label, cta_link, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        title,                                // $1
        description  ?? null,                 // $2
        icon_bg      ?? "#e8f0eb",            // $3
        icon_color   ?? "#2d6a4f",            // $4
        image_url    ?? null,                 // $5
        serializeFeatures(features) ?? "[]",  // $6
        cta_label    ?? null,                 // $7
        cta_link     ?? null,                 // $8
        sort_order   ?? 0,                    // $9
        req.user.id,                          // $10
      ]
    );
    return created(res, result.rows[0], "Digital service created");
  } catch (err) { next(err); }
};

/**
 * PUT /api/digital-services/:id
 * Partial update — only supplied fields overwrite existing values (COALESCE).
 * Columns updated: title, description, icon_bg, icon_color, image_url,
 *                  features, cta_label, cta_link, is_active, sort_order
 */
const update = async (req, res, next) => {
  try {
    const {
      title,
      description,
      icon_bg,
      icon_color,
      image_url,
      features,
      cta_label,
      cta_link,
      is_active,
      sort_order,
    } = req.body;

    // Build the params array in the same order as the SQL placeholders.
    // serializeFeatures returns null when features is not provided,
    // so COALESCE($6, features) will leave the column untouched.
    const params = [
      title       ?? null,          // $1
      description ?? null,          // $2
      icon_bg     ?? null,          // $3
      icon_color  ?? null,          // $4
      image_url   ?? null,          // $5
      serializeFeatures(features),  // $6  — null if not sent
      cta_label   ?? null,          // $7
      cta_link    ?? null,          // $8
      is_active   ?? null,          // $9
      sort_order  ?? null,          // $10
      req.params.id,                // $11
    ];

    const result = await query(
      `UPDATE digital_services SET
         title       = COALESCE($1,  title),
         description = COALESCE($2,  description),
         icon_bg     = COALESCE($3,  icon_bg),
         icon_color  = COALESCE($4,  icon_color),
         image_url   = COALESCE($5,  image_url),
         features    = COALESCE($6,  features),
         cta_label   = COALESCE($7,  cta_label),
         cta_link    = COALESCE($8,  cta_link),
         is_active   = COALESCE($9,  is_active),
         sort_order  = COALESCE($10, sort_order),
         updated_at  = NOW()
       WHERE id = $11
       RETURNING *`,
      params
    );

    if (!result.rows.length) return notFound(res, "Digital service not found");
    return success(res, result.rows[0], "Digital service updated");
  } catch (err) { next(err); }
};

/**
 * DELETE /api/digital-services/:id
 * Permanently removes a digital service.
 */
const remove = async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM digital_services WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Digital service not found");
    return success(res, {}, "Digital service deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, adminGetAll, create, update, remove };
