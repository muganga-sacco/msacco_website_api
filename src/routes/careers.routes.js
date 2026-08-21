const router = require("express").Router();
const { body } = require("express-validator");
const multer = require("multer");
const path = require("path");
const ctrl = require("../controllers/careers.controller");
const { protect, editorOrAdmin, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

const appStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});
const appUpload = multer({
  storage: appStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`File type ${ext} not allowed`));
  },
});

// Public
router.get("/",    ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/apply", (req, res, next) => {
  appUpload.fields([
    { name: "id_copy", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "academic_paper", maxCount: 1 },
    { name: "other_documents", maxCount: 1 },
  ])(req, res, err => {
    if (err instanceof multer.MulterError)
      return res.status(400).json({ success: false, message: err.message });
    if (err)
      return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, ctrl.apply);

// Protected
router.post("/", protect, editorOrAdmin, [
  body("title").trim().notEmpty().withMessage("Job title is required"),
  body("department").trim().notEmpty().withMessage("Department is required"),
  body("employment_type")
    .optional()
    .isIn(["full-time","part-time","contract","internship"])
    .withMessage("Invalid employment type"),
  body("deadline").optional().isDate().withMessage("Invalid date format"),
  body("max_age").optional({ nullable: true }).isInt({ min: 18, max: 99 }).withMessage("max_age must be between 18 and 99"),
  body("salary_range").optional({ nullable: true }).isString(),
  body("requirements").optional({ nullable: true }).isArray().withMessage("requirements must be an array"),
  body("benefits").optional({ nullable: true }).isArray().withMessage("benefits must be an array"),
  body("key_deliverables").optional({ nullable: true }).isArray().withMessage("key_deliverables must be an array"),
  body("skills_competencies").optional({ nullable: true }).isArray().withMessage("skills_competencies must be an array"),
  body("personal_attributes").optional({ nullable: true }).isArray().withMessage("personal_attributes must be an array"),
  body("application_procedures").optional({ nullable: true }).isString(),
  validate,
], ctrl.create);

router.put(   "/:id", protect, editorOrAdmin, ctrl.update);
router.delete("/:id", protect, adminOnly,     ctrl.remove);

module.exports = router;
