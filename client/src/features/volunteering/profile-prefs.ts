import {
  normaliseAgeGroup,
  VOLUNTEER_SKILLS,
  type VolunteerAgeGroup,
  type VolunteerSkill,
} from '@/features/volunteering/fixtures'

const KEY = 'love21-volunteer-prefs'

export type { VolunteerAgeGroup }

export type VolunteerGender = 'female' | 'male' | 'prefer_not'
export type VolunteerRole = 'assistant' | 'host' | 'event' | 'other'
export type VolunteerDiscovery = 'existing' | 'social' | 'edm' | 'company' | 'other'

export const VOLUNTEER_GENDERS: VolunteerGender[] = ['female', 'male', 'prefer_not']
export const VOLUNTEER_ROLES: VolunteerRole[] = ['assistant', 'host', 'event', 'other']
export const VOLUNTEER_DISCOVERY: VolunteerDiscovery[] = [
  'existing',
  'social',
  'edm',
  'company',
  'other',
]

export type VolunteerPrefs = {
  skills: VolunteerSkill[]
  age_group?: VolunteerAgeGroup
  phone?: string
  full_name?: string
  chinese_name?: string
  gender?: VolunteerGender
  roles?: VolunteerRole[]
  role_other?: string
  about?: string
  discovery?: VolunteerDiscovery
  discovery_other?: string
  updated_at: string
}

type PrefsMap = Record<string, VolunteerPrefs>

const GENDERS = new Set<string>(VOLUNTEER_GENDERS)
const ROLES = new Set<string>(VOLUNTEER_ROLES)
const DISCOVERY = new Set<string>(VOLUNTEER_DISCOVERY)

function readMap(): PrefsMap {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PrefsMap
  } catch {
    return {}
  }
}

function writeMap(map: PrefsMap) {
  localStorage.setItem(KEY, JSON.stringify(map))
}

function normaliseEmail(email: string) {
  return email.trim().toLowerCase()
}

function sanitizeSkills(skills: unknown): VolunteerSkill[] {
  if (!Array.isArray(skills)) return []
  const allowed = new Set<string>(VOLUNTEER_SKILLS)
  const out: VolunteerSkill[] = []
  for (const item of skills) {
    if (typeof item === 'string' && allowed.has(item) && !out.includes(item as VolunteerSkill)) {
      out.push(item as VolunteerSkill)
    }
  }
  return out
}

function sanitizeRoles(roles: unknown): VolunteerRole[] {
  if (!Array.isArray(roles)) return []
  const out: VolunteerRole[] = []
  for (const item of roles) {
    if (typeof item === 'string' && ROLES.has(item) && !out.includes(item as VolunteerRole)) {
      out.push(item as VolunteerRole)
    }
  }
  return out
}

function sanitizeGender(value: unknown): VolunteerGender | undefined {
  return typeof value === 'string' && GENDERS.has(value)
    ? (value as VolunteerGender)
    : undefined
}

function sanitizeDiscovery(value: unknown): VolunteerDiscovery | undefined {
  return typeof value === 'string' && DISCOVERY.has(value)
    ? (value as VolunteerDiscovery)
    : undefined
}

function emptyPrefs(): VolunteerPrefs {
  return { skills: [], updated_at: new Date().toISOString() }
}

/** Full prefs for a volunteer account (local until a server column exists). */
export function getVolunteerPrefs(email: string | null | undefined): VolunteerPrefs {
  if (!email) return emptyPrefs()
  const entry = readMap()[normaliseEmail(email)]
  if (!entry) return emptyPrefs()
  return {
    skills: sanitizeSkills(entry.skills),
    age_group: normaliseAgeGroup(entry.age_group),
    phone: typeof entry.phone === 'string' ? entry.phone : undefined,
    full_name: typeof entry.full_name === 'string' ? entry.full_name : undefined,
    chinese_name: typeof entry.chinese_name === 'string' ? entry.chinese_name : undefined,
    gender: sanitizeGender(entry.gender),
    roles: sanitizeRoles(entry.roles),
    role_other: typeof entry.role_other === 'string' ? entry.role_other : undefined,
    about: typeof entry.about === 'string' ? entry.about : undefined,
    discovery: sanitizeDiscovery(entry.discovery),
    discovery_other:
      typeof entry.discovery_other === 'string' ? entry.discovery_other : undefined,
    updated_at: entry.updated_at ?? new Date().toISOString(),
  }
}

export function saveVolunteerPrefs(
  email: string,
  patch: Partial<Omit<VolunteerPrefs, 'updated_at'>>,
): VolunteerPrefs {
  const key = normaliseEmail(email)
  const map = readMap()
  const prev = getVolunteerPrefs(key)
  const next: VolunteerPrefs = {
    skills: patch.skills !== undefined ? sanitizeSkills(patch.skills) : prev.skills,
    age_group:
      patch.age_group !== undefined
        ? normaliseAgeGroup(patch.age_group)
        : prev.age_group,
    phone: patch.phone !== undefined ? patch.phone.trim() || undefined : prev.phone,
    full_name:
      patch.full_name !== undefined
        ? patch.full_name.trim() || undefined
        : prev.full_name,
    chinese_name:
      patch.chinese_name !== undefined
        ? patch.chinese_name.trim() || undefined
        : prev.chinese_name,
    gender: patch.gender !== undefined ? sanitizeGender(patch.gender) : prev.gender,
    roles: patch.roles !== undefined ? sanitizeRoles(patch.roles) : prev.roles,
    role_other:
      patch.role_other !== undefined
        ? patch.role_other.trim() || undefined
        : prev.role_other,
    about: patch.about !== undefined ? patch.about.trim() || undefined : prev.about,
    discovery:
      patch.discovery !== undefined ? sanitizeDiscovery(patch.discovery) : prev.discovery,
    discovery_other:
      patch.discovery_other !== undefined
        ? patch.discovery_other.trim() || undefined
        : prev.discovery_other,
    updated_at: new Date().toISOString(),
  }
  map[key] = next
  writeMap(map)
  return next
}

/** True when signup collected the core demographic / interest fields. */
export function isVolunteerProfileComplete(
  email: string | null | undefined,
): boolean {
  const p = getVolunteerPrefs(email)
  if (!p.full_name?.trim()) return false
  if (!p.age_group) return false
  if (!p.gender) return false
  if (!p.phone?.trim()) return false
  if (!p.roles?.length) return false
  if (!p.discovery) return false
  if (p.roles.includes('other') && !p.role_other?.trim()) return false
  if (p.discovery === 'other' && !p.discovery_other?.trim()) return false
  return true
}

/** Permanent skills for a volunteer account. */
export function getProfileSkills(email: string | null | undefined): VolunteerSkill[] {
  return getVolunteerPrefs(email).skills
}

export function saveProfileSkills(
  email: string,
  skills: VolunteerSkill[],
): VolunteerPrefs {
  return saveVolunteerPrefs(email, { skills })
}
