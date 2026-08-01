const MAX_LENGTH = 80;
const FALLBACK = "article";

/**
 * Derives a URL slug from a title.
 *
 * A Traditional Chinese title transliterates to nothing here, so the fallback is what
 * stands between a zh-only article and a 500 on the unique index (plan §10).
 *
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
  const slug = String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, "");

  return slug || FALLBACK;
}

/**
 * Appends `-2`, `-3`, … until the slug is free.
 *
 * @param {string} base
 * @param {(candidate: string) => Promise<boolean>} exists
 * @returns {Promise<string>}
 */
async function uniqueSlug(base, exists) {
  if (!(await exists(base))) {
    return base;
  }

  let suffix = 2;
  while (await exists(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

module.exports = { slugify, uniqueSlug };
