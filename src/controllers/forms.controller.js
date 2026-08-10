const { query } = require("../config/db");
const { success, created, notFound, error } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { is_active } = req.query;
    let where = [];
    let params = [];
    let i = 1;
    if (is_active !== undefined) {
      where.push(`is_active = $${i++}`);
      params.push(is_active === "true" || is_active === true);
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await query(
      `SELECT * FROM forms ${whereClause} ORDER BY sort_order ASC, created_at DESC`,
      params
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM forms WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Form not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { title, file_url, category, sort_order } = req.body;
    if (!title || !file_url) return error(res, "Title and file are required", 400);
    const result = await query(
      `INSERT INTO forms (title, file_url, category, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [title, file_url, category || "other", sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Form created");
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { title, file_url, category, is_active, sort_order } = req.body;
    const result = await query(
      `UPDATE forms SET
        title      = COALESCE($1, title),
        file_url   = COALESCE($2, file_url),
        category   = COALESCE($3, category),
        is_active  = COALESCE($4, is_active),
        sort_order = COALESCE($5, sort_order),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, file_url, category, is_active, sort_order, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Form not found");
    return success(res, result.rows[0], "Form updated");
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM forms WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Form not found");
    return success(res, {}, "Form deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
