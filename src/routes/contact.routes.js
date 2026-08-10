const router = require("express").Router();
const ctrl = require("../controllers/contact.controller");

router.post("/", ctrl.sendContactEmail);

module.exports = router;
