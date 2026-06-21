import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const SHEET_COLUMNS = 'slug, category, sort_order, sheet, updated_at'

function slugFromSheet(sheet) {
  const source = sheet.id || sheet.name || crypto.randomUUID()
  const slug = String(source)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

  return slug || crypto.randomUUID()
}

function rowToCharacter(row) {
  return {
    ...row.sheet,
    id: row.sheet?.id || row.slug,
    _category: row.category,
  }
}

function normalizeImportPayload(payload, fallbackCategory) {
  const entries = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.character_sheets)
      ? payload.character_sheets
      : [payload]

  return entries.map((entry, index) => {
    const sheet = entry.sheet ?? entry
    const slug = entry.slug || slugFromSheet(sheet)

    return {
      slug,
      category: entry.category || fallbackCategory,
      sort_order: Number.isInteger(entry.sort_order) ? entry.sort_order : index,
      sheet: {
        ...sheet,
        id: sheet.id || slug,
      },
    }
  })
}

async function loadCharacterSheets(category) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('character_sheets')
    .select(SHEET_COLUMNS)
    .eq('category', category)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true })

  if (error) {
    throw error
  }

  return data.map(rowToCharacter)
}

export async function loadPlayerCharacters() {
  return loadCharacterSheets('player')
}

export async function loadImportantNpcs() {
  return loadCharacterSheets('npc')
}

export async function loadAllCharacters() {
  const [playerCharacters, importantNpcs] = await Promise.all([
    loadPlayerCharacters(),
    loadImportantNpcs(),
  ])

  return {
    playerCharacters,
    importantNpcs,
    allCharacters: [...playerCharacters, ...importantNpcs],
  }
}

export async function saveCharacterSheet(sheet, category = 'player') {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  const [row] = normalizeImportPayload(sheet, category)
  const { data, error } = await supabase
    .from('character_sheets')
    .upsert(row, { onConflict: 'slug' })
    .select(SHEET_COLUMNS)
    .single()

  return { character: data ? rowToCharacter(data) : null, error }
}

export async function importCharacterSheets(payload, fallbackCategory = 'player') {
  if (!supabase) {
    return { count: 0, error: new Error('Supabase is not configured.') }
  }

  const rows = normalizeImportPayload(payload, fallbackCategory)
  const { error } = await supabase.from('character_sheets').upsert(rows, { onConflict: 'slug' })

  return { count: error ? 0 : rows.length, error }
}

export async function exportCharacterSheetBackup() {
  if (!supabase) {
    return { data: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('character_sheets')
    .select(SHEET_COLUMNS)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('slug', { ascending: true })

  return { data, error }
}
