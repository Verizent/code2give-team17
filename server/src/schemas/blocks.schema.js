const { z } = require("zod");

const nonEmpty = z.string().min(1);

const paragraph = z.object({
  type: z.literal("paragraph"),
  text: nonEmpty,
});

// h1 is the page title and h4+ is a depth no article template renders.
const heading = z.object({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: nonEmpty,
});

// `alt` is required here, and that is the entire point: an unlabelled image becomes
// impossible to save rather than something a checklist catches later (CONTEXT.md §21).
const image = z.object({
  type: z.literal("image"),
  url: nonEmpty,
  alt: nonEmpty,
  caption: z.string().optional(),
});

const quote = z.object({
  type: z.literal("quote"),
  text: nonEmpty,
  attribution: z.string().optional(),
  consentRef: z.string().optional(),
});

const stat = z.object({
  type: z.literal("stat"),
  value: nonEmpty,
  label: nonEmpty,
  sublabel: z.string().optional(),
});

const mythFact = z.object({
  type: z.literal("mythFact"),
  myth: nonEmpty,
  fact: nonEmpty,
});

const embed = z.object({
  type: z.literal("embed"),
  provider: z.literal("instagram"),
  postId: nonEmpty,
});

/**
 * The closed set of article body blocks.
 *
 * Nothing here carries raw HTML: `paragraph.text` is inline markdown rendered through
 * react-markdown with HTML disabled, so `dangerouslySetInnerHTML` never appears. This
 * union is the boundary that keeps it that way.
 */
const blockSchema = z.discriminatedUnion("type", [
  paragraph,
  heading,
  image,
  quote,
  stat,
  mythFact,
  embed,
]);

const bodySchema = z.array(blockSchema);

module.exports = { blockSchema, bodySchema };
