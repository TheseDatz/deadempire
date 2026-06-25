import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const SHEET_COLUMNS = 'slug, category, sort_order, is_player_visible, sheet, updated_at'
export const MAX_PLAYER_CHARACTER_SHEETS = 2

const DEFAULT_ATTRIBUTES = [
  'Dexterity',
  'Knowledge',
  'Mechanical',
  'Perception',
  'Strength',
  'Technical',
]

function createBlankSheet(slug) {
  return {
    id: slug,
    name: '',
    playerName: '',
    tagline: '',
    type: '',
    species: '',
    homeworld: '',
    gender: '',
    age: '',
    height: '',
    weight: '',
    move: '10',
    characterPoints: '0',
    photo: '',
    appearance: '',
    personality: '',
    quote: '',
    languages: '',
    attributes: DEFAULT_ATTRIBUTES.map((name) => ({
      name,
      dice: '2D',
      skills: [],
    })),
    weapons: [],
    armor: [],
    equipment: [],
    advantages: [],
    health: 'Healthy',
    healthCounts: {
      stunned: 0,
      wounded: 0,
    },
    credits: '0',
    newRepublicCredits: '0',
    peggats: '0',
    requisitionTokens: '0',
    specialAbilities: [],
    force: {
      forceSensitive: 'No',
      forcePoints: '1',
      darkSidePoints: '0',
      control: '-',
      sense: '-',
      alter: '-',
    },
    forcePowers: [],
    background: '',
  }
}

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
    _slug: row.slug,
    _category: row.category,
    _isPlayerVisible: Boolean(row.is_player_visible),
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

export async function saveCharacterSheet(sheet, slug, category = 'player') {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  const rowSlug = slug || slugFromSheet(sheet)
  const row = {
    slug: rowSlug,
    category,
    sheet: {
      ...sheet,
      id: sheet.id || rowSlug,
    },
  }
  const { data, error } = await supabase
    .from('character_sheets')
    .upsert(row, { onConflict: 'slug' })
    .select(SHEET_COLUMNS)
    .single()

  return { character: data ? rowToCharacter(data) : null, error }
}

export async function updateCharacterSheetPlayerVisibility(slug, isPlayerVisible) {
  if (!supabase) {
    return { character: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('character_sheets')
    .update({ is_player_visible: isPlayerVisible })
    .eq('slug', slug)
    .eq('category', 'npc')
    .select(SHEET_COLUMNS)
    .single()

  return { character: data ? rowToCharacter(data) : null, error }
}

export async function canManageCharacterSheet(slug) {
  if (!supabase) {
    return { canManage: false, error: new Error('Supabase is not configured.') }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return { canManage: false, error: sessionError }
  }

  if (!sessionData.session) {
    return { canManage: false, error: null }
  }

  const { data, error } = await supabase.rpc('can_manage_character_sheet', { sheet_slug: slug })
  return { canManage: Boolean(data), error }
}

export async function deleteCharacterSheet(slug) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  const { error } = await supabase.from('character_sheets').delete().eq('slug', slug)
  return { error }
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

export async function createCharacterSheet() {
  if (!supabase) {
    return { character: null, error: new Error('Supabase is not configured.') }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return { character: null, error: sessionError }
  }

  if (!sessionData.session) {
    return { character: null, error: new Error('Sign in before creating a character.') }
  }

  const { count, error: countError } = await getOwnedCharacterSheetCount()

  if (countError) {
    return { character: null, error: countError }
  }

  if (count >= MAX_PLAYER_CHARACTER_SHEETS) {
    return {
      character: null,
      error: new Error(`Each account can have up to ${MAX_PLAYER_CHARACTER_SHEETS} character sheets.`),
    }
  }

  const slug = crypto.randomUUID()
  const { data, error } = await supabase
    .from('character_sheets')
    .insert({
      slug,
      category: 'player',
      sheet: createBlankSheet(slug),
    })
    .select(SHEET_COLUMNS)
    .single()

  return { character: data ? rowToCharacter(data) : null, error }
}

export async function getOwnedCharacterSheetCount() {
  if (!supabase) {
    return { count: 0, error: new Error('Supabase is not configured.') }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return { count: 0, error: sessionError }
  }

  if (!sessionData.session) {
    return { count: 0, error: null }
  }

  const { data, error } = await supabase.rpc('owned_character_sheet_count')
  return { count: data ?? 0, error }
}
