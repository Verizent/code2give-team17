-- Profiles privileges for the Express service-role client.
-- Prefer the fuller migration `20260801_1120_profiles_volunteer_prefs.sql`,
-- which also adds volunteer-pref columns, the signup trigger, and grants.
--
-- Apply in the Supabase SQL editor once if you only need SELECT today.

grant select on table public.profiles to service_role;

-- Optional: promote a staff account after they sign up (role is never client-writable).
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- Or, until GRANT lands:
--   Auth → Users → user → App Metadata → { "role": "admin" }
