import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const FACTION_COLUMNS =
  'id, name, border_color, capital_planet, hostility, current_leader, description, notes, updated_at'

function rowToFaction(row) {
  return {
    id: row.id,
    name: row.name || '',
    borderColor: row.border_color || '#4fc3ff',
    capitalPlanet: row.capital_planet || '',
    hostility: row.hostility || '',
    currentLeader: row.current_leader || '',
    description: row.description || '',
    notes: row.notes || '',
    updatedAt: row.updated_at,
  }
}

export function normalizeFactionPayload(payload) {
  return {
    name: payload.name.trim(),
    border_color: payload.borderColor.trim() || '#4fc3ff',
    capital_planet: payload.capitalPlanet.trim(),
    hostility: payload.hostility.trim(),
    current_leader: payload.currentLeader.trim(),
    description: payload.description.trim(),
    notes: payload.notes.trim(),
  }
}

export async function loadFactions() {
  if (!supabase) {
    return { factions: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('factions')
    .select(FACTION_COLUMNS)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return { factions: data ? data.map(rowToFaction) : [], error }
}

export async function createFaction(payload) {
  if (!supabase) {
    return { faction: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeFactionPayload(payload)

  if (!row.name) {
    return { faction: null, error: new Error('Faction name is required.') }
  }

  const { data, error } = await supabase
    .from('factions')
    .insert(row)
    .select(FACTION_COLUMNS)
    .single()

  return { faction: data ? rowToFaction(data) : null, error }
}

export async function updateFaction(id, payload) {
  if (!supabase) {
    return { faction: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeFactionPayload(payload)

  if (!id) {
    return { faction: null, error: new Error('Faction id is required.') }
  }

  if (!row.name) {
    return { faction: null, error: new Error('Faction name is required.') }
  }

  const { data, error } = await supabase
    .from('factions')
    .update(row)
    .eq('id', id)
    .select(FACTION_COLUMNS)
    .single()

  return { faction: data ? rowToFaction(data) : null, error }
}
