const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

const COLUMNS =
  "id, url, caption_en, caption_zh, thumbnail_url, display_order, is_active, created_at, updated_at";

async function listAll({ from, to }) {
  const { data, error, count } = await getSupabase()
    .from("instagram_embeds")
    .select(COLUMNS, { count: "exact" })
    .order("display_order", { ascending: true })
    .range(from, to);
  assertOk(error);
  return { rows: data ?? [], total: count ?? 0 };
}

async function listActive() {
  const { data, error } = await getSupabase()
    .from("instagram_embeds")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  assertOk(error);
  return data ?? [];
}

async function create(data) {
  const { data: row, error } = await getSupabase()
    .from("instagram_embeds")
    .insert(data)
    .select(COLUMNS)
    .single();
  assertOk(error);
  return row;
}

async function update(id, data) {
  const { data: row, error } = await getSupabase()
    .from("instagram_embeds")
    .update(data)
    .eq("id", id)
    .select(COLUMNS)
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

async function remove(id) {
  const { data: row, error } = await getSupabase()
    .from("instagram_embeds")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  assertOk(error);
  return row ?? null;
}

module.exports = { listAll, listActive, create, update, remove };
