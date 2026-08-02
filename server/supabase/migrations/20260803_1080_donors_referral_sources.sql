-- Donor referral sources — "how did you hear about Love 21", asked on the donate form.
--
-- Multi-valued, so this is text[] rather than the single-choice text that
-- profiles.discovery uses for volunteers. The two vocabularies are deliberately
-- separate: a volunteer arrives through channels a donor does not (and vice
-- versa), and merging them would force one list to be wrong for one audience.
--
-- Recorded once per DONOR, not per donation. A supporter who gives four times
-- answers on their first gift and is never asked again — see upsertDonor, which
-- writes these only while the column is still empty. That rule is also what stops
-- a later gift (or a third party naming someone else's address) from rewriting an
-- answer already given, the same reasoning that keeps tracking_opt_in create-only.

alter table public.donors
  add column if not exists referral_sources text[] not null default '{}';
alter table public.donors
  add column if not exists referral_source_other text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'donors_referral_sources_check'
      and conrelid = 'public.donors'::regclass
  ) then
    -- Validates every element, not the array as a whole: `<@` is true only when each
    -- member is in the allowed set, so one bad value rejects the write instead of
    -- being stored alongside good ones.
    alter table public.donors
      add constraint donors_referral_sources_check
      check (
        referral_sources <@ array[
          'friend_family', 'social', 'edm', 'company',
          'event', 'press', 'search', 'other'
        ]::text[]
      );
  end if;
end $$;

comment on column public.donors.referral_sources is
  'How the donor found Love 21. Multi-select, optional, written once on the first gift.';
comment on column public.donors.referral_source_other is
  'Free text when referral_sources contains other.';
