const { ApiError } = require("../../lib/api-error");
const { isMissingTable } = require("../../lib/missing-table");
const proofsRepo = require("../../data/proofs.repo");
const socialDraftsRepo = require("../../data/social-drafts.repo");

/**
 * Maps a DB row to the admin API shape (thumb, not thumb_url).
 * @param {object} row
 */
function toApi(row) {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    programme: row.programme,
    captured_at: row.captured_at,
    consent: row.consent,
    members_visible: row.members_visible,
    members_blurred: row.members_blurred,
    thumb: row.thumb_url,
    status: row.status,
    approved_at: row.approved_at,
    fanout: row.fanout,
  };
}

/**
 * @param {object} proof
 */
function buildFanout(proof) {
  const blurNote =
    proof.consent === "consented"
      ? "All faces cleared for public use."
      : proof.consent === "partial"
        ? `${proof.members_blurred} member(s) auto-blurred — unconsented.`
        : "All members blurred — no public facial consent.";

  return {
    website_story: {
      locale: "en",
      headline: proof.title,
      excerpt: `A Love 21 session worth sharing. ${blurNote}`,
      path: `/news?proof=${proof.id}`,
    },
    drafts: [
      {
        channel: "instagram",
        lang: "en",
        caption: `${proof.title}\n\n#SoMuchAbility #Love21`,
      },
      {
        channel: "instagram",
        lang: "zh-Hant",
        caption: `${proof.title}\n\n#SoMuchAbility #Love21`,
      },
      {
        channel: "facebook",
        lang: "en",
        caption: `Update from Love 21: ${proof.title}. Thank you to every volunteer who showed up.`,
      },
    ],
    languages: ["en", "zh-Hant", "zh-Hans"],
    stats_delta: { sessions_featured: 1, photos_published: 1 },
    blur_note: blurNote,
  };
}

/**
 * @returns {Promise<{ items: object[], available: boolean }>}
 */
async function listAll() {
  try {
    const rows = await proofsRepo.listAll();
    return { items: rows.map(toApi), available: true };
  } catch (error) {
    if (isMissingTable(error, "session_proofs")) {
      return { items: [], available: false };
    }
    throw error;
  }
}

/**
 * @returns {Promise<number>}
 */
async function countPending() {
  try {
    return await proofsRepo.countByStatus("pending");
  } catch (error) {
    if (isMissingTable(error, "session_proofs")) return 0;
    throw error;
  }
}

/**
 * Approve a proof: persist status + fanout, insert caption drafts once.
 * Does not publish to Meta — drafts are for copy-to-clipboard only.
 *
 * @param {string} id
 */
async function approve(id) {
  let proof;
  try {
    proof = await proofsRepo.findById(id);
  } catch (error) {
    if (isMissingTable(error, "session_proofs")) {
      throw ApiError.badRequest(
        "Story desk is unavailable until session_proofs is applied (20260802_1130)",
      );
    }
    throw error;
  }

  if (!proof) throw ApiError.notFound("Proof not found");

  if (proof.status === "approved" && proof.fanout) {
    return toApi(proof);
  }

  const fanout = buildFanout(proof);
  const approved = await proofsRepo.updateApproval(id, {
    status: "approved",
    approved_at: new Date().toISOString(),
    fanout,
  });

  const existing = await socialDraftsRepo.countByProofId(id);
  if (existing === 0) {
    await socialDraftsRepo.insertMany(
      fanout.drafts.map((d) => ({
        channel: d.channel,
        lang: d.lang,
        caption: d.caption,
        status: "draft",
        proof_id: id,
      })),
    );
  }

  return toApi(approved);
}

module.exports = { listAll, countPending, approve, buildFanout, toApi };
