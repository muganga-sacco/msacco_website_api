const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/auth");
const { success, error } = require("../utils/response");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`File type ${ext} not allowed`));
  },
});

router.post("/", protect, (req, res) => {
  upload.single("file")(req, res, err => {
    if (err) return error(res, err.message, 400);
    if (!req.file) return error(res, "No file provided", 400);
    const url = `/uploads/${req.file.filename}`;
    return success(res, { url, filename: req.file.originalname });
  });
});

module.exports = router;
