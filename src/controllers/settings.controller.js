const { query } = require("../config/db");
const { success, created, notFound, badRequest } = require("../utils/response");

/* ── SITE SETTINGS ─────────────────────────────────── */
const getSiteSettings = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM site_settings LIMIT 1");
    return success(res, result.rows[0] || {});
  } catch (err) { next(err); }
};

const upsertSiteSettings = async (req, res, next) => {
  try {
    const { site_name, tagline, logo_url, favicon_url, email, phone, address, about } = req.body;
    const existing = await query("SELECT id FROM site_settings LIMIT 1");

    let result;
    if (existing.rows.length) {
      result = await query(
        `UPDATE site_settings SET
          site_name  = COALESCE($1,site_name), tagline = COALESCE($2,tagline),
          logo_url   = COALESCE($3,logo_url), favicon_url = COALESCE($4,favicon_url),
          email      = COALESCE($5,email), phone = COALESCE($6,phone),
          address    = COALESCE($7,address), about = COALESCE($8,about),
          updated_by = $9, updated_at = NOW()
         WHERE id = $10 RETURNING *`,
        [site_name, tagline, logo_url, favicon_url, email, phone, address, about, req.user.id, existing.rows[0].id]
      );
    } else {
      result = await query(
        `INSERT INTO site_settings (site_name, tagline, logo_url, favicon_url, email, phone, address, about, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [site_name, tagline, logo_url, favicon_url, email, phone, address, about, req.user.id]
      );
    }
    return success(res, result.rows[0], "Site settings updated");
  } catch (err) { next(err); }
};

/* ── SOCIAL LINKS ──────────────────────────────────── */
const getAllSocials = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM social_links ORDER BY sort_order ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const createSocial = async (req, res, next) => {
  try {
    const { platform, url, icon, sort_order } = req.body;
    const result = await query(
      "INSERT INTO social_links (platform, url, icon, sort_order, updated_by) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [platform, url, icon, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Social link created");
  } catch (err) { next(err); }
};
const updateSocial = async (req, res, next) => {
  try {
    const { platform, url, icon, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE social_links SET platform=COALESCE($1,platform), url=COALESCE($2,url),
        icon=COALESCE($3,icon), sort_order=COALESCE($4,sort_order), is_active=COALESCE($5,is_active),
        updated_by=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [platform, url, icon, sort_order, is_active, req.user.id, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Social link not found");
    return success(res, result.rows[0], "Social link updated");
  } catch (err) { next(err); }
};
const removeSocial = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM social_links WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Social link not found");
    return success(res, {}, "Social link deleted");
  } catch (err) { next(err); }
};

/* ── HERO BANNERS ──────────────────────────────────── */
const getAllBanners = async (req, res, next) => {
  try {
    const { page } = req.query;
    const result = page
      ? await query("SELECT * FROM hero_banners WHERE page=$1 AND is_active=TRUE ORDER BY sort_order ASC", [page])
      : await query("SELECT * FROM hero_banners ORDER BY sort_order ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image_url, cta_label, cta_link, page, sort_order } = req.body;
    const result = await query(
      `INSERT INTO hero_banners (title, subtitle, image_url, cta_label, cta_link, page, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, subtitle, image_url, cta_label, cta_link, page, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Banner created");
  } catch (err) { next(err); }
};
const updateBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image_url, cta_label, cta_link, page, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE hero_banners SET title=COALESCE($1,title), subtitle=COALESCE($2,subtitle),
        image_url=COALESCE($3,image_url), cta_label=COALESCE($4,cta_label), cta_link=COALESCE($5,cta_link),
        page=COALESCE($6,page), sort_order=COALESCE($7,sort_order), is_active=COALESCE($8,is_active),
        updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, subtitle, image_url, cta_label, cta_link, page, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Banner not found");
    return success(res, result.rows[0], "Banner updated");
  } catch (err) { next(err); }
};
const removeBanner = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM hero_banners WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Banner not found");
    return success(res, {}, "Banner deleted");
  } catch (err) { next(err); }
};

/* ── FEATURE TOGGLES ───────────────────────────────── */
const getAllToggles = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM feature_toggles ORDER BY key ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const getToggle = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM feature_toggles WHERE key=$1", [req.params.key]);
    if (!result.rows.length) return notFound(res, "Toggle not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};
const createToggle = async (req, res, next) => {
  try {
    const { key, label, description, is_enabled } = req.body;
    const result = await query(
      "INSERT INTO feature_toggles (key, label, description, is_enabled, updated_by) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [key, label, description, is_enabled !== false, req.user.id]
    );
    return created(res, result.rows[0], "Toggle created");
  } catch (err) { next(err); }
};
const updateToggle = async (req, res, next) => {
  try {
    const { label, description, is_enabled } = req.body;
    const result = await query(
      `UPDATE feature_toggles SET label=COALESCE($1,label), description=COALESCE($2,description),
        is_enabled=COALESCE($3,is_enabled), updated_by=$4, updated_at=NOW()
       WHERE key=$5 RETURNING *`,
      [label, description, is_enabled, req.user.id, req.params.key]
    );
    if (!result.rows.length) return notFound(res, "Toggle not found");
    return success(res, result.rows[0], "Toggle updated");
  } catch (err) { next(err); }
};
const removeToggle = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM feature_toggles WHERE key=$1 RETURNING key", [req.params.key]);
    if (!result.rows.length) return notFound(res, "Toggle not found");
    return success(res, {}, "Toggle deleted");
  } catch (err) { next(err); }
};

/* ── USERS MANAGEMENT (admin only) ────────────────── */
const getAllUsers = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, name, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC"
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const updateUser = async (req, res, next) => {
  try {
    const { name, role, is_active } = req.body;
    const result = await query(
      `UPDATE users SET name=COALESCE($1,name), role=COALESCE($2,role),
        is_active=COALESCE($3,is_active), updated_at=NOW()
       WHERE id=$4
       RETURNING id, name, email, role, is_active, updated_at`,
      [name, role, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "User not found");
    return success(res, result.rows[0], "User updated");
  } catch (err) { next(err); }
};
const removeUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return badRequest(res, "Cannot delete yourself");
    const result = await query("DELETE FROM users WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "User not found");
    return success(res, {}, "User deleted");
  } catch (err) { next(err); }
};

module.exports = {
  getSiteSettings, upsertSiteSettings,
  getAllSocials, createSocial, updateSocial, removeSocial,
  getAllBanners, createBanner, updateBanner, removeBanner,
  getAllToggles, getToggle, createToggle, updateToggle, removeToggle,
  getAllUsers, updateUser, removeUser,
};
