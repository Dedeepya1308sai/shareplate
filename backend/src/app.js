"use strict";

const path = require("path");
const express = require("express");
const multer = require("multer");
const { AREAS } = require("./lib/areas");
const { UPLOAD_DIR } = require("./lib/upload");
const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");
const requestRoutes = require("./routes/requests");
const impactRoutes = require("./routes/impact");

const app = express();
const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self'",
      "connect-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ")
  );
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "shareplate-api", time: new Date().toISOString() });
});

app.get("/api/areas", (_req, res) => {
  res.json({ areas: AREAS });
});

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/impact", impactRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found." });
});

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    dotfiles: "deny",
    maxAge: "7d",
    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

app.use(
  express.static(FRONTEND_DIR, {
    index: "index.html",
    maxAge: IS_PRODUCTION ? "1h" : 0,
  })
);

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
  return res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Photo is larger than 5 MB. Please choose a smaller image." });
    }
    return res.status(400).json({ error: "Could not process that upload. Please try another image." });
  }
  if (error.code === "INVALID_FILE_TYPE") {
    return res.status(400).json({ error: error.message });
  }
  const status = error.status || 500;
  if (status >= 500) {
    console.error("[api]", error);
  }
  return res.status(status).json({
    error: status >= 500 ? "Something went wrong on the server. Please try again." : error.message,
    details: error.details,
  });
});

module.exports = app;
