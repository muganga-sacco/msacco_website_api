const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/guides.controller");
const { protect, editorOrAdmin, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

// Public
router.get("/",    ctrl.getAll);
router.get("/:id", ctrl.getOne);

// Protected
router.post("/", protect, editorOrAdmin, [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("category")
    .optional()
    .isIn(["getting_started","loans","digital_services","education","savings"])
    .withMessage("Invalid category"),
  validate,
], ctrl.create);

router.put(   "/:id", protect, editorOrAdmin, ctrl.update);
router.delete("/:id", protect, adminOnly,     ctrl.remove);

module.exports = router;
