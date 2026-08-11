const path   = require("path");
const multer = require("multer");
const router = require("express").Router();
const ctrl   = require("../controllers/examResults.controller");
const { protect, adminOnly } = require("../middleware/auth");

// ── Multer: save to /uploads, allow PDF + common doc types ──
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`File type ${ext} not allowed. Use PDF, DOC, or DOCX.`));
  },
});

// Wrap multer so errors come back as JSON, not Express default
const uploadSingle = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError)
      return res.status(400).json({ success: false, message: err.message });
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
};

// ── Public ───────────────────────────────────────────────────
router.get("/", ctrl.getAll);

// ── Admin-protected ──────────────────────────────────────────
router.post(  "/",    protect, adminOnly, uploadSingle, ctrl.create);
router.put(   "/:id", protect, adminOnly, uploadSingle, ctrl.update);
router.delete("/:id", protect, adminOnly,               ctrl.remove);

module.exports = router;
