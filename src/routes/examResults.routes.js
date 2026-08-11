const router = require("express").Router();
const ctrl   = require("../controllers/examResults.controller");
const { protect, adminOnly } = require("../middleware/auth");

// Public
router.get("/", ctrl.getAll);

// Admin-protected
router.post(  "/",    protect, adminOnly, ctrl.create);
router.put(   "/:id", protect, adminOnly, ctrl.update);
router.delete("/:id", protect, adminOnly, ctrl.remove);

module.exports = router;
