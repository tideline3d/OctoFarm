const express = require("express");

const router = express.Router();

const { ServerChecks } = require("../systemRunners/system/serverChecks.js");

router.get("/", async (req, res) => {
    const serverChecks = await ServerChecks.returnChecks();
    res.json(serverChecks);
});

module.exports = router;