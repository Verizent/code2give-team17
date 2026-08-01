create table public.volunteer_email_verifications (
  id uuid primary key default gen_random_uuid(),

  email text not null,

  -- The code itself is NEVER stored — only an HMAC of it, keyed with a server secret. Anyone
  -- reading this table learns nothing they could use, and a leaked database does not let someone
  -- precompute the million possible six-digit codes.
  code_hash text not null,

  -- Wrong-code counter. Six digits is only a million possibilities, so this cap — not the code
  -- length — is what actually makes the code safe. Refuse further attempts past it.
  attempts integer not null default 0,

  expires_at timestamptz not null,
  consumed_at timestamptz,

  -- Issued on successful confirmation. Short-lived, single use, and scoped to the email it
  -- proved, so it cannot authorise creating a volunteer for a different address.
  verification_token text unique check (length(verification_token) >= 32),
  verification_token_expires_at timestamptz,

  created_at timestamptz not null default now(),

  -- Same normalisation rule as volunteers.email. Lookups are by address, so a mismatch here
  -- means a verification silently fails to be found.
  constraint email_is_normalised check (email = lower(btrim(email))),

  -- A token can only exist on a row that was actually consumed.
  constraint token_only_on_consumed_rows
    check ((verification_token is null) or (consumed_at is not null))
);

comment on table public.volunteer_email_verifications is
  'Short-lived email ownership proofs. Rows are disposable: expired and consumed rows carry no '
  'value and can be deleted freely.';
comment on column public.volunteer_email_verifications.code_hash is
  'HMAC of the code, never the code itself. Compare in constant time - a plain equality check on '
  'a hash leaks through timing, which is the signal a brute-force wants.';
comment on column public.volunteer_email_verifications.attempts is
  'Wrong-code counter. The service must refuse further attempts past a cap so a 6-digit code '
  'cannot be brute-forced within its lifetime.';

-- Supports "the most recent verification for this address".
create index volunteer_email_verifications_email_idx
  on public.volunteer_email_verifications (email, created_at desc);

-- §9: deny-all. Every read and write goes through the API on the service-role key.
alter table public.volunteer_email_verifications enable row level security;

-- --------------------------------------------------------------------------------------------
-- Column added to volunteers by the same migration.
--
-- Null means nobody has proved they own the address. Kept on volunteers rather than derived from
-- this table so a verification row can be deleted without losing the fact that it happened.
-- --------------------------------------------------------------------------------------------

alter table public.volunteers
  add column email_verified_at timestamptz;

comment on column public.volunteers.email_verified_at is
  'Set when the address was proved via volunteer_email_verifications. Null means the row exists '
  'but nobody has demonstrated they own the address.';

-- --------------------------------------------------------------------------------------------
-- IMPLEMENTATION NOTES for whoever rebuilds the logic. Each of these was in the removed version
-- and each is load-bearing rather than decorative.
--
--   * Uniform response. Starting a verification must answer identically whether or not the
--     address is already a volunteer. §15 established this for the donor recovery form because a
--     differing response "turns the form into an oracle for testing whether a named person
--     donated to a disability charity". The question here is whether someone volunteers at a
--     Down syndrome and autism charity — at least as sensitive.
--   * Constant-time comparison of code_hash.
--   * Guard the consume with `where consumed_at is null` so two concurrent confirmations cannot
--     both succeed. The second matches no row.
--   * Codes from a CSPRNG (crypto.randomInt), never Math.random().
--   * Rate limit per address, or the endpoint is an email-bombing tool.
--   * §17: Resend reaches only our own verified addresses until DNS is verified on
--     love21foundation.com, so a demo needs a console transport — and returning the code in an
--     API response to make that work defeats verification entirely. Flag it DEMO-ONLY (§26).
-- --------------------------------------------------------------------------------------------
