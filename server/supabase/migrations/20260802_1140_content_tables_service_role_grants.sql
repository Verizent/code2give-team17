-- Content tables were created with RLS on and zero policies (correct — anon
-- must read nothing), but without DML grants to service_role. PostgREST then
-- returns "permission denied for table …", and Story desk / Articles CMS /
-- Voices / Impact treat that as available: false ("migration not applied").
-- Same class of bug as volunteer tables (test/schema/README.md).
--
-- Safe to re-run. Apply in the Supabase SQL editor after 20260802_1130 (and
-- the earlier content migrations) if those already landed without grants.

grant select, insert, update, delete on table public.session_proofs to service_role;
grant select, insert, update, delete on table public.social_drafts to service_role;
grant select, insert, update, delete on table public.articles to service_role;
grant select, insert, update, delete on table public.community_posts to service_role;
grant select, insert, update, delete on table public.impact_periods to service_role;
