# 10_volunteers

The volunteer domain. **This is the deliverable** — six tables, all deployed, all empty.

| File | Table | Purpose |
|---|---|---|
| `00_volunteers.sql` | `volunteers` | identity, keyed on normalised email |
| `10_volunteer_opportunities.sql` | `volunteer_opportunities` | the listings |
| `20_volunteer_signups.sql` | `volunteer_signups` | bookings made on our site |
| `30_volunteer_interests.sql` | `volunteer_interests` | leads, **not** bookings |
| `40_badges.sql` | `badges` | badge definitions |
| `50_volunteer_badges.sql` | `volunteer_badges` | awards |

File order is dependency order. `volunteers` and `volunteer_opportunities` must exist before the
three tables that reference them.

## The three things most likely to trip you up

1. **`volunteer_id` is the identity, not `profile_id`.** Volunteers do not need an account, so
   `volunteer_signups.profile_id` is nullable and usually null. A query keyed on it silently
   misses nearly every volunteer and still looks correct.
2. **RLS is on with no policies.** The anon key reads nothing and writes nothing *without
   erroring* — you get empty arrays. Use the service-role key.
3. **Never sum `spots_filled` with `volunteer_interests`.** The first is bookings inside
   HandsOn's system, the second is our leads. See "Seats remaining" in `../../README.md`.

Full conventions, relationships and known gaps: `../../README.md`.
