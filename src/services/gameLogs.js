import { isSupabaseConfigured, supabase } from './supabaseClient'
import { normalizeContentBlocks, normalizeStringList } from './contentBlocks'

export { isSupabaseConfigured }

const GAME_LOG_COLUMNS =
  'id, slug, session_date, title, participating_characters, body, content_blocks, updated_at'

function rowToGameLog(row) {
  const contentBlocks = normalizeContentBlocks(row.content_blocks)

  return {
    id: row.id,
    slug: row.slug || '',
    date: row.session_date || '',
    title: row.title || '',
    participatingCharacters: normalizeStringList(row.participating_characters),
    body: normalizeStringList(row.body),
    contentBlocks,
    updatedAt: row.updated_at,
  }
}

export function normalizeGameLogPayload(payload) {
  const contentBlocks = normalizeContentBlocks(payload.contentBlocks)
  const body = normalizeStringList(payload.body)
  const textBody = contentBlocks
    .filter((block) => block.type === 'text')
    .map((block) => block.content)

  return {
    slug: payload.slug.trim(),
    session_date: payload.date,
    title: payload.title.trim(),
    participating_characters: normalizeStringList(payload.participatingCharacters),
    body: body.length ? body : textBody,
    content_blocks: contentBlocks,
  }
}

export async function loadGameLogs() {
  if (!supabase) {
    return { logs: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('game_logs')
    .select(GAME_LOG_COLUMNS)
    .eq('is_active', true)
    .order('session_date', { ascending: false })

  return { logs: data ? data.map(rowToGameLog) : [], error }
}

export async function loadGameLog(slug) {
  if (!supabase) {
    return { log: null, error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('game_logs')
    .select(GAME_LOG_COLUMNS)
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  return { log: data ? rowToGameLog(data) : null, error }
}

export async function createGameLog(payload) {
  if (!supabase) {
    return { log: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeGameLogPayload(payload)

  if (!row.slug) {
    return { log: null, error: new Error('Log slug is required.') }
  }

  if (!row.session_date) {
    return { log: null, error: new Error('Log date is required.') }
  }

  if (!row.title) {
    return { log: null, error: new Error('Log title is required.') }
  }

  if (!row.content_blocks.length && !row.body.length) {
    return { log: null, error: new Error('Add at least one text or image block.') }
  }

  const { data, error } = await supabase
    .from('game_logs')
    .insert(row)
    .select(GAME_LOG_COLUMNS)
    .single()

  return { log: data ? rowToGameLog(data) : null, error }
}

export async function updateGameLog(slug, payload) {
  if (!supabase) {
    return { log: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeGameLogPayload(payload)

  if (!slug) {
    return { log: null, error: new Error('Log slug is required.') }
  }

  if (!row.slug) {
    return { log: null, error: new Error('Log slug is required.') }
  }

  if (!row.session_date) {
    return { log: null, error: new Error('Log date is required.') }
  }

  if (!row.title) {
    return { log: null, error: new Error('Log title is required.') }
  }

  if (!row.content_blocks.length && !row.body.length) {
    return { log: null, error: new Error('Add at least one text or image block.') }
  }

  const { data, error } = await supabase
    .from('game_logs')
    .update(row)
    .eq('slug', slug)
    .select(GAME_LOG_COLUMNS)
    .single()

  return { log: data ? rowToGameLog(data) : null, error }
}

export async function deleteGameLog(slug) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  if (!slug) {
    return { error: new Error('Log slug is required.') }
  }

  const { error } = await supabase.from('game_logs').delete().eq('slug', slug)
  return { error }
}
