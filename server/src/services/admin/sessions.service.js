const sessionsRepo = require("../../data/sessions.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");
// Module object, not destructured, so `mock.method` stubs are honoured in tests.
const sessionLifecycle = require("../donations/session-lifecycle.service");

async function listSessions(query = {}) {
  const paging = parsePaging(query);
  const { rows, total } = await sessionsRepo.listAll({ status: query.status, from: paging.from, to: paging.to });
  return { items: rows, meta: buildMeta(total, paging) };
}

async function getSession(id) {
  const row = await sessionsRepo.findById(id);
  if (!row) throw ApiError.notFound(`No session with id "${id}"`);
  return row;
}

async function createSession(body) {
  return sessionsRepo.create(body);
}

async function updateSession(id, body) {
  const row = await sessionsRepo.update(id, body);
  if (!row) throw ApiError.notFound(`No session with id "${id}"`);
  return row;
}

/**
 * Cancelling a session strands every gift riding on it, so those allocations are moved to
 * another eligible session — the donor gave to fund classes, and one not running is ours to
 * solve rather than theirs to absorb.
 *
 * Previously this touched only `sessions.status`. The allocations stayed `pending` for ever:
 * the donor's period could never close, and their tracking page counted a cancelled class
 * under "sessions on the way" while the card beside it read *Cancelled*.
 */
async function cancelSession(id) {
  const row = await sessionsRepo.cancel(id);
  if (!row) throw ApiError.notFound(`No session with id "${id}"`);
  const reallocation = await sessionLifecycle.onSessionCancelled(id);
  return { ...row, reallocation };
}

/**
 * Recording attendance flips the session to `completed`, which is also the moment the donors
 * who funded it should hear about it. `onSessionCompleted` moves their allocations to
 * `completed` and emails them.
 *
 * Before this, nothing anywhere advanced `donation_allocations.status` — attendance stopped at
 * the session row — so the 15th/EOM update filtered an always-empty set and donors were never
 * told anything.
 *
 * Deliberately awaited rather than fired and forgotten: the allocation write is the durable
 * half and a request that returns before it lands would report success for work that had not
 * happened. The service never throws, so a mail outage cannot fail an admin's save.
 */
async function recordAttendance(id, body) {
  const row = await sessionsRepo.recordAttendance(id, body);
  if (!row) throw ApiError.notFound(`No session with id "${id}"`);
  const donorUpdate = await sessionLifecycle.onSessionCompleted(id);
  return { ...row, donor_update: donorUpdate };
}

async function recordBulkAttendance(entries) {
  const results = await Promise.all(
    entries.map((e) => sessionsRepo.recordAttendance(e.session_id, e)),
  );

  // Sequential, not Promise.all: each call sends email and writes allocations, and running a
  // whole bulk import concurrently against one SMTP connection is how you get rate-limited
  // halfway through with no record of which donors were reached.
  const updates = [];
  for (const entry of entries) {
    updates.push(await sessionLifecycle.onSessionCompleted(entry.session_id));
  }

  return {
    updated: results.filter(Boolean).length,
    donors_notified: updates.reduce((sum, u) => sum + u.donors_notified, 0),
    allocations_completed: updates.reduce((sum, u) => sum + u.allocations_completed, 0),
  };
}

async function deleteSession(id) {
  await sessionsRepo.remove(id);
}

module.exports = {
  listSessions, getSession, createSession, updateSession,
  cancelSession, recordAttendance, recordBulkAttendance, deleteSession,
};
