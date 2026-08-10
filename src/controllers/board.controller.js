const { query } = require("../config/db");
const { success, created, notFound, paginated } = require("../utils/response");
const { paginate, buildPagination } = require("../utils/pagination");

/* ── BOARD MEMBERS ─────────────────────────────────── */

const getAllBoard = async (req, res, next) => {
  try {
    const { is_active = true, page = 1, limit = 20, type } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const active = is_active === "true" || is_active === true;

    let where = "WHERE is_active = $1";
    const params = [active];
    if (type) {
      where += " AND board_type = $2";
      params.push(type);
    }

    const count = await query(`SELECT COUNT(*) FROM board_members ${where}`, params);
    const limitOffsetSql = type ? `LIMIT $3 OFFSET $4` : `LIMIT $2 OFFSET $3`;
    const result = await query(
      `SELECT * FROM board_members ${where} ORDER BY sort_order ASC ${limitOffsetSql}`,
      type ? [active, type, lim, offset] : [active, lim, offset]
    );
    return paginated(res, result.rows, buildPagination(count.rows[0].count, p, lim));
  } catch (err) { next(err); }
};

const getOneBoard = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM board_members WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Board member not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const createBoard = async (req, res, next) => {
  try {
    const { name, role, bio, image_url, linkedin, email, sort_order, board_type } = req.body;
    const result = await query(
      `INSERT INTO board_members (name, role, board_type, bio, image_url, linkedin, email, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, role || "member", board_type || "board_of_directors", bio, image_url, linkedin, email, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Board member created");
  } catch (err) { next(err); }
};

const updateBoard = async (req, res, next) => {
  try {
    const { name, role, bio, image_url, linkedin, email, sort_order, is_active, board_type } = req.body;
    const result = await query(
      `UPDATE board_members SET
        name = COALESCE($1,name), role = COALESCE($2,role), board_type = COALESCE($3,board_type),
        bio = COALESCE($4,bio), image_url = COALESCE($5,image_url), linkedin = COALESCE($6,linkedin),
        email = COALESCE($7,email), sort_order = COALESCE($8,sort_order),
        is_active = COALESCE($9,is_active), updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [name, role, board_type, bio, image_url, linkedin, email, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Board member not found");
    return success(res, result.rows[0], "Board member updated");
  } catch (err) { next(err); }
};

const removeBoard = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM board_members WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Board member not found");
    return success(res, {}, "Board member deleted");
  } catch (err) { next(err); }
};

/* ── MANAGEMENT TEAM ───────────────────────────────── */

const getAllManagement = async (req, res, next) => {
  try {
    const { is_active = true } = req.query;
    const result = await query(
      "SELECT * FROM management_team WHERE is_active = $1 ORDER BY sort_order ASC",
      [is_active === "true" || is_active === true]
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

const getOneManagement = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM management_team WHERE id = $1", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Management member not found");
    return success(res, result.rows[0]);
  } catch (err) { next(err); }
};

const createManagement = async (req, res, next) => {
  try {
    const { name, role, role_title, bio, image_url, linkedin, email, sort_order } = req.body;
    const result = await query(
      `INSERT INTO management_team (name, role, role_title, bio, image_url, linkedin, email, sort_order, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, role || "officer", role_title, bio, image_url, linkedin, email, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Management member created");
  } catch (err) { next(err); }
};

const updateManagement = async (req, res, next) => {
  try {
    const { name, role, role_title, bio, image_url, linkedin, email, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE management_team SET
        name = COALESCE($1,name), role = COALESCE($2,role), role_title = COALESCE($3,role_title),
        bio = COALESCE($4,bio), image_url = COALESCE($5,image_url), linkedin = COALESCE($6,linkedin),
        email = COALESCE($7,email), sort_order = COALESCE($8,sort_order),
        is_active = COALESCE($9,is_active), updated_at = NOW()
       WHERE id = $10 RETURNING *`,
      [name, role, role_title, bio, image_url, linkedin, email, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Management member not found");
    return success(res, result.rows[0], "Management member updated");
  } catch (err) { next(err); }
};

const removeManagement = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM management_team WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Management member not found");
    return success(res, {}, "Management member deleted");
  } catch (err) { next(err); }
};

/* ── GOVERNANCE PRINCIPLES ─────────────────────────── */

const getAllPrinciples = async (req, res, next) => {
  try {
    const result = await query(
      "SELECT * FROM governance_principles WHERE is_active = TRUE ORDER BY sort_order ASC"
    );
    return success(res, result.rows);
  } catch (err) { next(err); }
};

const createPrinciple = async (req, res, next) => {
  try {
    const { title, description, sort_order } = req.body;
    const result = await query(
      "INSERT INTO governance_principles (title, description, sort_order, created_by) VALUES ($1,$2,$3,$4) RETURNING *",
      [title, description, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Principle created");
  } catch (err) { next(err); }
};

const updatePrinciple = async (req, res, next) => {
  try {
    const { title, description, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE governance_principles SET
        title = COALESCE($1,title), description = COALESCE($2,description),
        sort_order = COALESCE($3,sort_order), is_active = COALESCE($4,is_active), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [title, description, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Principle not found");
    return success(res, result.rows[0], "Principle updated");
  } catch (err) { next(err); }
};

const removePrinciple = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM governance_principles WHERE id = $1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Principle not found");
    return success(res, {}, "Principle deleted");
  } catch (err) { next(err); }
};

module.exports = {
  getAllBoard, getOneBoard, createBoard, updateBoard, removeBoard,
  getAllManagement, getOneManagement, createManagement, updateManagement, removeManagement,
  getAllPrinciples, createPrinciple, updatePrinciple, removePrinciple,
};
