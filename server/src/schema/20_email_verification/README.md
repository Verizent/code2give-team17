# 20_email_verification

> **Status: deployed but unused.** The table exists in the database; the application logic that
> drove it was built and then removed by decision. Nothing reads or writes it today.
>
> It is kept documented rather than dropped so the design is not lost, and so nobody is puzzled
> by an undocumented table and an unexplained column on `volunteers`.

| File | Objects |
|---|---|
| `00_volunteer_email_verifications.sql` | `volunteer_email_verifications` table · `volunteers.email_verified_at` column |

**Depends on `10_volunteers/00_volunteers.sql`** — the file ends with an `ALTER TABLE` adding
`email_verified_at` to `volunteers`, so it must run after that table exists. That is why this
folder sorts last.

## What it was for

Volunteers register without an account, so **an email address is the only identity they have** and
nothing otherwise proves it is theirs. §5 records HandsOn listings typically carry one spot per
session, so an unverified signup does not just create a junk row — it fills the session.

The flow: request a verification for an address → six-digit code, HMAC-hashed, 15-minute TTL →
confirm the code → receive a short-lived single-use token scoped to that address → creating a
volunteer requires that token.

## What it is not

**Not a recovery form.** §15's "find my page" is donor-only and belongs to the donations track
(§30). Confirming here yields a token authorising the *creation* of a volunteer — it never returns
an existing volunteer's `access_token`, so it cannot be used to reach somebody else's page. If
this is ever rebuilt, keep that separation: it is the whole reason the feature is not a recovery
form wearing a different name.

## If you rebuild it

The SQL file lists the security properties that made the removed version safe — uniform responses,
constant-time comparison, the attempt cap, the concurrent-confirmation guard, CSPRNG codes, and
the per-address throttle. Each is load-bearing. Read them before writing the service.

## If you drop it instead

One migration: `drop table public.volunteer_email_verifications;` and
`alter table public.volunteers drop column email_verified_at;`. Both are empty and nothing
references them. Delete this folder in the same PR.
