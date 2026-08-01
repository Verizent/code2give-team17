const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const profilesRepo = require("../../src/data/profiles.repo");
const { resolveProfile, requireRole } = require("../../src/middleware/auth");

test("resolveProfile prefers profiles.role", async (t) => {
  mock.method(profilesRepo, "findById", async () => ({
    id: "u1",
    role: "admin",
    email: "a@example.com",
    full_name: "A",
    locale: "en",
    phone: null,
  }));
  t.after(() => mock.restoreAll());

  const profile = await resolveProfile({
    id: "u1",
    email: "a@example.com",
    app_metadata: { role: "volunteer" },
  });
  assert.equal(profile.role, "admin");
});

test("resolveProfile falls back to app_metadata when profiles unreadable", async (t) => {
  mock.method(profilesRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  const profile = await resolveProfile({
    id: "u1",
    email: "a@example.com",
    app_metadata: { role: "admin" },
  });
  assert.equal(profile.role, "admin");
});

test("resolveProfile defaults to volunteer", async (t) => {
  mock.method(profilesRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  const profile = await resolveProfile({ id: "u1", email: "a@example.com", app_metadata: {} });
  assert.equal(profile.role, "volunteer");
});

test("requireRole forbids non-admin", async (t) => {
  mock.method(profilesRepo, "findById", async () => ({
    id: "u1",
    role: "volunteer",
    email: "v@example.com",
  }));
  t.after(() => mock.restoreAll());

  const mw = requireRole("admin");
  const request = { user: { id: "u1", email: "v@example.com", app_metadata: {} } };
  let err;
  await new Promise((resolve) => {
    mw(request, {}, (e) => {
      err = e;
      resolve();
    });
  });
  assert.equal(err.status, 403);
});

test("requireRole allows admin", async (t) => {
  mock.method(profilesRepo, "findById", async () => ({
    id: "u1",
    role: "admin",
    email: "a@example.com",
  }));
  t.after(() => mock.restoreAll());

  const mw = requireRole("admin");
  const request = { user: { id: "u1", email: "a@example.com", app_metadata: {} } };
  let called = false;
  let err;
  await new Promise((resolve) => {
    mw(request, {}, (e) => {
      err = e;
      called = !e;
      resolve();
    });
  });
  assert.equal(err, undefined);
  assert.equal(called, true);
  assert.equal(request.profile.role, "admin");
});
