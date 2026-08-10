const { query } = require("../config/db");
const { success, created, notFound, paginated } = require("../utils/response");
const { paginate, buildPagination } = require("../utils/pagination");

// GET /api/guides
const getAll = async (req, res, next) => {
  try {
    const { category, is_featured, search, page = 1, limit = 12 } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);

    const conditions = ["is_active = TRUE"];
    const params = [];
    let i = 1;

    if (category)   { conditions.push(`category = $${i++}`);     params.push(category); }
    if (is_featured !== undefined) { conditions.push(`is_featured = $${i++}`); params.push(is_featured === "true"); }
    if (search)     { conditions.push(`title ILIKE $${i++}`);    params.push(`%${search}%`); }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const count = await query(`SELECT COUNT(*) FROM video_guides ${where}`, params);

    params.push(lim, offset);
    const result = await query(
      `SELECT * FROM video_guides ${where} ORDER BY sort_order ASC, created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return paginated(res, result.rows, buildPagination(count.rows[0].count, p, lim));
  } catch (err) { next(err); }
};

// GET /api/guides/:id
const getOne = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM video_guides WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Guide not found");
    // Increment view count
    await query("UPDATE video_guides SET views = views + 1 WHERE id = $1", [req.params.id]);
    return success(res, { ...result.rows[0], views: result.rows[0].views + 1 });
  } catch (err) { next(err); }
};

// POST /api/guides
const create = async (req, res, next) => {
  try {
    const { title, description, category, duration, thumbnail, video_url, is_featured, sort_order } = req.body;
    const result = await query(
      `INSERT INTO video_guides (title, description, category, duration, thumbnail, video_url, is_featured, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, description, category || "getting_started", duration, thumbnail, video_url, is_featured || false, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Guide created");
  } catch (err) { next(err); }
};

// PUT /api/guides/:id
const update = async (req, res, next) => {
  try {
    const { title, description, category, duration, thumbnail, video_url, is_featured, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE video_guides SET
        title      = COALESCE($1,title), description = COALESCE($2,description),
        category   = COALESCE($3,category), duration = COALESCE($4,duration),
        thumbnail  = COALESCE($5,thumbnail), video_url = COALESCE($6,video_url),
        is_featured = COALESCE($7,is_featured), sort_order = COALESCE($8,sort_order),
        is_active  = COALESCE($9,is_active), updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [title, description, category, duration, thumbnail, video_url, is_featured, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Guide not found");
    return success(res, result.rows[0], "Guide updated");
  } catch (err) { next(err); }
};

// DELETE /api/guides/:id
const remove = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM video_guides WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Guide not found");
    return success(res, {}, "Guide deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
