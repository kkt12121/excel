const router = require("express").Router();

const main = require("./main.page");

router.post("/diagnosis", main);
router.post("/", main);

module.exports = router;
