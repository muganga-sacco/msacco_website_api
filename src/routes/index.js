const router = require("express").Router();

router.use("/auth",     require("./auth.routes"));
router.use("/products", require("./products.routes"));
router.use("/board",    require("./board.routes"));
router.use("/careers",  require("./careers.routes"));
router.use("/news",     require("./news.routes"));
router.use("/trends",   require("./trends.routes"));
router.use("/guides",   require("./guides.routes"));
router.use("/other-services",   require("./other_services.routes"));
router.use("/settings",         require("./settings.routes"));
router.use("/dashboard",  require("./dashboard.routes"));
router.use("/upload",     require("./upload.routes"));
router.use("/forms",      require("./forms.routes"));
router.use("/contact",    require("./contact.routes"));

module.exports = router;
