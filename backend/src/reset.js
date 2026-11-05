"use strict";

const fs = require("fs");
const path = require("path");
const { DB_FILE } = require("./lib/store");

if (fs.existsSync(DB_FILE)) {
  fs.rmSync(DB_FILE, { force: true });
  console.log("Removed " + DB_FILE);
} else {
  console.log("No database file found at " + DB_FILE);
}

console.log("The demo database will be re-seeded the next time the server starts.");
console.log("Stop the server before running this script, then run npm start again.");
