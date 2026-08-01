// DEMO-ONLY: stub — real version must verify Supabase JWT, load role from `profiles`,
//            and return 401 for missing/invalid tokens (§30, BE1 track).
/** @param {import('express').Request} req @param {import('express').Response} res @param {import('express').NextFunction} next */
module.exports = function requireAuth(req, res, next) {
  req.user = { id: "demo-admin", role: "admin" };
  next();
};
