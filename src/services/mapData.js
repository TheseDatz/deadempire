import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const MAP_DATA_COLUMNS = 'id, type, data, sort_order, updated_at'
const MAP_DATA_TYPES = ['label', 'border']

function normalizePoint(point) {
  return {
    x: Number(point?.x) || 0,
    y: Number(point?.y) || 0,
  }
}

function rowToMapItem(row) {
  return {
    id: row.id,
    type: row.type,
    data: row.data || {},
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at,
  }
}

function normalizeLabelData(label) {
  return {
    text: String(label?.text || '').trim() || 'New Label',
    x: Number(label?.x) || 0,
    y: Number(label?.y) || 0,
    color: String(label?.color || '#f8fdff').trim() || '#f8fdff',
    size: Number(label?.size) || 30,
    opacity: Number(label?.opacity ?? 1),
  }
}

function normalizeBorderData(border) {
  const points = Array.isArray(border?.points) ? border.points.map(normalizePoint) : []

  return {
    name: String(border?.name || '').trim() || 'New Border',
    color: String(border?.color || '#ffcc66').trim() || '#ffcc66',
    width: Number(border?.width) || 10,
    nodeSize: Number(border?.nodeSize) || 18,
    points,
  }
}

function mapItemToOverlay(item) {
  if (item.type === 'label') {
    return { id: item.id, ...normalizeLabelData(item.data) }
  }

  if (item.type === 'border') {
    return { id: item.id, ...normalizeBorderData(item.data) }
  }

  return null
}

function overlayToRow(overlay, type, sortOrder) {
  return {
    id: overlay.id,
    type,
    data: type === 'label' ? normalizeLabelData(overlay) : normalizeBorderData(overlay),
    sort_order: sortOrder,
    is_active: true,
  }
}

export async function loadMapData() {
  if (!supabase) {
    return { labels: [], borders: [], error: new Error('Supabase is not configured.') }
  }

  const { data, error } = await supabase
    .from('map_data')
    .select(MAP_DATA_COLUMNS)
    .eq('is_active', true)
    .in('type', MAP_DATA_TYPES)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true })

  const mapItems = data ? data.map(rowToMapItem) : []
  const overlays = mapItems.map(mapItemToOverlay).filter(Boolean)

  return {
    labels: overlays.filter((item) => mapItems.find((row) => row.id === item.id)?.type === 'label'),
    borders: overlays.filter((item) => mapItems.find((row) => row.id === item.id)?.type === 'border'),
    error,
  }
}

export async function saveMapData(labels, borders) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  const rows = [
    ...labels.map((label, index) => overlayToRow(label, 'label', index)),
    ...borders.map((border, index) => overlayToRow(border, 'border', labels.length + index)),
  ]

  const ids = rows.map((row) => row.id)

  if (rows.length > 0) {
    const { error } = await supabase.from('map_data').upsert(rows, { onConflict: 'id' })

    if (error) {
      return { error }
    }
  }

  let inactiveQuery = supabase.from('map_data').update({ is_active: false }).eq('is_active', true)

  if (ids.length > 0) {
    inactiveQuery = inactiveQuery.not('id', 'in', `(${ids.join(',')})`)
  }

  const { error } = await inactiveQuery

  return { error }
}
