const { getSupabase } = require("../config/supabase");
const { ApiError } = require("../lib/api-error");
const { normalizeEmail } = require("../lib/normalize");
const { upsertDonor } = require("./donors.service");

const VALID_FREQUENCIES = new Set(["once", "weekly", "monthly"]);
const VALID_PROGRAMMES = new Set([
  "sports",
  "fitness",
  "nutrition",
  "family",
  "where_needed",
]);

async function resolveCampaignId(campaignSlug) {
  if (!campaignSlug) {
    return null;
  }

  const db = getSupabase();
  const { data, error } = await db
    .from("campaigns")
    .select("id, slug, raised_hkd, status")
    .eq("slug", campaignSlug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "Campaign not found");
  }

  if (data.status !== "approved") {
    throw new ApiError(409, "Campaign is not approved for donations yet");
  }

  return data;
}

/**
 * DEMO-ONLY: records a succeeded donation without Stripe.
 * Real version: POST creates Stripe Checkout Session, webhook marks succeeded.
 */
async function createDonation(input) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw new ApiError(400, "A valid email is required");
  }

  const amount = Number(input.amount_hkd);
  if (!Number.isInteger(amount) || amount < 1) {
    throw new ApiError(400, "amount_hkd must be a positive integer");
  }

  const frequency = input.frequency || "once";
  if (!VALID_FREQUENCIES.has(frequency)) {
    throw new ApiError(400, "Invalid frequency");
  }

  const programme = input.programme || "where_needed";
  if (!VALID_PROGRAMMES.has(programme)) {
    throw new ApiError(400, "Invalid programme");
  }

  const campaign = await resolveCampaignId(input.campaign_slug);
  const donor = await upsertDonor({ email, trackingOptIn: true });
  const db = getSupabase();

  const { data: donation, error: donationError } = await db
    .from("donations")
    .insert({
      donor_id: donor.id,
      amount_hkd: amount,
      frequency,
      programme,
      campaign_id: campaign?.id ?? null,
      status: "succeeded",
    })
    .select("id, amount_hkd, frequency, programme, status, created_at")
    .single();

  if (donationError) {
    throw donationError;
  }

  if (campaign) {
    const nextRaised = (campaign.raised_hkd || 0) + amount;
    const { error: campaignError } = await db
      .from("campaigns")
      .update({ raised_hkd: nextRaised })
      .eq("id", campaign.id);

    if (campaignError) {
      throw campaignError;
    }
  }

  return {
    ...donation,
    email,
    campaign_slug: campaign?.slug ?? null,
    access_token: donor.access_token,
  };
}

async function donorHasHistory(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return false;
  }

  const db = getSupabase();
  const { count, error } = await db
    .from("donors")
    .select("id", { count: "exact", head: true })
    .eq("email", normalized);

  if (error) {
    throw error;
  }

  return (count ?? 0) > 0;
}

module.exports = {
  createDonation,
  donorHasHistory,
};
