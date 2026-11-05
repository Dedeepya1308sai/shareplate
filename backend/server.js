"use strict";

const app = require("./src/app");
const store = require("./src/lib/store");

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "127.0.0.1";

store.getState();

const server = app.listen(PORT, HOST, () => {
  console.log("");
  console.log("  SharePlate - Smart Food Waste Redistribution");
  console.log("  ------------------------------------------------");
  console.log("  App:    http://localhost:" + PORT);
  console.log("  API:    http://localhost:" + PORT + "/api/health");
  console.log("");
  console.log("  Demo accounts (password: demo1234)");
  console.log("    Restaurant owner     restaurant@demo.com");
  console.log("    Function hall        banquet@demo.com");
  console.log("    Food receiver        receiver@demo.com");
  console.log("");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error("Port " + PORT + " is already in use. Set PORT to a free port and try again.");
    process.exit(1);
  }
  throw error;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
