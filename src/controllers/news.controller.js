const { query } = require("../config/db");
const { success, created, notFound, paginated } = require("../utils/response");
const { paginate, buildPagination } = require("../utils/pagination");

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// GET /api/news
const getAll = async (req, res, next) => {
  try {
    const { status, tag, is_featured, search, section, subsection, page = 1, limit = 10 } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);

    const conditions = [];
    const params = [];
    let i = 1;

    if (status)      { conditions.push(`status = $${i++}`);       params.push(status); }
    if (tag)         { conditions.push(`tag ILIKE $${i++}`);       params.push(`%${tag}%`); }
    if (section)     { conditions.push(`section = $${i++}`);       params.push(section); }
    if (subsection)  { conditions.push(`subsection = $${i++}`);    params.push(subsection); }
    if (is_featured !== undefined) { conditions.push(`is_featured = $${i++}`); params.push(is_featured === "true"); }
    if (search)      { conditions.push(`(title ILIKE $${i} OR excerpt ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const count = await query(`SELECT COUNT(*) FROM news ${where}`, params);

    params.push(lim, offset);
    const result = await query(
      `SELECT id, title, slug, excerpt, tag, image_url, file_url, is_featured, status, section, subsection, sort_order, published_at, created_at
       FROM news ${where} ORDER BY sort_order ASC, created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return paginated(res, result.rows, buildPagination(count.rows[0].count, p, lim));
  } catch (err) { next(err); }
};

// GET /api/news/:id  (also supports slug)
const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUUID = /^[0-9a-f-]{36}$/.test(id);
    const result = await query(
      `SELECT * FROM news WHERE ${isUUID ? "id" : "slug"} = $1`,
      [id]
    );
    if (!result.rows.length) return notFound(res, "Article not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/news
const create = async (req, res, next) => {
  try {
    const { title, excerpt, content, tag, image_url, file_url, is_featured, status, section, subsection, sort_order } = req.body;
    const slug = slugify(title);

    const result = await query(
      `INSERT INTO news (title, slug, excerpt, content, tag, image_url, file_url, is_featured, status, section, subsection, sort_order, published_at, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [title, slug, excerpt, content, tag, image_url, file_url || null, is_featured || false,
       status || "draft", section || "news", subsection || null, sort_order || 0,
       status === "published" ? new Date() : null, req.user.id]
    );
    return created(res, result.rows[0], "Article created");
  } catch (err) { next(err); }
};

// PUT /api/news/:id
const update = async (req, res, next) => {
  try {
    const { title, excerpt, content, tag, image_url, file_url, is_featured, status, section, subsection, sort_order } = req.body;
    const slug = title ? slugify(title) : null;
    const publishedAt = status === "published" ? "COALESCE(published_at, NOW())" : "published_at";

    const result = await query(
      `UPDATE news SET
        title      = COALESCE($1,title),
        slug       = COALESCE($2,slug),
        excerpt    = COALESCE($3,excerpt),
        content    = COALESCE($4,content),
        tag        = COALESCE($5,tag),
        image_url  = COALESCE($6,image_url),
        file_url   = COALESCE($7,file_url),
        is_featured = COALESCE($8,is_featured),
        status     = COALESCE($9,status),
        section    = COALESCE($10,section),
        subsection = COALESCE($11,subsection),
        sort_order = COALESCE($12,sort_order),
        published_at = ${publishedAt},
        updated_at = NOW()
       WHERE id = $13 RETURNING *`,
      [title, slug, excerpt, content, tag, image_url, file_url, is_featured, status, section, subsection, sort_order, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Article not found");
    return success(res, result.rows[0], "Article updated");
  } catch (err) { next(err); }
};

// DELETE /api/news/:id
const remove = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM news WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Article not found");
    return success(res, {}, "Article deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
