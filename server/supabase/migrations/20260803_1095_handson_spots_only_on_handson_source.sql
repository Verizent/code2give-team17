-- An internal listing has no HandsOn presence, so nobody can book through HandsOn for it.
--
-- One seeded row carried spots_filled_handson = 1 with source 'internal' and both
-- handson_url and handson_opportunity_id null: it described a booking that could not exist,
-- and it silently inflated that session's filled count by one. Nothing in the application
-- would ever have written that — it came straight from the seed file — which is exactly the
-- kind of mistake a constraint is for.
--
-- The mirror of handson_rows_carry_provenance, which already required a handson listing to
-- carry its remote URL.

update public.volunteer_opportunities
set spots_filled_handson = 0
where source <> 'handson' and spots_filled_handson <> 0;

alter table public.volunteer_opportunities
  add constraint handson_spots_only_on_handson_source
    check (source = 'handson' or spots_filled_handson = 0);
