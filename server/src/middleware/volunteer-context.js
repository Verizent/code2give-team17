const { getServiceClient } = require("../config/supabase");
const { ApiError } = require("../lib/api-error");

/**
 * Resolves the acting volunteer from X-Volunteer-Token or an authenticated profile_id.
 *
 * @type {import("express").RequestHandler}
 */
async function volunteerContext(request, _response, next) {
  try {
    const token = request.get("X-Volunteer-Token");
    const db = getServiceClient();

    if (token) {
      const { data, error } = await db
        .from("volunteers")
        .select("id, email, full_name, profile_id, access_token, claimed_at, locale")
        .eq("access_token", token)
        .maybeSingle();

      if (error) {
        const wrapped = new Error(error.message);
        wrapped.status = 500;
        throw wrapped;
      }

      if (!data) {
        next(ApiError.unauthenticated("Invalid volunteer token"));
        return;
      }

      request.volunteer = data;
      next();
      return;
    }

    if (request.auth?.userId) {
      const { data, error } = await db
        .from("volunteers")
        .select("id, email, full_name, profile_id, access_token, claimed_at, locale")
        .eq("profile_id", request.auth.userId)
        .maybeSingle();

      if (error) {
        const wrapped = new Error(error.message);
        wrapped.status = 500;
        throw wrapped;
      }

      if (!data) {
        next(ApiError.unauthenticated("No volunteer profile linked to this account"));
        return;
      }

      request.volunteer = data;
      next();
      return;
    }

    next(ApiError.unauthenticated("Volunteer token or authentication required"));
  } catch (error) {
    next(error);
  }
}

module.exports = volunteerContext;
