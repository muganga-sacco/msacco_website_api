const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/products.controller");
const { protect, editorOrAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

const productRules = [
  body("type").isIn(["loan", "savings"]).withMessage("Type must be loan or savings"),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("interest_rate").optional({ nullable: true, checkFalsy: false }),
  validate,
];

// Public
router.get("/",    ctrl.getAll);
router.get("/:id", ctrl.getOne);

// Protected — editor or admin
router.post(  "/",    protect, editorOrAdmin, productRules, ctrl.create);
router.put(   "/:id", protect, editorOrAdmin, ctrl.update);
router.delete("/:id", protect, editorOrAdmin, ctrl.remove);

module.exports = router;
