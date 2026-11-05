"use strict";

const { getState, mutate } = require("./store");
const { newToken } = require("./security");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function startSession(state, userId) {
  const token = newToken();
  const now = Date.now();
  state.sessions = state.sessions.filter((session) => session.expiresAt > now);
  state.sessions.push({
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: now + SESSION_TTL_MS,
  });
  return token;
}

function authenticate(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return next(failUnauthorized());

  const state = getState();
  const session = state.sessions.find((entry) => entry.token === token);
  if (!session || session.expiresAt <= Date.now()) {
    return next(failUnauthorized());
  }
  const user = state.users.find((entry) => entry.id === session.userId);
  if (!user) return next(failUnauthorized());

  req.user = user;
  req.token = token;
  return next();
}

function failUnauthorized() {
  const error = new Error("Please sign in to continue.");
  error.status = 401;
  return error;
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error("You do not have access to this action.");
      error.status = 403;
      return next(error);
    }
    return next();
  };
}

function revokeSession(token) {
  mutate((state) => {
    state.sessions = state.sessions.filter((session) => session.token !== token);
  });
}

module.exports = { authenticate, requireRole, startSession, revokeSession, SESSION_TTL_MS };
