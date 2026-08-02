const express = require("express");
const { envelope } = require("../../lib/envelope");
const { ApiError } = require("../../lib/api-error");
const uploadsService = require("../../services/admin/uploads.service");

const router = express.Router();

/**
 * POST /api/admin/uploads/cover — raw image bytes, Content-Type is the image type.
 *
 * `express.raw` on this route only, rather than multipart with a new dependency or base64
 * through the global JSON parser. Multipart would mean adding multer for six people;
 * base64 inflates every upload by a third and would need the global 100 kb JSON limit
 * raised for all routes. The raw-body-on-one-route shape already exists in app.js for the
 * Stripe webhook.
 *
 * The limit here is a second line of defence — the service checks size too, and the
 * bucket enforces its own 5 MB ceiling.
 */
router.post(
  "/cover",
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }),
  async (request, response, next) => {
    try {
      if (!Buffer.isBuffer(request.body)) {
        // express.raw leaves a non-Buffer when the Content-Type did not match its filter.
        throw ApiError.badRequest("Send raw image bytes with an image Content-Type");
      }

      // The header is not passed on: the service sniffs the bytes, because a caller can
      // claim any Content-Type and the bucket is public.
      const result = await uploadsService.uploadCoverImage(request.body);

      response.status(201).json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
