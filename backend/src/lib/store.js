"use strict";

const fs = require("fs");
const path = require("path");
const { buildSeed } = require("./seed-data");

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "..", "..", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

let state = null;

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function save() {
  ensureDataDir();
  const tempFile = DB_FILE + ".tmp";
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tempFile, DB_FILE);
}

function load() {
  if (state) return state;
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      if (!Array.isArray(state.users) || !Array.isArray(state.donations)) {
        throw new Error("Unexpected database shape");
      }
    } catch (error) {
      const backup = DB_FILE + ".corrupt-" + Date.now();
      try {
        fs.copyFileSync(DB_FILE, backup);
      } catch (_) {
        /* ignore backup failure */
      }
      console.warn(
        "[store] Could not read db.json (" + error.message + "). Seeding a fresh database."
      );
      state = buildSeed();
      save();
    }
  } else {
    state = buildSeed();
    save();
    console.log("[store] Seeded demo database at " + DB_FILE);
  }
  return state;
}

function getState() {
  return load();
}

function mutate(fn) {
  const current = load();
  const result = fn(current);
  save();
  return result;
}

function reset() {
  state = buildSeed();
  save();
  return state;
}

module.exports = { getState, mutate, reset, DB_FILE, DATA_DIR };
