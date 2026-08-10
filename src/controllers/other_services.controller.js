const { query } = require("../config/db");
const { success, created, notFound } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { is_active, is_featured } = req.query;
    let where = [];
    let params = [];
    let i = 1;
    if (is_active !== undefined)    { where.push(`is_active = $${i++}`);   params.push(is_active === "true" || is_active === true); }
    if (is_featured !== undefined)  { where.push(`is_featured = $${i++}`); params.push(is_featured === "true"); }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await query(`SELECT * FROM other_services ${whereClause} ORDER BY sort_order ASC, created_at DESC`, params);
    return success(res, result.rows);
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM other_services WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Service not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { title, description, interest_rate, max_amount, features, eligibility, required_documents, application_process, is_featured, image_url, sort_order, targeted_customers, benefits, required_forms } = req.body;
    const result = await query(
      `INSERT INTO other_services (title, description, interest_rate, max_amount, features, eligibility, required_documents, application_process, is_featured, image_url, sort_order, created_by, targeted_customers, benefits, required_forms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [title, description, interest_rate || 0, max_amount || null,
       JSON.stringify(features || []), JSON.stringify(eligibility || []), JSON.stringify(required_documents || []),
       application_process || null, is_featured || false, image_url || null, sort_order || 0, req.user.id,
       JSON.stringify(targeted_customers || []), JSON.stringify(benefits || []), JSON.stringify(required_forms || [])]
    );
    return created(res, result.rows[0], "Service created");
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { title, description, interest_rate, max_amount, features, eligibility, required_documents, application_process, is_featured, image_url, is_active, sort_order, targeted_customers, benefits, required_forms } = req.body;
    const result = await query(
      `UPDATE other_services SET
        title               = COALESCE($1, title),
        description         = COALESCE($2, description),
        interest_rate       = COALESCE($3, interest_rate),
        max_amount          = COALESCE($4, max_amount),
        features            = COALESCE($5, features),
        eligibility         = COALESCE($6, eligibility),
        required_documents  = COALESCE($7, required_documents),
        application_process = COALESCE($8, application_process),
        is_featured         = COALESCE($9, is_featured),
        image_url           = COALESCE($10, image_url),
        is_active           = COALESCE($11, is_active),
        sort_order          = COALESCE($12, sort_order),
        targeted_customers  = COALESCE($13, targeted_customers),
        benefits            = COALESCE($14, benefits),
        required_forms      = COALESCE($15, required_forms),
        updated_at          = NOW()
       WHERE id = $16 RETURNING *`,
      [title, description, interest_rate, max_amount,
       features ? JSON.stringify(features) : null,
       eligibility ? JSON.stringify(eligibility) : null,
       required_documents ? JSON.stringify(required_documents) : null,
       application_process || null,
       is_featured, image_url, is_active, sort_order,
       targeted_customers ? JSON.stringify(targeted_customers) : null,
       benefits ? JSON.stringify(benefits) : null,
       required_forms ? JSON.stringify(required_forms) : null,
       req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Service not found");
    return success(res, result.rows[0], "Service updated");
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM other_services WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Service not found");
    return success(res, {}, "Service deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove };
