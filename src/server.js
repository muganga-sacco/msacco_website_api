require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const routes = require("./routes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 6000;

/* ── SECURITY ─────────────────────────────────────── */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

/* ── RATE LIMITING ────────────────────────────────── */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many auth attempts, please try again later." },
});

app.use("/api", limiter);
app.use("/api/auth/login",    authLimiter);
app.use("/api/auth/register", authLimiter);

/* ── GENERAL MIDDLEWARE ───────────────────────────── */
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* ── STATIC FILES (uploads) ───────────────────────── */
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
}, express.static(path.join(__dirname, "..", "uploads")));

/* ── msacco CHECK ─────────────────────────────────── */
app.get("/msacco", (req, res) => {
  res.json({
    success: true,
    message: "Muganga SACCO API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });  
});

/* ── API ROUTES ───────────────────────────────────── */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Muganga SACCO API",
    version: "1.0.0",
    docs: "/api/docs",
    endpoints: {
      auth:     "/api/auth",
      products: "/api/products",
      board:    "/api/board",
      careers:  "/api/careers",
      news:     "/api/news",
      trends:   "/api/trends",
      guides:   "/api/guides",
      services: "/api/other-services",
      settings: "/api/settings",
      contact:      "/api/contact",
      examResults:  "/api/exam-results",
    },
  });
});

app.use("/api", routes);

/* ── ERROR HANDLERS ───────────────────────────────── */
app.use(notFoundHandler);
app.use(errorHandler);

/* ── START SERVER ─────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\nMuganga SACCO API running on port ${PORT}`);
  console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base    : http://localhost:${PORT}/api\n`);
});

module.exports = app;
