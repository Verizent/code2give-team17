const { getSupabase } = require("../config/supabase");
const { ApiError } = require("../lib/api-error");
const { slugify } = require("../lib/normalize");

function mapCampaign(row) {
  return {
    slug: row.slug,
    title: row.title,
    story: row.story,
    goal_hkd: row.goal_hkd,
    raised_hkd: row.raised_hkd,
    cover: row.cover_image_url,
    end_date: row.end_date,
    status: row.status,
    created_at: row.created_at,
  };
}

async function listCampaigns({ approvedOnly = false } = {}) {
  const db = getSupabase();
  let query = db.from("campaigns").select("*").order("created_at", { ascending: false });

  if (approvedOnly) {
    query = query.eq("status", "approved");
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCampaign);
}

async function listCampaignsForGive(slugs = []) {
  const db = getSupabase();

  if (!slugs.length) {
    return { public: await listCampaigns({ approvedOnly: true }), mine: [] };
  }

  const [approved, mineResult] = await Promise.all([
    listCampaigns({ approvedOnly: true }),
    db.from("campaigns").select("*").in("slug", slugs),
  ]);

  if (mineResult.error) {
    throw mineResult.error;
  }

  const mine = (mineResult.data ?? [])
    .map(mapCampaign)
    .filter((campaign) => campaign.status !== "approved")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return { public: approved, mine };
}

async function moderateCampaign(slug, status) {
  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "status must be approved or rejected");
  }

  const db = getSupabase();
  const { data, error } = await db
    .from("campaigns")
    .update({ status })
    .eq("slug", slug)
    .select("*")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "Campaign not found");
  }

  return mapCampaign(data);
}

async function getCampaignBySlug(slug) {
  const db = getSupabase();
  const { data, error } = await db
    .from("campaigns")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapCampaign(data);
}

async function createCampaign(input) {
  const title = String(input.title || "").trim();
  const story = String(input.story || "").trim();
  const goal = Number(input.goal_hkd);
  const endDate = String(input.end_date || "").trim();
  const cover = String(input.cover_image_url || input.cover || "").trim();

  if (title.length < 4) {
    throw new ApiError(400, "Title must be at least 4 characters");
  }
  if (story.length < 20) {
    throw new ApiError(400, "Story must be at least 20 characters");
  }
  if (!Number.isInteger(goal) || goal < 500) {
    throw new ApiError(400, "goal_hkd must be at least 500");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new ApiError(400, "end_date must be YYYY-MM-DD");
  }
  if (!cover) {
    throw new ApiError(400, "cover_image_url is required");
  }

  const db = getSupabase();
  let slug = slugify(title);
  const { data: clash } = await db
    .from("campaigns")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (clash) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }

  const { data, error } = await db
    .from("campaigns")
    .insert({
      slug,
      title,
      story,
      goal_hkd: goal,
      cover_image_url: cover,
      end_date: endDate,
      status: "pending_approval",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapCampaign(data);
}

module.exports = {
  listCampaigns,
  listCampaignsForGive,
  getCampaignBySlug,
  createCampaign,
  moderateCampaign,
};
