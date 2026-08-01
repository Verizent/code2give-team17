# 00_shared

Objects used by more than one domain. Nothing here is volunteer-specific, so **other tracks may
reuse it rather than defining their own**.

| File | Object | Notes |
|---|---|---|
| `00_set_updated_at.sql` | `public.set_updated_at()` | `updated_at` trigger function |

**Runs first.** Every table carrying `updated_at` attaches a trigger to this function, so it must
exist before those tables are created.

`search_path` is pinned to `''` on the function. An unpinned `search_path` lets a caller with
`CREATE` on a schema shadow a referenced object — Supabase's advisor flags it as
`0011_function_search_path_mutable`.
