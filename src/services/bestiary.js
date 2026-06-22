import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const BESTIARY_COLUMNS = 'id, role, name, move, description, attributes, skills, gear, updated_at'

function normalizeList(list) {
  if (!Array.isArray(list)) {
    return []
  }

  return list.map((item) => String(item).trim()).filter(Boolean)
}

function rowToNpc(row) {
  return {
    id: row.id,
    role: row.role || '',
    name: row.name || '',
    move: row.move || '',
    description: row.description || '',
    attributes: row.attributes || '',
    skills: normalizeList(row.skills),
    gear: normalizeList(row.gear),
    updatedAt: row.updated_at,
  }
}

export function normalizeNpcPayload(payload) {
  return {
    role: payload.role.trim(),
    name: payload.name.trim(),
    move: payload.move.trim(),
    description: payload.description.trim(),
    attributes: payload.attributes.trim(),
    skills: normalizeList(payload.skills),
    gear: normalizeList(payload.gear),
  }
}

export async function loadBestiaryNpcs() {
  if (!supabase) {
    return { npcs: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('bestiary_npcs')
    .select(BESTIARY_COLUMNS)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return { npcs: data ? data.map(rowToNpc) : [], error }
}

export async function createBestiaryNpc(payload) {
  if (!supabase) {
    return { npc: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeNpcPayload(payload)

  if (!row.role || !row.name) {
    return { npc: null, error: new Error('Role and name are required.') }
  }

  const { data, error } = await supabase
    .from('bestiary_npcs')
    .insert(row)
    .select(BESTIARY_COLUMNS)
    .single()

  return { npc: data ? rowToNpc(data) : null, error }
}
