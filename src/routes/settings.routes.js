const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/settings.controller");
const { protect, adminOnly, editorOrAdmin } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

/* ── SITE SETTINGS ── */
router.get( "/site",  ctrl.getSiteSettings);                           // public
router.put( "/site",  protect, adminOnly, ctrl.upsertSiteSettings);

/* ── SOCIAL LINKS ── */
router.get(   "/socials",      ctrl.getAllSocials);                    // public
router.post(  "/socials", protect, adminOnly, [
  body("platform").trim().notEmpty(),
  body("url").isURL().withMessage("Valid URL required"),
  validate,
], ctrl.createSocial);
router.put(   "/socials/:id", protect, adminOnly, ctrl.updateSocial);
router.delete("/socials/:id", protect, adminOnly, ctrl.removeSocial);

/* ── HERO BANNERS ── */
router.get(   "/banners",      ctrl.getAllBanners);                    // public
router.post(  "/banners", protect, editorOrAdmin, [
  body("title").trim().notEmpty(),
  body("page").trim().notEmpty(),
  validate,
], ctrl.createBanner);
router.put(   "/banners/:id", protect, editorOrAdmin, ctrl.updateBanner);
router.delete("/banners/:id", protect, adminOnly,     ctrl.removeBanner);

/* ── FEATURE TOGGLES ── */
router.get(   "/toggles",         ctrl.getAllToggles);                 // public
router.get(   "/toggles/:key",    ctrl.getToggle);                    // public
router.post(  "/toggles", protect, adminOnly, [
  body("key").trim().notEmpty().matches(/^[a-z_]+$/).withMessage("Key must be lowercase snake_case"),
  body("is_enabled").optional().isBoolean(),
  validate,
], ctrl.createToggle);
router.put(   "/toggles/:key", protect, adminOnly, ctrl.updateToggle);
router.delete("/toggles/:key", protect, adminOnly, ctrl.removeToggle);

/* ── USER MANAGEMENT (admin only) ── */
router.get(   "/users",      protect, adminOnly, ctrl.getAllUsers);
router.put(   "/users/:id",  protect, adminOnly, [
  body("role").optional().isIn(["admin","editor","member"]),
  body("is_active").optional().isBoolean(),
  validate,
], ctrl.updateUser);
router.delete("/users/:id",  protect, adminOnly, ctrl.removeUser);

module.exports = router;
