const sessionsRepo = require("../../data/sessions.repo");
const { ApiError } = require("../../lib/api-error");
const { parsePaging, buildMeta } = require("../../lib/pagination");

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

async function cancelSession(id) {
  const row = await sessionsRepo.cancel(id);
  if (!row) throw ApiError.notFound(`No session with id "${id}"`);
  return row;
}

async function recordAttendance(id, body) {
  const row = await sessionsRepo.recordAttendance(id, body);
  if (!row) throw ApiError.notFound(`No session with id "${id}"`);
  return row;
}

async function recordBulkAttendance(entries) {
  const results = await Promise.all(
    entries.map((e) => sessionsRepo.recordAttendance(e.session_id, e)),
  );
  return { updated: results.filter(Boolean).length };
}

async function deleteSession(id) {
  await sessionsRepo.remove(id);
}

module.exports = {
  listSessions, getSession, createSession, updateSession,
  cancelSession, recordAttendance, recordBulkAttendance, deleteSession,
};
