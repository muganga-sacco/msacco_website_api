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
    const { title, description, interest_rate, min_amount, max_amount, features, is_featured, featured_label, icon, cta_label, is_active, sort_order, eligibility, required_documents, application_process, image_url, targeted_customers, benefits, required_forms } = req.body;

    // Normalize min_amount / max_amount: keep null if not provided, store as string otherwise
    const minAmt = min_amount !== undefined && min_amount !== null && min_amount !== "" ? String(min_amount) : null;
    const maxAmt = max_amount !== undefined && max_amount !== null && max_amount !== "" ? String(max_amount) : null;

    const result = await query(
      `UPDATE products SET
        title              = COALESCE($1, title),
        description        = COALESCE($2, description),
        interest_rate      = COALESCE($3, interest_rate),
        min_amount         = CASE WHEN $4::TEXT IS NOT NULL THEN $4 ELSE min_amount END,
        max_amount         = CASE WHEN $5::TEXT IS NOT NULL THEN $5 ELSE max_amount END,
        features           = COALESCE($6, features),
        is_featured        = COALESCE($7, is_featured),
        featured_label     = COALESCE($8, featured_label),
        icon               = COALESCE($9, icon),
        cta_label          = COALESCE($10, cta_label),
        is_active          = COALESCE($11, is_active),
        sort_order         = COALESCE($12, sort_order),
        eligibility        = COALESCE($13, eligibility),
        required_documents = COALESCE($14, required_documents),
        application_process = COALESCE($15, application_process),
        image_url          = COALESCE($16, image_url),
        targeted_customers = COALESCE($17, targeted_customers),
        benefits           = COALESCE($18, benefits),
        required_forms     = COALESCE($19, required_forms),
        updated_at         = NOW()
       WHERE id = $20
       RETURNING *`,
      [title, description, interest_rate, minAmt, maxAmt,
       features ? JSON.stringify(features) : null,
       is_featured, featured_label, icon, cta_label, is_active, sort_order,
       eligibility ? JSON.stringify(eligibility) : null,
       required_documents ? JSON.stringify(required_documents) : null,
       application_process || null,
       image_url || null,
       targeted_customers ? JSON.stringify(targeted_customers) : null,
       benefits ? JSON.stringify(benefits) : null,
       required_forms ? JSON.stringify(required_forms) : null,
       req.params.id]
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
