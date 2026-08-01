const donationsService = require("../donations/donations.service");
const signupsService = require("../volunteering/signups.service");

/**
 * @typedef {{
 *   id: string,
 *   headline: string,
 *   detail: string,
 *   happened_at: string,
 *   programme: string,
 *   members_count: number,
 *   source: 'live',
 * }} ProofReceipt
 */

/**
 * Garden growth aligned with Giving cumulative tree (levels 1–4).
 * Client merges education reads + wishlist item pledges on top.
 * Arc: seed → sprout → sapling → young / mature grove.
 *
 * @param {{
 *   giftCount: number,
 *   fundedClasses: number,
 *   hoursTotal: number,
 *   totalGiven: number,
 *   sessionCount?: number,
 * }} input
 */
function computeGarden(input) {
  const { giftCount, fundedClasses, hoursTotal, totalGiven, sessionCount = 0 } = input;
  let level = 1;

  // Volunteer mid-tree (learn is applied on the client)
  if (hoursTotal > 0 || sessionCount > 0) level = 3;
  if (hoursTotal >= 3 || sessionCount >= 1) level = Math.max(level, 4);

  // Money gifts — toward mature canopy
  if (giftCount >= 1) level = Math.max(level, 3);
  if (giftCount >= 2) level = Math.max(level, 4);
  if (fundedClasses >= 1) level = Math.max(level, 4);
  if ((hoursTotal > 0 || sessionCount > 0) && giftCount > 0) {
    level = 4;
  }

  return {
    level: Math.min(4, Math.max(1, level)),
    education_count: 0,
    session_count: sessionCount,
    hours_total: hoursTotal,
    gift_count: giftCount,
    funded_classes: fundedClasses,
    total_given_hkd: totalGiven,
    item_pledges: 0,
    item_lines: 0,
    fruit_count: Math.min(6, fundedClasses + Math.floor(hoursTotal / 6)),
  };
}

/**
 * @param {Array<{ status?: string, amount_hkd?: number, frequency?: string }>} donations
 * @param {number} hoursTotal
 */
function computeConversion(donations, hoursTotal) {
  const isMonthly = donations.some(
    (d) => d.frequency === "monthly" || d.frequency === "weekly",
  );
  const totalGiven = donations.reduce((sum, d) => sum + (d.amount_hkd || 0), 0);

  if (hoursTotal >= 12 && !isMonthly) {
    return {
      id: "hours_to_monthly",
      kind: "monthly",
      hours: hoursTotal,
      cta_path: "/give?frequency=monthly",
    };
  }

  if (giftCountNearClass(totalGiven) && !isMonthly) {
    return {
      id: "one_more_class",
      kind: "term",
      amount_toward_class_hkd: totalGiven % 2500,
      class_cost_hkd: 2500,
      cta_path: "/give",
    };
  }

  if (donations.length > 0 && !isMonthly) {
    return {
      id: "become_monthly",
      kind: "monthly",
      hours: hoursTotal,
      cta_path: "/give?frequency=monthly",
    };
  }

  if (donations.length === 0 && hoursTotal > 0) {
    return {
      id: "volunteer_to_give",
      kind: "first_gift",
      hours: hoursTotal,
      cta_path: "/give",
    };
  }

  return null;
}

/** Rough class cost for conversion messaging (programme fund, not a calculator). */
function giftCountNearClass(totalGiven) {
  if (totalGiven <= 0) return false;
  const remainder = totalGiven % 2500;
  return remainder >= 1500 || (totalGiven >= 500 && totalGiven < 2500);
}

/**
 * Authed supporter retention page: garden + proof receipts + conversion + prefs.
 * Proof receipts stay empty until allocation→session fan-out exists (§15) —
 * no seeded stand-ins.
 *
 * @param {{ id: string, email?: string, user_metadata?: { full_name?: string } }} user
 */
async function getMeImpact(user) {
  const [donationsMe, volunteerMe] = await Promise.all([
    donationsService.getDonationsMe(user),
    signupsService.getVolunteerMe(user),
  ]);

  const donations = donationsMe.donations ?? [];
  const hoursTotal = volunteerMe.stats?.hours_total ?? 0;
  const totalGiven = donations.reduce((sum, d) => sum + (d.amount_hkd || 0), 0);
  const fundedClasses = donations.filter((d) =>
    ["matched", "completed", "session_update", "allocated"].includes(d.status),
  ).length;

  const garden = computeGarden({
    giftCount: donations.length,
    fundedClasses,
    hoursTotal,
    totalGiven,
    sessionCount: volunteerMe.stats?.session_count ?? 0,
  });

  /** @type {ProofReceipt[]} */
  const receipts = [];

  const conversion = computeConversion(donations, hoursTotal);
  const donor = donationsMe.donor;

  return {
    garden,
    receipts,
    conversion,
    account: {
      email: user.email ?? donor?.email ?? null,
      full_name:
        volunteerMe.volunteer?.full_name ??
        donor?.full_name ??
        user.user_metadata?.full_name ??
        null,
      locale: donor?.locale ?? volunteerMe.volunteer?.locale ?? null,
      journey_updates: Boolean(donor?.tracking_opt_in),
      email_notifications: Boolean(donor?.tracking_opt_in),
      photo_story_consent: false,
    },
    donations,
    volunteer: {
      stats: volunteerMe.stats,
      session_count: volunteerMe.stats?.session_count ?? 0,
    },
  };
}

module.exports = {
  getMeImpact,
  computeGarden,
  computeConversion,
};
