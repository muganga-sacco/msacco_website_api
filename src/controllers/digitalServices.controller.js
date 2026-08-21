const { query } = require("../config/db");
const { success, created, notFound } = require("../utils/response");

// ── PUBLIC ─────────────────────────────────────────────────────────────────

/**
 * GET /api/digital-services
 * Returns all active digital services, ordered by sort_order then created_at.
 * Supports optional ?is_featured=true filter.
 */
const getAll = async (req, res, next) => {
  try {
    const { is_featured } = req.query;
    const where = ["is_active = TRUE"];
    const params = [];
    let i = 1;

    if (is_featured !== undefined) {
      where.push(`is_featured = $${i++}`);
      params.push(is_featured === "true");
    }

    const result = await query(
      `SELECT * FROM digital_services WHERE ${where.join(" AND ")} ORDER BY sort_order ASC, created_at DESC`,
      params
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
      "SELECT * FROM digital_services WHERE id = $1 AND is_active = TRUE",
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
const adminGetAll = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM digital_services ORDER BY sort_order ASC, created_at DESC"
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

/**
 * POST /api/digital-services
 * Creates a new digital service.
 */
const create = async (req, res, next) => {
  try {
    const {
      title, description, icon_bg, icon_color, image_url,
      features, cta_label, cta_link,
      is_featured, sort_order,
    } = req.body;

    const result = await query(
      `INSERT INTO digital_services
        (title, description, icon_bg, icon_color, image_url, features,
         cta_label, cta_link, is_featured, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        title,
        description   || null,
        icon_bg       || "#e8f0eb",
        icon_color    || "#2d6a4f",
        image_url     || null,
        JSON.stringify(features || []),
        cta_label     || null,
        cta_link      || null,
        is_featured   || false,
        sort_order    || 0,
        req.user.id,
      ]
    );
    return created(res, result.rows[0], "Digital service created");
  } catch (err) { next(err); }
};

/**
 * PUT /api/digital-services/:id
 * Updates an existing digital service (partial update via COALESCE).
 */
const update = async (req, res, next) => {
  try {
    const {
      title, description, icon_bg, icon_color, image_url,
      features, cta_label, cta_link,
      is_featured, is_active, sort_order,
    } = req.body;

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
        is_featured = COALESCE($9,  is_featured),
        is_active   = COALESCE($10, is_active),
        sort_order  = COALESCE($11, sort_order),
        updated_at  = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        title,
        description,
        icon_bg,
        icon_color,
        image_url,
        features ? JSON.stringify(features) : null,
        cta_label,
        cta_link,
        is_featured,
        is_active,
        sort_order,
        req.params.id,
      ]
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
