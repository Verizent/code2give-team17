const WORDS_PER_MINUTE = 200;
const TEXT_BLOCK_TYPES = new Set(["paragraph", "heading", "quote"]);

/**
 * Estimates reading time from a block-array body.
 *
 * Returns at least 1 so an article never advertises "0 min read". Non-text blocks
 * (image, stat, mythFact, embed) carry no prose and are not counted.
 *
 * @param {Array<{ type: string, text?: string }>} blocks
 * @returns {number} whole minutes, minimum 1
 */
function readingTime(blocks) {
  if (!Array.isArray(blocks)) {
    return 1;
  }

  const text = blocks
    .filter((block) => block && TEXT_BLOCK_TYPES.has(block.type))
    .map((block) => block.text ?? "")
    .join(" ")
    .trim();

  if (!text) {
    return 1;
  }

  return Math.max(1, Math.ceil(text.split(/\s+/).length / WORDS_PER_MINUTE));
}

module.exports = { readingTime };
