const { query } = require("../config/db");
const { success, created, notFound, badRequest } = require("../utils/response");

// GET /api/exam-results
// Public — returns all active entries, optional ?category=written|oral
const getAll = async (req, res, next) => {
  try {
    const { category } = req.query;

    const validCategories = ["written", "oral"];
    if (category && !validCategories.includes(category)) {
      return badRequest(res, "category must be 'written' or 'oral'");
    }

    const params = [];
    let where = "WHERE is_active = TRUE";
    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }

    const result = await query(
      `SELECT id, title, category, published_at, is_latest, file_url
       FROM exam_results
       ${where}
       ORDER BY published_at DESC`,
      params
    );

    return res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

// POST /api/exam-results  (admin only)
const create = async (req, res, next) => {
  try {
    const { title, category, published_at, is_latest = false, file_url, is_active = true } = req.body;

    if (!title || !title.trim()) return badRequest(res, "title is required");
    if (!category) return badRequest(res, "category is required ('written' or 'oral')");
    if (!["written", "oral"].includes(category)) return badRequest(res, "category must be 'written' or 'oral'");
    if (!published_at) return badRequest(res, "published_at is required");
    if (!file_url || !file_url.trim()) return badRequest(res, "file_url is required");

    // If marking this entry as latest, unset is_latest on others of the same category
    if (is_latest) {
      await query(
        "UPDATE exam_results SET is_latest = FALSE WHERE category = $1",
        [category]
      );
    }

    const result = await query(
      `INSERT INTO exam_results (title, category, published_at, is_latest, file_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title.trim(), category, published_at, is_latest, file_url.trim(), is_active]
    );

    return created(res, result.rows[0], "Exam result created");
  } catch (err) {
    next(err);
  }
};

// PUT /api/exam-results/:id  (admin only)
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, published_at, is_latest, file_url, is_active } = req.body;

    // Validate category if provided
    if (category && !["written", "oral"].includes(category)) {
      return badRequest(res, "category must be 'written' or 'oral'");
    }

    // Resolve the current record first so we know its category
    const current = await query("SELECT * FROM exam_results WHERE id = $1", [id]);
    if (!current.rows.length) return notFound(res, "Exam result not found");

    const resolvedCategory = category || current.rows[0].category;

    // If marking as latest, clear others in the same category
    if (is_latest === true || is_latest === "true") {
      await query(
        "UPDATE exam_results SET is_latest = FALSE WHERE category = $1 AND id != $2",
        [resolvedCategory, id]
      );
    }

    const result = await query(
      `UPDATE exam_results SET
        title        = COALESCE($1, title),
        category     = COALESCE($2, category),
        published_at = COALESCE($3, published_at),
        is_latest    = COALESCE($4, is_latest),
        file_url     = COALESCE($5, file_url),
        is_active    = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [
        title ? title.trim() : null,
        category || null,
        published_at || null,
        is_latest !== undefined ? Boolean(is_latest) : null,
        file_url ? file_url.trim() : null,
        is_active !== undefined ? Boolean(is_active) : null,
        id,
      ]
    );

    return success(res, result.rows[0], "Exam result updated");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/exam-results/:id  (admin only — soft delete)
const remove = async (req, res, next) => {
  try {
    const result = await query(
      "UPDATE exam_results SET is_active = FALSE WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!result.rows.length) return notFound(res, "Exam result not found");
    return success(res, {}, "Exam result removed");
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
