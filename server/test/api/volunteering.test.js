const http = require("node:http");
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const app = require("../../src/app");

const skip =
  !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY
    ? "SUPABASE credentials required"
    : false;

/**
 * @param {string} method
 * @param {string} path
 * @param {object} [body]
 * @param {Record<string, string>} [headers]
 */
function apiRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    const { port } = server.address();

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          server.close();
          let parsed = {};
          if (data) {
            try {
              parsed = JSON.parse(data);
            } catch {
              parsed = { raw: data };
            }
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      },
    );

    req.on("error", (error) => {
      server.close();
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

describe("volunteering API", { skip }, () => {
  let openOpportunityId;

  before(async () => {
    const { status, body } = await apiRequest("GET", "/api/opportunities?limit=50");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);

    const open = body.data.find((item) => item.status === "open" && item.seats_left > 0);
    openOpportunityId = open?.id ?? body.data[0].id;
  });

  it("lists opportunities in §29 envelope with UI capacity fields", async () => {
    const { status, body } = await apiRequest("GET", "/api/opportunities?limit=50");
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.meta);

    const item = body.data[0];
    assert.ok("spots_filled" in item);
    assert.ok("interested_count" in item);
    assert.ok("seats_left" in item);
    assert.equal(typeof item.spots_filled, "number");
    assert.equal(typeof item.interested_count, "number");
  });

  it("returns §29 envelope on 404", async () => {
    const { status, body } = await apiRequest(
      "GET",
      "/api/opportunities/00000000-0000-4000-8000-000000000000",
    );
    assert.equal(status, 404);
    assert.equal(body.code, "NOT_FOUND");
    assert.ok(body.error);
  });

  it("runs email verification then token-based signup", async () => {
    const { body: listBody } = await apiRequest("GET", "/api/opportunities?limit=50");
    const target = listBody.data.find((item) => item.seats_left > 0);
    if (!target) {
      return;
    }
    const email = `api-test-${Date.now()}@example.test`;

    const start = await apiRequest("POST", "/api/email-verifications", { email });
    assert.equal(start.status, 201);
    assert.ok(start.body.demo_code);

    const confirm = await apiRequest(
      "PUT",
      `/api/email-verifications/${start.body.id}/confirmation`,
      { code: start.body.demo_code },
    );
    assert.equal(confirm.status, 200);
    assert.ok(confirm.body.verification_token);

    const volunteer = await apiRequest("POST", "/api/volunteers", {
      email,
      full_name: "API Test Volunteer",
      verification_token: confirm.body.verification_token,
    });
    assert.equal(volunteer.status, 201);
    assert.ok(volunteer.body.access_token);
    assert.ok(volunteer.body.page_url.includes(volunteer.body.access_token));

    const signup = await apiRequest(
      "POST",
      "/api/volunteer-signups",
      { opportunity_id: target.id },
      { "X-Volunteer-Token": volunteer.body.access_token },
    );
    assert.equal(signup.status, 201);
    assert.ok(signup.body.data?.signup?.id);

    const duplicate = await apiRequest(
      "POST",
      "/api/volunteer-signups",
      { opportunity_id: target.id },
      { "X-Volunteer-Token": volunteer.body.access_token },
    );
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.code, "CONFLICT");
  });

  it("accepts guest signup via POST /api/volunteer/signups", async () => {
    const { body: listBody } = await apiRequest("GET", "/api/opportunities?limit=50");
    const target = listBody.data.find((item) => item.seats_left > 0);
    if (!target) {
      return;
    }

    const email = `guest-signup-${Date.now()}@example.test`;
    const signup = await apiRequest("POST", "/api/volunteer/signups", {
      opportunity_id: target.id,
      full_name: "Guest Signup Test",
      email,
    });

    assert.equal(signup.status, 201);
    assert.ok(signup.body.data?.signup?.id);
    assert.ok(signup.body.data?.volunteer?.id);
    assert.ok(signup.body.data?.opportunity?.spots_filled >= 1);
  });
});
