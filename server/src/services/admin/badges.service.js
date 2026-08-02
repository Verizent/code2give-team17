const badgesRepo = require("../../data/badges.repo");
const signupsRepo = require("../../data/volunteer-signups.repo");

/**
 * Evaluates every badge criterion against the volunteer's attended signups and
 * inserts any newly-earned rows. Safe to re-run — the unique constraint on
 * `volunteer_badges (volunteer_id, badge_id)` plus `ignoreDuplicates:true` swallows
 * repeat awards (§50 SQL comment).
 *
 * @param {string} volunteerId
 * @returns {Promise<string[]>} badge ids awarded in THIS call (excludes ones already held).
 */
async function awardAfterAttendance(volunteerId) {
  const [catalog, attendedSignups, earnedIds] = await Promise.all([
    badgesRepo.listAllBadges(),
    signupsRepo.listAttendedForVolunteer(volunteerId),
    badgesRepo.listEarnedBadgeIdsForVolunteer(volunteerId),
  ]);

  const stats = summariseAttended(attendedSignups);
  const newlyEarned = [];

  for (const badge of catalog) {
    if (earnedIds.has(badge.id)) {
      continue;
    }
    if (meetsCriterion(badge, stats)) {
      newlyEarned.push(badge.id);
    }
  }

  if (newlyEarned.length > 0) {
    await badgesRepo.insertVolunteerBadges(
      newlyEarned.map((badgeId) => ({ volunteer_id: volunteerId, badge_id: badgeId })),
    );
  }

  return newlyEarned;
}

/**
 * @param {object[]} attendedSignups
 */
function summariseAttended(attendedSignups) {
  const signupCount = attendedSignups.length;
  const hours = attendedSignups.reduce(
    (sum, row) => sum + Number(row.hours_logged || 0),
    0,
  );
  const programmes = new Set();
  for (const row of attendedSignups) {
    const programme = row.volunteer_opportunities?.programme;
    if (programme) {
      programmes.add(programme);
    }
  }

  return {
    signup_count: signupCount,
    hours,
    programme_variety: programmes.size,
    streak: 0,
  };
}

/**
 * @param {{ criteria_type: string, threshold: number }} badge
 * @param {{ signup_count: number, hours: number, programme_variety: number, streak: number }} stats
 */
function meetsCriterion(badge, stats) {
  const value = stats[badge.criteria_type];
  if (value === undefined) {
    return false;
  }
  return value >= badge.threshold;
}

module.exports = { awardAfterAttendance };
