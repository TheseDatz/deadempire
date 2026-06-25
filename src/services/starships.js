import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const STARSHIP_COLUMNS = 'id, craft, scale, designation, data, updated_at'

function rowToStarship(row) {
  return {
    id: row.id,
    craft: row.craft || '',
    scale: row.scale || '',
    designation: row.designation || '',
    data: row.data || {},
    updatedAt: row.updated_at,
  }
}

function normalizeStarshipPayload(ship) {
  const {
    isSaving,
    saveMessage,
    saveErrorMessage,
    ...shipData
  } = ship

  return {
    craft: String(ship.craft || '').trim(),
    scale: String(ship.scale || '').trim(),
    designation: String(ship.designation || '').trim(),
    data: JSON.parse(JSON.stringify(shipData)),
  }
}

export async function createStarship(ship) {
  if (!supabase) {
    return { starship: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeStarshipPayload(ship)

  if (!row.craft || !row.designation) {
    return { starship: null, error: new Error('Craft and designation are required.') }
  }

  const { data, error } = await supabase
    .from('starships')
    .insert(row)
    .select(STARSHIP_COLUMNS)
    .single()

  return { starship: data ? rowToStarship(data) : null, error }
}

export async function loadStarships() {
  if (!supabase) {
    return { starships: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('starships')
    .select(STARSHIP_COLUMNS)
    .eq('is_active', true)
    .order('craft', { ascending: true })

  return { starships: data ? data.map(rowToStarship) : [], error }
}

export async function deleteStarship(id) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  if (!id) {
    return { error: new Error('Starship id is required.') }
  }

  const { error } = await supabase.from('starships').delete().eq('id', id)

  return { error }
}
