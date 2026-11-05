"use strict";

const express = require("express");
const crypto = require("crypto");
const store = require("../lib/store");
const { hashPassword, verifyPassword } = require("../lib/security");
const { validateRegister, validateLogin } = require("../lib/validate");
const { startSession, authenticate, revokeSession } = require("../lib/auth");
const { selfUser } = require("../lib/serialize");
const { fail } = require("../lib/errors");

const router = express.Router();

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map();

function assertNotThrottled(key) {
  const entry = attempts.get(key);
  if (!entry) return;
  if (entry.resetAt <= Date.now()) {
    attempts.delete(key);
    return;
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const minutes = Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 60000));
    fail(429, "Too many sign-in attempts. Please try again in " + minutes + " minute(s).");
  }
}

function recordFailure(key) {
  const entry = attempts.get(key) || { count: 0, resetAt: Date.now() + WINDOW_MS };
  entry.count += 1;
  attempts.set(key, entry);
}

router.post("/register", (req, res, next) => {
  try {
    const data = validateRegister(req.body);
    let payload;
    store.mutate((state) => {
      if (state.users.some((user) => user.email === data.email)) {
        fail(409, "An account with this email already exists. Try signing in instead.");
      }
      const { salt, hash } = hashPassword(data.password);
      const user = {
        id: "u_" + crypto.randomBytes(6).toString("hex"),
        name: data.name,
        email: data.email,
        role: data.role,
        organization: data.organization,
        phone: data.phone,
        area: data.area,
        address: data.address,
        salt,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
      };
      state.users.push(user);
      payload = { token: startSession(state, user.id), user: selfUser(user) };
    });
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

router.post("/login", (req, res, next) => {
  try {
    const key = req.ip || "local";
    assertNotThrottled(key);
    const data = validateLogin(req.body);
    const state = store.getState();
    const user = state.users.find((entry) => entry.email === data.email);
    if (!user || !verifyPassword(data.password, user.salt, user.passwordHash)) {
      recordFailure(key);
      fail(401, "Email or password is incorrect.");
    }
    attempts.delete(key);
    const token = store.mutate((current) => startSession(current, user.id));
    res.json({ token, user: selfUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, (req, res) => {
  res.json({ user: selfUser(req.user) });
});

router.post("/logout", authenticate, (req, res) => {
  revokeSession(req.token);
  res.json({ ok: true });
});

module.exports = router;
