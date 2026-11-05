"use strict";

const express = require("express");
const store = require("../lib/store");
const { buildImpact } = require("../lib/serialize");

const router = express.Router();

router.get("/", (_req, res) => {
  const state = store.getState();
  res.json({ impact: buildImpact(state) });
});

module.exports = router;
