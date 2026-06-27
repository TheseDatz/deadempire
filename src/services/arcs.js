import { normalizeContentBlocks, normalizeStringList } from './contentBlocks'
import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const ARC_COLUMNS = 'id, slug, arc_date, title, tags, body, content_blocks, updated_at'

function rowToArc(row) {
  const contentBlocks = normalizeContentBlocks(row.content_blocks)

  return {
    id: row.id,
    slug: row.slug || '',
    date: row.arc_date || '',
    title: row.title || '',
    tags: normalizeStringList(row.tags),
    body: normalizeStringList(row.body),
    contentBlocks,
    updatedAt: row.updated_at,
  }
}

export function normalizeArcPayload(payload) {
  const contentBlocks = normalizeContentBlocks(payload.contentBlocks)
  const body = normalizeStringList(payload.body)
  const textBody = contentBlocks
    .filter((block) => block.type === 'text')
    .map((block) => block.content)

  return {
    slug: payload.slug.trim(),
    arc_date: payload.date,
    title: payload.title.trim(),
    tags: normalizeStringList(payload.tags),
    body: body.length ? body : textBody,
    content_blocks: contentBlocks,
  }
}

export async function loadArcs() {
  if (!supabase) {
    return { arcs: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('arcs')
    .select(ARC_COLUMNS)
    .eq('is_active', true)
    .order('arc_date', { ascending: false })

  return { arcs: data ? data.map(rowToArc) : [], error }
}

export async function createArc(payload) {
  if (!supabase) {
    return { arc: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeArcPayload(payload)
  const validationError = validateArcRow(row)

  if (validationError) {
    return { arc: null, error: validationError }
  }

  const { data, error } = await supabase.from('arcs').insert(row).select(ARC_COLUMNS).single()

  return { arc: data ? rowToArc(data) : null, error }
}

export async function updateArc(slug, payload) {
  if (!supabase) {
    return { arc: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeArcPayload(payload)
  const validationError = validateArcRow(row)

  if (!slug) {
    return { arc: null, error: new Error('Arc slug is required.') }
  }

  if (validationError) {
    return { arc: null, error: validationError }
  }

  const { data, error } = await supabase
    .from('arcs')
    .update(row)
    .eq('slug', slug)
    .select(ARC_COLUMNS)
    .single()

  return { arc: data ? rowToArc(data) : null, error }
}

export async function deleteArc(slug) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  if (!slug) {
    return { error: new Error('Arc slug is required.') }
  }

  const { error } = await supabase.from('arcs').delete().eq('slug', slug)
  return { error }
}

function validateArcRow(row) {
  if (!row.slug) {
    return new Error('Arc slug is required.')
  }

  if (!row.arc_date) {
    return new Error('Arc date is required.')
  }

  if (!row.title) {
    return new Error('Arc title is required.')
  }

  if (!row.content_blocks.length && !row.body.length) {
    return new Error('Add at least one text, image, GM note, or accordion block.')
  }

  return null
}
