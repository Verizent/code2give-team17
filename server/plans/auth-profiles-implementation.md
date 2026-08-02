# Plan: Auth Middleware + Profiles Identity Layer

**Branch:** `feature/donations-backend`  
**Working directory:** `server/`  
**Stack:** Node.js/Express 5, CommonJS (`require`/`module.exports`), Supabase (Postgres + Auth), Zod v4  
**Test runner:** `node --test --test-concurrency=1` (no Jest/Vitest)

---

## Context

The server needs role-based auth middleware (`requireAuth`, `requireRole`) so protected routes can
enforce access without duplicating logic. `profiles` extends Supabase's built-in `auth.users` table
and is the single source of truth for user roles.

The test file is **already written** at `tests/middleware/auth.test.js` and is currently RED
(failing because the implementation files don't exist yet). Your job is to make it GREEN.

---

## Critical constraints

- `role` is NEVER set by the client — DB default is `'volunteer'`, promotion to `'admin'` is
  server-side only.
- `requireRole(role)` must always be used **after** `requireAuth` in the middleware chain.
- No `console.log` anywhere.
- Follow the existing error pattern exactly: throw `ApiError` from `src/lib/api-error.js` and
  let `middleware/error-handler.js` format it — never call `res.status(...).json(...)` in
  middleware.
- All Supabase access via `getSupabase()` from `src/config/supabase.js` (service-role key,
  bypasses RLS).

---

## Existing patterns to mirror

| What | File to read first |
|---|---|
| Repo pattern | `src/data/articles.repo.js` — `getSupabase()`, throw `error` directly |
| Error pattern | `src/lib/api-error.js` — `ApiError.unauthenticated()`, `ApiError.forbidden()` |
| Route pattern | `src/routes/articles.routes.js` — `validate()` + `envelope()` + `next(error)` |
| Envelope | `src/lib/envelope.js` — `envelope(data)` |
| Test mocking | `tests/services/donors.service.test.js` — `mock.method(module, 'fn', stub)` + `t.after(() => mock.restoreAll())` |
| Migration format | `supabase/migrations/20260801_1050_donations.sql` |

---

## Files to create

### 1. `src/data/profiles.repo.js` ← START HERE (tests mock this)

```js
const { getSupabase } = require("../config/supabase");

async function findById(id) {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, role, email, full_name, phone, locale")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data; // null when not found
}

async function upsertProfile(id, data) {
  const { error } = await getSupabase()
    .from("profiles")
    .upsert({ id, ...data }, { onConflict: "id" });
  if (error) throw error;
}

module.exports = { findById, upsertProfile };
```

---

### 2. `src/middleware/auth.js`

Two exports: `requireAuth` (async middleware) and `requireRole(role)` (factory returning middleware).

```js
// DEMO-ONLY: no token refresh handling — real version needs supabase-js session refresh
// and should handle expired refresh tokens gracefully (§9, §30).
const { getSupabase } = require("../config/supabase");
const { ApiError } = require("../lib/api-error");
const profilesRepo = require("../data/profiles.repo");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers["authorization"];
    if (!header || !header.startsWith("Bearer ")) {
      return next(ApiError.unauthenticated());
    }
    const token = header.slice(7);

    const { data: { user }, error } = await getSupabase().auth.getUser(token);
    if (error || !user) {
      return next(ApiError.unauthenticated());
    }

    const profile = await profilesRepo.findById(user.id);
    if (!profile) {
      return next(ApiError.unauthenticated("No profile found for this user"));
    }

    req.user = { id: profile.id, role: profile.role, email: profile.email, locale: profile.locale };
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(ApiError.forbidden());
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
```

---

### 3. `src/routes/me.routes.js`

```js
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { envelope } = require("../lib/envelope");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  res.json(envelope(req.user));
});

module.exports = router;
```

---

### 4. Register in `src/routes/index.js`

Add alphabetically (between `impactRoutes` and `wishlistRoutes`):

```js
const meRoutes = require("./me.routes");
// ...
router.use("/api/me", meRoutes);
```

---

### 5. `supabase/migrations/20260801_1060_profiles.sql`

```sql
-- Identity layer. profiles extends auth.users — same id, no separate UUID.
-- NOT APPLIED. Run in Supabase SQL editor after announcing it.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'volunteer' check (role in ('volunteer', 'admin')),
  full_name   text,
  email       text,
  phone       text,
  locale      text not null default 'en' check (locale in ('en', 'zh-Hant')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- role is server-side only. Never expose a setter to the client.

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a volunteer profile on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
-- No policies: service-role key bypasses RLS (§9).
```

---

## The existing test file (already written — do NOT rewrite it)

`tests/middleware/auth.test.js` — 8 tests covering:

1. `requireAuth` → 401 when `Authorization` header is missing  
2. `requireAuth` → 401 when header has no `Bearer` prefix  
3. `requireAuth` → 401 when Supabase `auth.getUser` returns an error  
4. `requireAuth` → 401 when profile row is `null`  
5. `requireAuth` → attaches `req.user` and calls `next()` with no error on success  
6. `requireRole('admin')` → 403 when `req.user.role` is `'volunteer'`  
7. `requireRole('admin')` → calls `next()` with no error when role is `'admin'`  
8. `requireRole('volunteer')` → calls `next()` with no error when role is `'volunteer'`

The tests mock `supabaseConfig.getSupabase` and `profilesRepo.findById` via `mock.method`.

---

## Verification

```bash
# Run just the new tests
node --test tests/middleware/auth.test.js

# All 8 should pass (GREEN)

# Then run full suite to check no regressions
npm test
# Expect: all existing tests + 8 new = pass, 0 fail
```

---

## What NOT to build

- Token refresh logic (DEMO-ONLY for now)
- `/api/admin/*` auth gates — add `requireAuth, requireRole('admin')` to those routes separately once this middleware is green
- `profiles` CRUD admin endpoints — out of scope for this task
