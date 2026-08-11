const path  = require("path");
const fs    = require("fs");
const { query } = require("../config/db");
const { success, created, notFound, badRequest } = require("../utils/response");

// Build the public URL from a stored filename
const toUrl = (filename) => `/uploads/${filename}`;

// Delete a file from disk (best-effort, no crash if missing)
const deleteFile = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filename = path.basename(fileUrl);
    const fullPath = path.join(__dirname, "..", "..", "uploads", filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch (_) { /* silent */ }
};

// ── GET /api/exam-results ────────────────────────────────────
// Public — optional ?category=written|oral, ordered by published_at DESC
const getAll = async (req, res, next) => {
  try {
    const { category } = req.query;

    if (category && !["written", "oral"].includes(category)) {
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

// ── POST /api/exam-results ───────────────────────────────────
// Admin — multipart/form-data with file field "file"
const create = async (req, res, next) => {
  try {
    const { title, category, published_at, is_latest = false, is_active = true } = req.body;

    if (!title || !title.trim())       return badRequest(res, "title is required");
    if (!category)                     return badRequest(res, "category is required");
    if (!["written", "oral"].includes(category))
      return badRequest(res, "category must be 'written' or 'oral'");
    if (!published_at)                 return badRequest(res, "published_at is required");
    if (!req.file)                     return badRequest(res, "A file (PDF/DOC/DOCX) is required");

    const file_url = toUrl(req.file.filename);
    const latest   = is_latest === true || is_latest === "true";
    const active   = is_active === true  || is_active === "true";

    // Only one entry per category should be marked latest
    if (latest) {
      await query("UPDATE exam_results SET is_latest = FALSE WHERE category = $1", [category]);
    }

    const result = await query(
      `INSERT INTO exam_results (title, category, published_at, is_latest, file_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title.trim(), category, published_at, latest, file_url, active]
    );

    return created(res, result.rows[0], "Exam result created");
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/exam-results/:id ────────────────────────────────
// Admin — file field "file" is optional; omit to keep existing file
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, category, published_at, is_latest, is_active } = req.body;

    if (category && !["written", "oral"].includes(category)) {
      return badRequest(res, "category must be 'written' or 'oral'");
    }

    // Fetch current record
    const current = await query("SELECT * FROM exam_results WHERE id = $1", [id]);
    if (!current.rows.length) {
      // New file was uploaded but the record doesn't exist — clean up
      if (req.file) deleteFile(toUrl(req.file.filename));
      return notFound(res, "Exam result not found");
    }

    const resolvedCategory = category || current.rows[0].category;
    const latest = is_latest !== undefined
      ? (is_latest === true || is_latest === "true")
      : current.rows[0].is_latest;

    // If marking as latest, unset others in same category
    if (latest) {
      await query(
        "UPDATE exam_results SET is_latest = FALSE WHERE category = $1 AND id != $2",
        [resolvedCategory, id]
      );
    }

    // If a new file was uploaded, swap it and delete the old one
    let file_url = current.rows[0].file_url;
    if (req.file) {
      deleteFile(current.rows[0].file_url);
      file_url = toUrl(req.file.filename);
    }

    const result = await query(
      `UPDATE exam_results SET
        title        = COALESCE($1, title),
        category     = COALESCE($2, category),
        published_at = COALESCE($3, published_at),
        is_latest    = $4,
        file_url     = $5,
        is_active    = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [
        title ? title.trim() : null,
        category || null,
        published_at || null,
        latest,
        file_url,
        is_active !== undefined ? (is_active === true || is_active === "true") : null,
        id,
      ]
    );

    return success(res, result.rows[0], "Exam result updated");
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/exam-results/:id ─────────────────────────────
// Admin — soft delete (is_active = false), file stays on disk
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
