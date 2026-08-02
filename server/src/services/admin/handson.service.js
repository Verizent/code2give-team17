// DEMO-ONLY: HandsOn admin sync wraps a seeded stub. Real integration needs
// partner credentials and an actual client implementation (§17). Demo framing
// must never present this as a live integration (§7 demo integrity rule).
const stub = require("../../services/volunteering/handson-stub.service");

async function runSync() {
  return stub.runHandsonSync();
}

module.exports = { runSync };
