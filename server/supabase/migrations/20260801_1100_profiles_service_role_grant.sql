-- Profiles privileges for the Express service-role client.
-- Without this, `requireRole` cannot read `profiles.role` and falls back to
-- `auth.users.app_metadata.role` (also service-role only).
--
-- Apply in the Supabase SQL editor once.

grant select on table public.profiles to service_role;

-- Optional: promote a staff account after they sign up (role is never client-writable).
-- update public.profiles set role = 'admin' where email = 'you@example.com';
-- Or, until GRANT lands:
--   Auth → Users → user → App Metadata → { "role": "admin" }
