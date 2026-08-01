const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isMissingTable } = require("../../src/lib/missing-table");

test("permission denied is not treated as missing table", () => {
  assert.equal(
    isMissingTable(
      { message: "Database query failed: permission denied for table session_proofs" },
      "session_proofs",
    ),
    false,
  );
});

test("relation does not exist is missing", () => {
  assert.equal(
    isMissingTable(
      { message: 'relation "session_proofs" does not exist' },
      "session_proofs",
    ),
    true,
  );
});

test("PostgREST schema cache miss is missing", () => {
  assert.equal(
    isMissingTable(
      {
        message:
          "Could not find the table 'public.session_proofs' in the schema cache",
      },
      "session_proofs",
    ),
    true,
  );
});

test("unrelated error is not missing", () => {
  assert.equal(
    isMissingTable({ message: "Database query failed: JWT expired" }, "session_proofs"),
    false,
  );
});
