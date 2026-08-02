#!/usr/bin/env node
// Preflight for the SMTP sender: `npm run email:check [recipient@example.com]`
//
// Verifies the connection and credentials, then optionally sends one real message. Run this
// before a demo — the alternative is finding out from a donor who never got their tracking
// link, which is the one email they cannot do without (§15 has no lookup-by-email).

require("dotenv").config({ quiet: true });

const { verifyTransport, sendEmail } = require("../src/lib/email");

async function main() {
  const mode = (process.env.EMAIL_MODE || "log").toLowerCase();
  console.log(`EMAIL_MODE=${mode}`);

  if (mode !== "smtp") {
    console.log(
      `\nNothing to check: in "${mode}" mode emails render to this log and never leave the\n` +
        `machine. Set EMAIL_MODE=smtp in server/.env to send for real.`,
    );
    return;
  }

  const info = await verifyTransport();
  console.log(`✓ connected to ${info.host}:${info.port} as ${info.user}`);

  const to = process.argv[2];
  if (!to) {
    console.log(`\nPass an address to send a test message:  npm run email:check you@example.com`);
    return;
  }

  const result = await sendEmail({
    to,
    subject: "Love 21 — SMTP test",
    text:
      "This is a test from the Love 21 donations server.\n\n" +
      "If you are reading it, donor thank-you emails and the 15th/EOM updates will deliver.",
  });
  console.log(`✓ sent to ${to} (id ${result.id})`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}\n`);
  process.exitCode = 1;
});
