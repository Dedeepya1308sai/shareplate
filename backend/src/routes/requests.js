"use strict";

const express = require("express");
const store = require("../lib/store");
const { authenticate } = require("../lib/auth");
const { serializeRequest } = require("../lib/serialize");

const router = express.Router();

router.use(authenticate);

router.get("/", (req, res) => {
  const state = store.getState();
  const viewer = req.user;
  const status = String(req.query.status || "").trim();
  const items = [];

  for (const donation of state.donations) {
    const isDonor = viewer.id === donation.donorId;
    const isReceiver = viewer.role === "receiver";
    for (const request of donation.requests) {
      const isOwnRequest = request.receiverId === viewer.id;
      if (!isDonor && !isOwnRequest) continue;
      if (isReceiver && !isOwnRequest) continue;
      if (status && status !== "all" && request.status !== status) continue;
      items.push(serializeRequest(request, donation, viewer, state));
    }
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ requests: items, count: items.length });
});

module.exports = router;
