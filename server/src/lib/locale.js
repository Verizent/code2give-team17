const DEFAULT_LOCALE = "en";
const TRANSLATED_LOCALE = "zh-Hant";

const isMissing = (value) => value === null || value === undefined || value === "";

/**
 * Collapses a row's `<field>_en` / `<field>_zh` pairs into single resolved fields.
 *
 * An empty or null translation falls back to English, which is the honest behaviour
 * where a translation genuinely does not exist yet — rendering a blank heading is not.
 * Returns a new object; the row is never mutated.
 *
 * @param {Record<string, unknown>} row
 * @param {string[]} fields e.g. ["title", "excerpt"]
 * @param {"en" | "zh-Hant"} locale
 * @returns {Record<string, unknown>}
 */
function resolveLocale(row, fields, locale = DEFAULT_LOCALE) {
  const localeKeys = new Set(fields.flatMap((field) => [`${field}_en`, `${field}_zh`]));

  const passthrough = Object.fromEntries(
    Object.entries(row).filter(([key]) => !localeKeys.has(key)),
  );

  const resolved = Object.fromEntries(
    fields.map((field) => {
      const english = row[`${field}_en`];
      const translated = row[`${field}_zh`];
      const preferred = locale === TRANSLATED_LOCALE ? translated : english;

      return [field, isMissing(preferred) ? english : preferred];
    }),
  );

  return { ...passthrough, ...resolved };
}

module.exports = { resolveLocale };
