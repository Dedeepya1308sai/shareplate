"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { fail } = require("./errors");

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, "..", "..", "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const extension = MIME_EXTENSIONS[file.mimetype] || ".jpg";
    cb(null, Date.now() + "-" + crypto.randomBytes(8).toString("hex") + extension);
  },
});

function fileFilter(_req, file, cb) {
  if (!MIME_EXTENSIONS[file.mimetype]) {
    const error = new Error("Upload a JPG, PNG or WebP image.");
    error.code = "INVALID_FILE_TYPE";
    return cb(error);
  }
  return cb(null, true);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

function discardFile(file) {
  if (!file || !file.path) return;
  fs.unlink(file.path, () => {});
}

function verifyImageContent(file) {
  if (!file || !file.path) fail(400, "Attach a photo before submitting.");
  const header = Buffer.alloc(12);
  let fd;
  try {
    fd = fs.openSync(file.path, "r");
    fs.readSync(fd, header, 0, 12, 0);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp =
    header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    discardFile(file);
    fail(400, "That file is not a valid JPG, PNG or WebP image.");
  }
}

function fileUrl(file) {
  return "/uploads/" + file.filename;
}

module.exports = { upload, discardFile, verifyImageContent, fileUrl, UPLOAD_DIR };
