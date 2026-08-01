const { getSupabase } = require("../config/supabase");
const { ApiError } = require("../lib/api-error");
const { toLocalized } = require("../lib/localized");
const { normalizeEmail } = require("../lib/normalize");
const { upsertDonor } = require("./donors.service");

function mapWishlistItem(row) {
  return {
    id: row.id,
    title: toLocalized(row, "title"),
    why: toLocalized(row, "why"),
    needed: row.needed,
    pledged: row.pledged,
    image: row.image_url,
  };
}

function mapRpcError(error) {
  const message = error.message || "";
  if (message.includes("NOT_FOUND:")) {
    return new ApiError(404, "Wishlist item not found");
  }
  if (message.includes("CONFLICT:")) {
    return new ApiError(409, "This item is already fully pledged");
  }
  if (message.includes("VALIDATION_FAILED:")) {
    const detail = message.split("VALIDATION_FAILED:")[1]?.trim() || "Invalid pledge";
    return new ApiError(400, detail);
  }
  return error;
}

async function listWishlistItems() {
  const db = getSupabase();
  const { data, error } = await db
    .from("wishlist_items")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapWishlistItem);
}

async function getWishlistItem(id) {
  const db = getSupabase();
  const { data, error } = await db
    .from("wishlist_items")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapWishlistItem(data);
}

async function createPledge(itemId, input) {
  const name = String(input.name || "").trim();
  const email = normalizeEmail(input.email);
  const quantity = Number(input.quantity);

  if (!name) {
    throw new ApiError(400, "Name is required");
  }
  if (!email || !email.includes("@")) {
    throw new ApiError(400, "A valid email is required");
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(400, "quantity must be a positive integer");
  }

  const donor = await upsertDonor({
    email,
    fullName: name,
    trackingOptIn: false,
  });

  const db = getSupabase();
  const { data, error } = await db.rpc("pledge_wishlist_item", {
    p_item_id: itemId,
    p_donor_id: donor.id,
    p_quantity: quantity,
  });

  if (error) {
    throw mapRpcError(error);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new ApiError(500, "Pledge could not be recorded");
  }

  const item = await getWishlistItem(itemId);
  if (!item) {
    throw new ApiError(404, "Wishlist item not found");
  }

  return {
    pledge: {
      id: row.pledge_id,
      wishlist_item_id: row.pledge_wishlist_item_id,
      donor_id: row.pledge_donor_id,
      quantity: row.pledge_quantity,
      created_at: row.pledge_created_at,
    },
    item: {
      ...item,
      pledged: row.new_pledged,
    },
  };
}

module.exports = {
  listWishlistItems,
  getWishlistItem,
  createPledge,
};
