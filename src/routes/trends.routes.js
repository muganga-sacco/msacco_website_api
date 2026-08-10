const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/trends.controller");
const { protect, editorOrAdmin, adminOnly } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

/* ── KPI STATS ── */
router.get(   "/kpis",      ctrl.getAllKpis);
router.post(  "/kpis", protect, editorOrAdmin, [
  body("label").trim().notEmpty(),
  body("value").trim().notEmpty(),
  validate,
], ctrl.createKpi);
router.put(   "/kpis/:id", protect, editorOrAdmin, ctrl.updateKpi);
router.delete("/kpis/:id", protect, adminOnly,     ctrl.removeKpi);

/* ── SAVINGS TRENDS ── */
router.get(   "/savings",      ctrl.getAllSavings);
router.post(  "/savings", protect, editorOrAdmin, [
  body("period").trim().notEmpty(),
  body("amount").isInt({ min: 0 }),
  validate,
], ctrl.createSavings);
router.put(   "/savings/:id", protect, editorOrAdmin, ctrl.updateSavings);
router.delete("/savings/:id", protect, adminOnly,     ctrl.removeSavings);

/* ── LOAN DISTRIBUTION ── */
router.get(   "/loans",      ctrl.getAllLoanDist);
router.post(  "/loans", protect, editorOrAdmin, [
  body("label").trim().notEmpty(),
  body("percentage").isFloat({ min: 0, max: 100 }),
  validate,
], ctrl.createLoanDist);
router.put(   "/loans/:id", protect, editorOrAdmin, ctrl.updateLoanDist);
router.delete("/loans/:id", protect, adminOnly,     ctrl.removeLoanDist);

/* ── ECONOMIC INSIGHTS ── */
router.get(   "/insights",      ctrl.getAllInsights);
router.post(  "/insights", protect, editorOrAdmin, [
  body("title").trim().notEmpty(),
  body("body").trim().notEmpty(),
  validate,
], ctrl.createInsight);
router.put(   "/insights/:id", protect, editorOrAdmin, ctrl.updateInsight);
router.delete("/insights/:id", protect, adminOnly,     ctrl.removeInsight);

module.exports = router;
