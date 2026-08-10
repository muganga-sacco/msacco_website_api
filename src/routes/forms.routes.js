const router = require("express").Router();
const ctrl = require("../controllers/forms.controller");
const { protect, editorOrAdmin } = require("../middleware/auth");

router.get("/",    ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post(  "/",    protect, editorOrAdmin, ctrl.create);
router.put(   "/:id", protect, editorOrAdmin, ctrl.update);
router.delete("/:id", protect, editorOrAdmin, ctrl.remove);

module.exports = router;
