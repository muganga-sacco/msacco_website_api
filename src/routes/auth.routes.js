const router = require("express").Router();
const { body } = require("express-validator");
const ctrl = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/errorHandler");

const passwordRules = body("password")
  .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
  .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
  .matches(/[0-9]/).withMessage("Password must contain a number");

// Public
router.post("/register", [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  passwordRules,
  body("role").optional().isIn(["member", "editor"]).withMessage("Invalid role"),
  validate,
], ctrl.register);

router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
  validate,
], ctrl.login);

router.post("/refresh", [
  body("refreshToken").notEmpty().withMessage("Refresh token required"),
  validate,
], ctrl.refreshToken);

router.post("/logout", ctrl.logout);

// Protected
router.get("/me",              protect, ctrl.getMe);
router.put("/me",              protect, ctrl.updateMe);
router.put("/change-password", protect, [
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 8 }),
  validate,
], ctrl.changePassword);

module.exports = router;
