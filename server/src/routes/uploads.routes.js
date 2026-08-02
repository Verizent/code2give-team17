// DEMO-ONLY: no rate limit and no auth — anyone who can reach the Voices form can post
//            bytes here. Real version needs express-rate-limit and a per-IP quota
//            (lockfile change for six people, §17 integration notes).
const express = require("express");
const { ApiError } = require("../lib/api-error");
const { envelope } = require("../lib/envelope");
const mediaService = require("../services/content/media.service");

const router = express.Router();

/**
 * `POST /api/uploads/community-photo` — the photo attached to a Voices submission.
 *
 * Takes the image as a raw body rather than multipart: there is exactly one file and no
 * other fields, so multipart would mean a new parser dependency for no gain.
 *
 * The `type` allowlist here only decides which requests express.raw() will buffer; it is
 * not the security boundary. A caller can claim any Content-Type, so the service sniffs
 * the bytes and that is what actually decides.
 */
router.post(
  "/community-photo",
  express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }),
  async (request, response, next) => {
    try {
      if (!Buffer.isBuffer(request.body)) {
        throw ApiError.badRequest("Send the image as a raw JPEG, PNG or WebP body.");
      }

      const photoUrl = await mediaService.uploadCommunityPhoto(request.body);
      response.status(201).json(envelope({ photo_url: photoUrl }));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
