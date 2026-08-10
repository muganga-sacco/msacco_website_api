const { query } = require("../config/db");
const { success, created, notFound } = require("../utils/response");

/* ── KPI STATS ─────────────────────────────────────── */
const getAllKpis = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM kpi_stats WHERE is_active = TRUE ORDER BY sort_order ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const createKpi = async (req, res, next) => {
  try {
    const { label, value, change_pct, is_positive, icon, sort_order } = req.body;
    const result = await query(
      "INSERT INTO kpi_stats (label, value, change_pct, is_positive, icon, sort_order, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [label, value, change_pct, is_positive !== false, icon, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "KPI created");
  } catch (err) { next(err); }
};
const updateKpi = async (req, res, next) => {
  try {
    const { label, value, change_pct, is_positive, icon, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE kpi_stats SET label=COALESCE($1,label), value=COALESCE($2,value), change_pct=COALESCE($3,change_pct),
        is_positive=COALESCE($4,is_positive), icon=COALESCE($5,icon), sort_order=COALESCE($6,sort_order),
        is_active=COALESCE($7,is_active), updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [label, value, change_pct, is_positive, icon, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "KPI not found");
    return success(res, result.rows[0], "KPI updated");
  } catch (err) { next(err); }
};
const removeKpi = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM kpi_stats WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "KPI not found");
    return success(res, {}, "KPI deleted");
  } catch (err) { next(err); }
};

/* ── SAVINGS TRENDS ────────────────────────────────── */
const getAllSavings = async (req, res, next) => {
  try {
    const { year } = req.query;
    const result = year
      ? await query("SELECT * FROM savings_trends WHERE year=$1 ORDER BY quarter ASC", [year])
      : await query("SELECT * FROM savings_trends ORDER BY year DESC, quarter ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const createSavings = async (req, res, next) => {
  try {
    const { period, amount, label, year, quarter } = req.body;
    const result = await query(
      "INSERT INTO savings_trends (period, amount, label, year, quarter, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
      [period, amount, label, year, quarter, req.user.id]
    );
    return created(res, result.rows[0], "Savings trend created");
  } catch (err) { next(err); }
};
const updateSavings = async (req, res, next) => {
  try {
    const { period, amount, label, year, quarter } = req.body;
    const result = await query(
      `UPDATE savings_trends SET period=COALESCE($1,period), amount=COALESCE($2,amount),
        label=COALESCE($3,label), year=COALESCE($4,year), quarter=COALESCE($5,quarter), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [period, amount, label, year, quarter, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Record not found");
    return success(res, result.rows[0], "Savings trend updated");
  } catch (err) { next(err); }
};
const removeSavings = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM savings_trends WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Record not found");
    return success(res, {}, "Savings trend deleted");
  } catch (err) { next(err); }
};

/* ── LOAN DISTRIBUTION ─────────────────────────────── */
const getAllLoanDist = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM loan_distribution WHERE is_active=TRUE ORDER BY sort_order ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const createLoanDist = async (req, res, next) => {
  try {
    const { label, percentage, color, sort_order } = req.body;
    const result = await query(
      "INSERT INTO loan_distribution (label, percentage, color, sort_order, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [label, percentage, color, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Loan distribution entry created");
  } catch (err) { next(err); }
};
const updateLoanDist = async (req, res, next) => {
  try {
    const { label, percentage, color, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE loan_distribution SET label=COALESCE($1,label), percentage=COALESCE($2,percentage),
        color=COALESCE($3,color), sort_order=COALESCE($4,sort_order), is_active=COALESCE($5,is_active), updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [label, percentage, color, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Record not found");
    return success(res, result.rows[0], "Loan distribution updated");
  } catch (err) { next(err); }
};
const removeLoanDist = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM loan_distribution WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Record not found");
    return success(res, {}, "Loan distribution deleted");
  } catch (err) { next(err); }
};

/* ── ECONOMIC INSIGHTS ─────────────────────────────── */
const getAllInsights = async (req, res, next) => {
  try {
    const result = await query("SELECT * FROM economic_insights WHERE is_active=TRUE ORDER BY sort_order ASC");
    return success(res, result.rows);
  } catch (err) { next(err); }
};
const createInsight = async (req, res, next) => {
  try {
    const { title, body, sort_order } = req.body;
    const result = await query(
      "INSERT INTO economic_insights (title, body, sort_order, created_by) VALUES ($1,$2,$3,$4) RETURNING *",
      [title, body, sort_order || 0, req.user.id]
    );
    return created(res, result.rows[0], "Insight created");
  } catch (err) { next(err); }
};
const updateInsight = async (req, res, next) => {
  try {
    const { title, body, sort_order, is_active } = req.body;
    const result = await query(
      `UPDATE economic_insights SET title=COALESCE($1,title), body=COALESCE($2,body),
        sort_order=COALESCE($3,sort_order), is_active=COALESCE($4,is_active), updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [title, body, sort_order, is_active, req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Insight not found");
    return success(res, result.rows[0], "Insight updated");
  } catch (err) { next(err); }
};
const removeInsight = async (req, res, next) => {
  try {
    const result = await query("DELETE FROM economic_insights WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rows.length) return notFound(res, "Insight not found");
    return success(res, {}, "Insight deleted");
  } catch (err) { next(err); }
};

module.exports = {
  getAllKpis, createKpi, updateKpi, removeKpi,
  getAllSavings, createSavings, updateSavings, removeSavings,
  getAllLoanDist, createLoanDist, updateLoanDist, removeLoanDist,
  getAllInsights, createInsight, updateInsight, removeInsight,
};
