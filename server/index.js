require("dotenv").config({ quiet: true });

const app = require("./src/app");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number.parseInt(process.env.PORT || "3000", 10);

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close the server:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
