const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/board.controller");
const { protect, editorOrAdmin, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

/* ── BOARD OF DIRECTORS ── */
router.get(   "/members",      ctrl.getAllBoard);
router.get(   "/members/:id",  ctrl.getOneBoard);
router.post(  "/members", protect, editorOrAdmin, [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("board_type").optional().isIn(["board_of_directors","supervisory_board","management_team"]),
  validate,
], ctrl.createBoard);
router.put(   "/members/:id", protect, editorOrAdmin, ctrl.updateBoard);
router.delete("/members/:id", protect, adminOnly,     ctrl.removeBoard);

/* ── MANAGEMENT TEAM ── */
router.get(   "/management",      ctrl.getAllManagement);
router.get(   "/management/:id",  ctrl.getOneManagement);
router.post(  "/management", protect, editorOrAdmin, [
  body("name").trim().notEmpty().withMessage("Name is required"),
  validate,
], ctrl.createManagement);
router.put(   "/management/:id", protect, editorOrAdmin, ctrl.updateManagement);
router.delete("/management/:id", protect, adminOnly,     ctrl.removeManagement);

/* ── GOVERNANCE PRINCIPLES ── */
router.get(   "/principles",      ctrl.getAllPrinciples);
router.post(  "/principles", protect, editorOrAdmin, [
  body("title").trim().notEmpty().withMessage("Title is required"),
  validate,
], ctrl.createPrinciple);
router.put(   "/principles/:id", protect, editorOrAdmin, ctrl.updatePrinciple);
router.delete("/principles/:id", protect, adminOnly,     ctrl.removePrinciple);

module.exports = router;
