const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/other_services.controller");
const { protect, editorOrAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

const serviceRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  validate,
];

router.get("/",    ctrl.getAll);
router.get("/:id", ctrl.getOne);

router.post(  "/",    protect, editorOrAdmin, serviceRules, ctrl.create);
router.put(   "/:id", protect, editorOrAdmin, ctrl.update);
router.delete("/:id", protect, editorOrAdmin, ctrl.remove);

module.exports = router;
