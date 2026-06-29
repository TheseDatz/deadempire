import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const BAZAAR_COLUMNS =
  'id, slug, name, category, stores, image_url, cost_min, cost_max, description, tagline, note, time, count, color, updated_at'

function normalizeStores(stores) {
  if (!Array.isArray(stores)) {
    return []
  }

  return stores.map((store) => String(store).trim()).filter(Boolean)
}

function rowToBazaarItem(row) {
  return {
    rowId: row.id,
    id: row.slug,
    slug: row.slug,
    name: row.name || '',
    category: row.category || '',
    stores: normalizeStores(row.stores),
    imageUrl: row.image_url || '',
    costRange: [Number(row.cost_min) || 0, Number(row.cost_max) || 0],
    description: row.description || '',
    tagline: row.tagline || '',
    note: row.note || '',
    time: row.time || '',
    count: Number(row.count) || 1,
    color: row.color || '#9be7ff',
    updatedAt: row.updated_at,
  }
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getPlaceholderText(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || '?'
}

function getPlaceholderImageUrl(name, color = '9be7ff') {
  const foreground = String(color || '9be7ff').replace('#', '') || '9be7ff'
  return `https://placehold.co/96x96/1a2933/${foreground}?text=${encodeURIComponent(getPlaceholderText(name))}`
}

export function normalizeBazaarItemPayload(payload) {
  const costMin = Number(payload.costMin ?? payload.costRange?.[0]) || 0
  const costMax = Number(payload.costMax ?? payload.costRange?.[1]) || costMin

  return {
    slug: slugify(payload.slug || payload.name),
    name: String(payload.name || '').trim(),
    category: String(payload.category || '').trim(),
    stores: normalizeStores(payload.stores),
    image_url: String(payload.imageUrl || '').trim() || getPlaceholderImageUrl(payload.name, payload.color),
    cost_min: Math.max(0, costMin),
    cost_max: Math.max(Math.max(0, costMin), costMax),
    description: String(payload.description || '').trim(),
    tagline: String(payload.tagline || '').trim(),
    note: String(payload.note || '').trim(),
    time: String(payload.time || '').trim(),
    count: Math.max(1, Number(payload.count) || 1),
    color: String(payload.color || '#9be7ff').trim() || '#9be7ff',
  }
}

export async function loadBazaarItems() {
  if (!supabase) {
    return { items: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('bazaar_items')
    .select(BAZAAR_COLUMNS)
    .eq('is_active', true)
    .order('name', { ascending: true })

  return { items: data ? data.map(rowToBazaarItem) : [], error }
}

export async function loadImperialTradeSelection() {
  if (!supabase) {
    return { slugs: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('bazaar_market_state')
    .select('selected_slugs')
    .eq('key', 'imperial-trade-network')
    .maybeSingle()

  return { slugs: normalizeStores(data?.selected_slugs), error }
}

export async function createBazaarItem(payload) {
  if (!supabase) {
    return { item: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeBazaarItemPayload(payload)

  if (!row.slug || !row.name || !row.category) {
    return { item: null, error: new Error('Slug, name, and category are required.') }
  }

  if (!row.stores.length) {
    return { item: null, error: new Error('Select at least one store.') }
  }

  const { data, error } = await supabase
    .from('bazaar_items')
    .insert(row)
    .select(BAZAAR_COLUMNS)
    .single()

  return { item: data ? rowToBazaarItem(data) : null, error }
}

export async function updateBazaarItem(slug, payload) {
  if (!supabase) {
    return { item: null, error: new Error('Supabase is not configured.') }
  }

  const row = normalizeBazaarItemPayload(payload)

  if (!slug) {
    return { item: null, error: new Error('Item slug is required.') }
  }

  if (!row.slug || !row.name || !row.category) {
    return { item: null, error: new Error('Slug, name, and category are required.') }
  }

  if (!row.stores.length) {
    return { item: null, error: new Error('Select at least one store.') }
  }

  const { data, error } = await supabase
    .from('bazaar_items')
    .update(row)
    .eq('slug', slug)
    .select(BAZAAR_COLUMNS)
    .single()

  return { item: data ? rowToBazaarItem(data) : null, error }
}

export async function updateImperialTradeSelection(slugs) {
  if (!supabase) {
    return { slugs: [], error: new Error('Supabase is not configured.') }
  }

  const selectedSlugs = normalizeStores(slugs)

  const { data, error } = await supabase
    .from('bazaar_market_state')
    .update({ selected_slugs: selectedSlugs })
    .eq('key', 'imperial-trade-network')
    .select('selected_slugs')
    .single()

  return { slugs: normalizeStores(data?.selected_slugs), error }
}
