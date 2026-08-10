const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/news.controller");
const { protect, editorOrAdmin, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

// Public  — also accepts slug as :id
router.get("/",    ctrl.getAll);
router.get("/:id", ctrl.getOne);

// Protected
router.post("/", protect, editorOrAdmin, [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("status")
    .optional()
    .isIn(["draft","published","archived"])
    .withMessage("Invalid status"),
  validate,
], ctrl.create);

router.put(   "/:id", protect, editorOrAdmin, ctrl.update);
router.delete("/:id", protect, adminOnly,     ctrl.remove);

module.exports = router;
