/**
 * Adapts the auth layer's identity onto the shape the volunteer services read.
 *
 * `resolveAuth` publishes `{ userId, email, role, profile }`; the volunteering
 * services were written against `{ id, email }` and do `user.id` / `user.email`
 * directly. Renaming either side would touch another track's files, so the
 * translation lives here — one definition, called at the route boundary.
 *
 * Returns `null` rather than `undefined` for an anonymous caller because the
 * services branch on `user?.id ?? null` and store the result as `profile_id`,
 * which is a nullable column. `undefined` reaching a Supabase insert omits the
 * key instead of nulling it.
 *
 * Deliberately drops `role` and `profile`: authorisation belongs to
 * `requireRole`, and an actor carrying a role invites a service-level check
 * that quietly bypasses the middleware.
 *
 * @param {{ userId: string, email: string|null } | null | undefined} auth Usually `request.auth`.
 * @returns {{ id: string, email: string|null } | null}
 */
function actorFromAuth(auth) {
  if (!auth) {
    return null;
  }

  return { id: auth.userId, email: auth.email };
}

module.exports = { actorFromAuth };
