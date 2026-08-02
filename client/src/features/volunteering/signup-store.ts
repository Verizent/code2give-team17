import type {
  VolunteerAgeGroup,
  VolunteerOpportunity,
} from '@/features/volunteering/fixtures'

export type VolunteerSignupStatus =
  | 'applied'
  | 'confirmed'
  | 'attended'
  | 'cancelled'
  | 'no_show'

export type VolunteerSignup = {
  id: string
  opportunity_id: string
  name: string
  email: string
  phone?: string
  age_group: VolunteerAgeGroup
  emergency_name?: string
  emergency_phone?: string
  status: VolunteerSignupStatus
  created_at: string
  experience_rating?: number | null
  would_return?: boolean | null
  improvement_note?: string | null
  feedback_submitted_at?: string | null
}

const SIGNUPS_KEY = 'love21-volunteer-signups'
const CLAIMS_KEY = 'love21-volunteer-claims'

type Claims = Record<string, number>

function readSignups(): VolunteerSignup[] {
  try {
    const raw = localStorage.getItem(SIGNUPS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VolunteerSignup[]
  } catch {
    return []
  }
}

function writeSignups(list: VolunteerSignup[]) {
  localStorage.setItem(SIGNUPS_KEY, JSON.stringify(list))
}

/** Server-issued ids are UUIDs; locally minted ones are `vs_…`. */
function isServerIssued(signupId: string) {
  return !signupId.startsWith('vs_')
}

let claimsRepaired = false

/**
 * Claims written before countedByServer existed double-counted every server signup, and
 * nothing ever cleared them — the miscount outlived the signup and even the opportunity.
 * Rebuild once per session from the signups we hold, counting only the ones the server
 * does not know about. Self-healing, so no migration flag to carry around.
 */
function repairClaims(stored: Claims): Claims {
  const rebuilt: Claims = {}
  for (const signup of readSignups()) {
    if (isServerIssued(signup.id)) continue
    rebuilt[signup.opportunity_id] = (rebuilt[signup.opportunity_id] ?? 0) + 1
  }

  const changed =
    Object.keys(rebuilt).length !== Object.keys(stored).length ||
    Object.entries(rebuilt).some(([id, n]) => stored[id] !== n)

  if (changed) writeClaims(rebuilt)
  return rebuilt
}

function readClaims(): Claims {
  try {
    const raw = localStorage.getItem(CLAIMS_KEY)
    const stored = raw ? (JSON.parse(raw) as Claims) : {}
    if (claimsRepaired) return stored
    claimsRepaired = true
    return repairClaims(stored)
  } catch {
    return {}
  }
}

function writeClaims(claims: Claims) {
  localStorage.setItem(CLAIMS_KEY, JSON.stringify(claims))
}

function id() {
  return `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function getSignup(signupId: string): VolunteerSignup | undefined {
  return readSignups().find((s) => s.id === signupId)
}

export function listSignups(): VolunteerSignup[] {
  return readSignups()
}

export function applyLocalClaims(base: VolunteerOpportunity): VolunteerOpportunity {
  const claims = readClaims()
  const extra = claims[base.id] ?? 0
  const spots_filled = Math.min(base.capacity, base.spots_filled + extra)
  return {
    ...base,
    spots_filled,
    recruiting: spots_filled < base.capacity,
  }
}

export function resolveFromBase(
  baseList: VolunteerOpportunity[],
  opportunityId: string,
): VolunteerOpportunity | undefined {
  const base = baseList.find((o) => o.id === opportunityId)
  if (!base) return undefined
  return applyLocalClaims(base)
}

export function listResolvedFromBase(baseList: VolunteerOpportunity[]): VolunteerOpportunity[] {
  return baseList.map(applyLocalClaims)
}

export function isOpportunityFull(opportunity: VolunteerOpportunity) {
  return opportunity.spots_filled >= opportunity.capacity
}

export function createSignup(input: {
  opportunity_id: string
  name: string
  email: string
  phone?: string
  age_group: VolunteerSignup['age_group']
  emergency_name?: string
  emergency_phone?: string
  /** When mirroring a server signup, reuse its id and skip local capacity gate. */
  id?: string
  skipCapacityCheck?: boolean
  /**
   * True when the server already counted this signup. The API's `spots_filled` includes
   * every confirmed row, so also recording a local claim made the browser count the same
   * seat twice — a capacity-3 session read 2/3 after one signup, and capacity-1 sessions
   * flipped straight to Full. Claims are never cleared, so the miscount outlived the
   * signup itself.
   */
  countedByServer?: boolean
  /** Opportunity from the API cache — used for local capacity checks only. */
  knownOpportunity?: VolunteerOpportunity
}): { ok: true; signup: VolunteerSignup } | { ok: false; reason: 'full' | 'missing' } {
  if (!input.skipCapacityCheck) {
    if (!input.knownOpportunity) return { ok: false, reason: 'missing' }
    if (isOpportunityFull(input.knownOpportunity)) {
      return { ok: false, reason: 'full' }
    }
  }

  const signup: VolunteerSignup = {
    id: input.id ?? id(),
    opportunity_id: input.opportunity_id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || undefined,
    age_group: input.age_group,
    emergency_name: input.emergency_name?.trim() || undefined,
    emergency_phone: input.emergency_phone?.trim() || undefined,
    status: 'confirmed',
    created_at: new Date().toISOString(),
  }

  const signups = readSignups()
  signups.unshift(signup)
  writeSignups(signups)

  // Only claim a seat the server does not already know about. See countedByServer.
  if (!input.countedByServer) {
    const claims = readClaims()
    claims[input.opportunity_id] = (claims[input.opportunity_id] ?? 0) + 1
    writeClaims(claims)
  }

  return { ok: true, signup }
}
