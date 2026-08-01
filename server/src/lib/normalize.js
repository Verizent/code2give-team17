function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function slugify(title) {
  const base = String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || `campaign-${Date.now().toString(36)}`;
}

module.exports = { normalizeEmail, slugify };
