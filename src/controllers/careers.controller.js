const { query } = require("../config/db");
const { success, created, notFound, paginated } = require("../utils/response");
const { paginate, buildPagination } = require("../utils/pagination");

// GET /api/careers
const getAll = async (req, res, next) => {
  try {
    const { is_active, employment_type, department, page = 1, limit = 10 } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);

    const conditions = [];
    const params = [];
    let i = 1;

    if (is_active !== undefined) { conditions.push(`is_active = $${i++}`); params.push(is_active === "true"); }
    if (employment_type)         { conditions.push(`employment_type = $${i++}`); params.push(employment_type); }
    if (department)              { conditions.push(`department ILIKE $${i++}`); params.push(`%${department}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const count = await query(`SELECT COUNT(*) FROM careers ${where}`, params);

    params.push(lim, offset);
    const result = await query(
      `SELECT * FROM careers ${where} ORDER BY posted_at DESC LIMIT $${i++} OFFSET $${i}`,
      params
    );
    return paginated(res, result.rows, buildPagination(count.rows[0].count, p, lim));
  } catch (err) { next(err); }
};

// GET /api/careers/:id
const getOne = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM careers WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Job not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

// POST /api/careers
const create = async (req, res, next) => {
  try {
    const { title, department, location, employment_type, description, requirements, benefits, salary_range, deadline, max_age } = req.body;
    const result = await query(
      `INSERT INTO careers (title, department, location, employment_type, description, requirements, benefits, salary_range, deadline, max_age, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, department, location || "Kigali", employment_type || "full-time", description,
       JSON.stringify(requirements || []), JSON.stringify(benefits || []), salary_range, deadline, max_age || null, req.user.id]
    );
    return created(res, result.rows[0], "Job posting created");
  } catch (err) { next(err); }
};

// PUT /api/careers/:id
const update = async (req, res, next) => {
  try {
    const { title, department, location, employment_type, description, requirements, benefits, salary_range, deadline, max_age, is_active } = req.body;
    const result = await query(
      `UPDATE careers SET
        title = COALESCE($1,title), department = COALESCE($2,department),
        location = COALESCE($3,location), employment_type = COALESCE($4,employment_type),
        description = COALESCE($5,description),
        requirements = COALESCE($6,requirements), benefits = COALESCE($7,benefits),
        salary_range = COALESCE($8,salary_range), deadline = COALESCE($9,deadline),
        max_age    = COALESCE($10,max_age),
        is_active  = COALESCE($11,is_active), updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [title, department, location, employment_type, description,
       requirements ? JSON.stringify(requirements) : null,
       benefits ? JSON.stringify(benefits) : null,
       salary_range, deadline, max_age, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Job not found");
    return success(res, result.rows[0], "Job updated");
  } catch (err) { next(err); }
};

// POST /api/careers/apply
const apply = async (req, res, next) => {
  try {
    const {
      career_id, full_name, date_of_birth, phone, email,
      marital_status, gender,
      reference_1_name, reference_1_email, reference_1_phone,
      reference_2_name, reference_2_email, reference_2_phone,
      reference_3_name, reference_3_email, reference_3_phone,
    } = req.body;

    if (!full_name || !date_of_birth || !marital_status || !gender)
      return res.status(400).json({ success: false, message: "Missing required fields" });
    if (!phone && !email)
      return res.status(400).json({ success: false, message: "Phone or Email is required" });

    const idFile = req.files?.id_copy?.[0];
    const cvFile = req.files?.cv?.[0];
    const academicFile = req.files?.academic_paper?.[0];
    const otherFile = req.files?.other_documents?.[0];

    if (!idFile || !cvFile || !academicFile)
      return res.status(400).json({ success: false, message: "ID, CV, and Academic paper are required" });

    const baseUrl = `/uploads/`;
    const result = await query(
      `INSERT INTO job_applications
        (career_id, full_name, date_of_birth, phone, email, marital_status, gender,
         id_file_url, cv_file_url, academic_file_url, other_docs_url,
         reference_1_name, reference_1_email, reference_1_phone,
         reference_2_name, reference_2_email, reference_2_phone,
         reference_3_name, reference_3_email, reference_3_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING id`,
      [career_id, full_name, date_of_birth, phone||null, email||null, marital_status, gender,
       baseUrl + idFile.filename, baseUrl + cvFile.filename, baseUrl + academicFile.filename, otherFile ? baseUrl + otherFile.filename : null,
       reference_1_name||null, reference_1_email||null, reference_1_phone||null,
       reference_2_name||null, reference_2_email||null, reference_2_phone||null,
       reference_3_name||null, reference_3_email||null, reference_3_phone||null]
    );
    return created(res, { id: result.rows[0].id }, "Application submitted successfully");
  } catch (err) { next(err); }
};

// DELETE /api/careers/:id
const remove = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM careers WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Job not found");
    return success(res, {}, "Job deleted");
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, apply };
