import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const PLANET_COLUMNS = 'id, name, region, color, status, moons, locations, notes, updated_at'

function normalizeDetailList(list) {
  if (!Array.isArray(list)) {
    return []
  }

  return list
    .map((item) => ({
      name: String(item?.name || '').trim(),
      description: String(item?.description || '').trim(),
    }))
    .filter((item) => item.name || item.description)
}

function rowToPlanet(row) {
  return {
    id: row.id,
    name: row.name || '',
    region: row.region || '',
    color: row.color || '#4fc3ff',
    status: row.status || '',
    moons: normalizeDetailList(row.moons),
    locations: normalizeDetailList(row.locations),
    notes: row.notes || '',
    updatedAt: row.updated_at,
  }
}

export function normalizePlanetPayload(payload) {
  return {
    name: payload.name.trim(),
    region: payload.region.trim(),
    color: payload.color.trim() || '#4fc3ff',
    status: payload.status.trim(),
    moons: normalizeDetailList(payload.moons),
    locations: normalizeDetailList(payload.locations),
    notes: payload.notes.trim(),
  }
}

export async function loadPlanets() {
  if (!supabase) {
    return { planets: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('planets')
    .select(PLANET_COLUMNS)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return { planets: data ? data.map(rowToPlanet) : [], error }
}

export async function createPlanet(payload) {
  if (!supabase) {
    return { planet: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizePlanetPayload(payload)

  if (!row.name) {
    return { planet: null, error: new Error('Planet name is required.') }
  }

  const { data, error } = await supabase
    .from('planets')
    .insert(row)
    .select(PLANET_COLUMNS)
    .single()

  return { planet: data ? rowToPlanet(data) : null, error }
}

export async function updatePlanet(id, payload) {
  if (!supabase) {
    return { planet: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizePlanetPayload(payload)

  if (!id) {
    return { planet: null, error: new Error('Planet id is required.') }
  }

  if (!row.name) {
    return { planet: null, error: new Error('Planet name is required.') }
  }

  const { data, error } = await supabase
    .from('planets')
    .update(row)
    .eq('id', id)
    .select(PLANET_COLUMNS)
    .single()

  return { planet: data ? rowToPlanet(data) : null, error }
}
