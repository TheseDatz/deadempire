import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

const MAP_DATA_COLUMNS = 'id, type, data, sort_order, updated_at'
const MAP_DATA_TYPES = ['label', 'border', 'planet', 'ship']

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

function normalizePlanetData(planet) {
  return {
    name: String(planet?.name || '').trim() || 'New Planet',
    x: Number(planet?.x) || 0,
    y: Number(planet?.y) || 0,
    color: String(planet?.color || '#4fc3ff').trim() || '#4fc3ff',
    radius: Number(planet?.radius) || 24,
    labelSize: Number(planet?.labelSize) || 24,
    labelColor: String(planet?.labelColor || '#f8fdff').trim() || '#f8fdff',
    opacity: Number(planet?.opacity ?? 1),
  }
}

function normalizeShipData(ship) {
  return {
    name: String(ship?.name || '').trim() || 'Party Ship',
    x: Number(ship?.x) || 0,
    y: Number(ship?.y) || 0,
    color: String(ship?.color || '#ffef9a').trim() || '#ffef9a',
    size: Number(ship?.size) || 34,
    labelSize: Number(ship?.labelSize) || 22,
    labelColor: String(ship?.labelColor || '#f8fdff').trim() || '#f8fdff',
    rotation: Number(ship?.rotation) || 0,
    opacity: Number(ship?.opacity ?? 1),
  }
}

function mapItemToOverlay(item) {
  if (item.type === 'label') {
    return { id: item.id, type: item.type, ...normalizeLabelData(item.data) }
  }

  if (item.type === 'border') {
    return { id: item.id, type: item.type, ...normalizeBorderData(item.data) }
  }

  if (item.type === 'planet') {
    return { id: item.id, type: item.type, ...normalizePlanetData(item.data) }
  }

  if (item.type === 'ship') {
    return { id: item.id, type: item.type, ...normalizeShipData(item.data) }
  }

  return null
}

function overlayToRow(overlay, type, sortOrder) {
  const normalizeData = {
    label: normalizeLabelData,
    border: normalizeBorderData,
    planet: normalizePlanetData,
    ship: normalizeShipData,
  }[type]

  return {
    id: overlay.id,
    type,
    data: normalizeData(overlay),
    sort_order: sortOrder,
    is_active: true,
  }
}

export async function loadMapData() {
  if (!supabase) {
    return { labels: [], borders: [], planets: [], ships: [], error: new Error('Supabase is not configured.') }
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
    labels: overlays.filter((item) => item.type === 'label').map(({ type, ...item }) => item),
    borders: overlays.filter((item) => item.type === 'border').map(({ type, ...item }) => item),
    planets: overlays.filter((item) => item.type === 'planet').map(({ type, ...item }) => item),
    ships: overlays.filter((item) => item.type === 'ship').map(({ type, ...item }) => item),
    error,
  }
}

export async function saveMapData(labels, borders, planets = [], ships = []) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  const rows = [
    ...labels.map((label, index) => overlayToRow(label, 'label', index)),
    ...borders.map((border, index) => overlayToRow(border, 'border', labels.length + index)),
    ...planets.map((planet, index) => overlayToRow(planet, 'planet', labels.length + borders.length + index)),
    ...ships.map((ship, index) => overlayToRow(ship, 'ship', labels.length + borders.length + planets.length + index)),
  ]

  const { error } = await supabase.rpc('save_map_data', { map_rows: rows })
  return { error }
}
