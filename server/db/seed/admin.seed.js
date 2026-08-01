// DEMO-ONLY: mints a second admin identity for the demo. The only admin in the
// live project is a real person's UST address (see MEMORY/§30); this script gives
// the team a stable, seedable admin the frontend can sign in as, and — combined
// with DEMO_ADMIN_USER_ID — lets curl/Postman hit /api/admin/* without a JWT.
//
// Real version needs an admin-invite flow (§19, §26) — a hand-run seed script is
// only defensible because there is no admin UI yet.
//
// Run with: npm run seed:admin [email]
// Default email: demo-admin@love21.local (fake TLD — not deliverable).
//
// Idempotent: reuses the auth.users row if one already exists for the target
// email, then upserts the profiles row with role='admin'.

require("dotenv").config({ quiet: true });
const crypto = require("node:crypto");

const { getSupabase } = require("../../src/config/supabase");
const { normaliseEmail } = require("../../src/lib/email");

const DEFAULT_EMAIL = "demo-admin@love21.local";
const DEFAULT_FULL_NAME = "Demo Admin";
const DEFAULT_LOCALE = "en";

/**
 * Looks up an existing auth.users row by email using the admin listUsers pager.
 * Supabase's admin API does not expose a getUserByEmail, so we page through
 * until we find the address or exhaust the list. The demo project has ~1 user,
 * so this is a single page in practice.
 *
 * @param {ReturnType<typeof getSupabase>} supabase
 * @param {string} email
 * @returns {Promise<{ id: string, email: string } | null>}
 */
async function findAuthUserByEmail(supabase, email) {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`listUsers page ${page} failed: ${error.message}`);

    const match = data.users.find((user) => normaliseEmail(user.email ?? "") === email);
    if (match) return { id: match.id, email: match.email ?? "" };

    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function seedAdmin(rawEmail) {
  const supabase = getSupabase();
  const email = normaliseEmail(rawEmail ?? DEFAULT_EMAIL);
  if (!email) throw new Error("Email is required");

  console.log(`Seeding demo admin for ${email}...`);

  let authUser = await findAuthUserByEmail(supabase, email);
  let generatedPassword = null;

  if (authUser) {
    console.log(`  auth.users row already exists — id=${authUser.id}`);
  } else {
    generatedPassword = crypto.randomBytes(18).toString("base64url");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
    });
    if (error) throw new Error(`createUser failed: ${error.message}`);
    authUser = { id: data.user.id, email: data.user.email ?? email };
    console.log(`  created auth.users row — id=${authUser.id}`);
  }

  // handle_new_user has already inserted a role='volunteer' row via the on_auth_user_created
  // trigger. Upsert to flip the role to admin without disturbing anything else.
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: authUser.id,
        email,
        role: "admin",
        full_name: DEFAULT_FULL_NAME,
        locale: DEFAULT_LOCALE,
      },
      { onConflict: "id" },
    );
  if (upsertError) throw new Error(`profiles upsert failed: ${upsertError.message}`);

  console.log("  profiles row upserted with role='admin'");
  console.log("");
  console.log("---");
  console.log(`Add this to server/.env for the DEMO_ADMIN_USER_ID bypass:`);
  console.log(`  DEMO_ADMIN_USER_ID=${authUser.id}`);
  if (generatedPassword) {
    console.log("");
    console.log(`Generated password (only shown on first run — record it now):`);
    console.log(`  ${generatedPassword}`);
    console.log("Use it to sign in as this admin via Supabase auth (magic-link OR");
    console.log("password) once the frontend sign-in flow exists.");
  }
  console.log("---");
}

if (require.main === module) {
  const email = process.argv[2];
  seedAdmin(email).catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

module.exports = { seedAdmin };
