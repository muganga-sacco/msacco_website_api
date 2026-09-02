const { query } = require("../config/db");
const { success, created, notFound, error, paginated } = require("../utils/response");
const { paginate, buildPagination } = require("../utils/pagination");

// GET /api/products
const getAll = async (req, res, next) => {
  try {
    const { type, is_featured, is_active = true, page = 1, limit = 20 } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);

    let where = [];
    let params = [];
    let i = 1;

    if (type)       { where.push(`type = $${i++}`);       params.push(type); }
    if (is_featured !== undefined) { where.push(`is_featured = $${i++}`); params.push(is_featured === "true"); }
    if (is_active !== undefined)   { where.push(`is_active = $${i++}`);   params.push(is_active === "true" || is_active === true); }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const countResult = await query(`SELECT COUNT(*) FROM products ${whereClause}`, params);
    const total = countResult.rows[0].count;

    params.push(lim, offset);
    const result = await query(
      `SELECT * FROM products ${whereClause} ORDER BY sort_order ASC, created_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );

    return paginated(res, result.rows, buildPagination(total, p, lim));
  } catch (err) { next(err); }
};

// GET /api/products/:id
const getOne = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM products WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Product not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/products
const create = async (req, res, next) => {
  try {
    const { type, title, description, interest_rate, min_amount, max_amount, features, is_featured, featured_label, icon, cta_label, sort_order, eligibility, required_documents, application_process, image_url, targeted_customers, benefits, required_forms } = req.body;
    const result = await query(
      `INSERT INTO products (type, title, description, interest_rate, min_amount, max_amount, features, is_featured, featured_label, icon, cta_label, sort_order, created_by, eligibility, required_documents, application_process, image_url, targeted_customers, benefits, required_forms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [type, title, description, interest_rate, min_amount, max_amount, JSON.stringify(features || []), is_featured || false, featured_label, icon, cta_label || "Apply Now", sort_order || 0, req.user.id,
       JSON.stringify(eligibility || []), JSON.stringify(required_documents || []), application_process || null, image_url || null,
       JSON.stringify(targeted_customers || []), JSON.stringify(benefits || []), JSON.stringify(required_forms || [])]
    );
    return created(res, result.rows[0], "Product created");
  } catch (err) { next(err); }
};

// PUT /api/products/:id
const update = async (req, res, next) => {
  try {
    const body = req.body;

    // JSON array fields that need serialization
    const jsonFields = ["features", "eligibility", "required_documents", "targeted_customers", "benefits", "required_forms"];

    // All updatable fields
    const allowedFields = [
      "title", "description", "interest_rate", "min_amount", "max_amount",
      "features", "is_featured", "featured_label", "icon", "cta_label",
      "is_active", "sort_order", "eligibility", "required_documents",
      "application_process", "image_url", "targeted_customers", "benefits", "required_forms"
    ];

    const setClauses = [];
    const params = [];
    let i = 1;

    for (const field of allowedFields) {
      // Only include fields that were explicitly sent in the request
      if (!(field in body)) continue;

      let value = body[field];

      // Serialize JSON array fields; treat empty string as null
      if (jsonFields.includes(field)) {
        value = value !== null && value !== undefined ? JSON.stringify(value) : null;
      } else if (value === "") {
        value = null;
      }

      setClauses.push(`${field} = $${i++}`);
      params.push(value);
    }

    if (setClauses.length === 0) {
      return error(res, "No fields provided for update", 400);
    }

    setClauses.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const result = await query(
      `UPDATE products SET ${setClauses.join(", ")} WHERE id = $${i} RETURNING *`,
      params
    );

    if (!result.rows.length) return notFound(res, "Product not found");
    return success(res, result.rows[0], "Product updated");
  } catch (err) { next(err); }
};

// DELETE /api/products/:id
const remove = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM products WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Product not found");
    return success(res, {}, "Product deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
