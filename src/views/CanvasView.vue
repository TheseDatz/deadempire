<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ReferenceCharts from '../components/ReferenceCharts.vue'
import canvasAssets from '../data/canvasAssets.json'
import { loadPlayerCharacters } from '../data/characters'
import { combatInstructions } from '../data/combatInstructions'

const storageKey = 'sw6d-canvas-scene-v1'
const boardSize = { width: 3600, height: 2400 }

const defaultScene = {
  background: {
    type: 'color',
    value: '#050b13',
    imageUrl: '',
    imageMode: 'cover',
  },
  grid: {
    enabled: true,
    snap: true,
    size: 70,
    unitDistance: 1,
    unitLabel: 'sq',
    color: '#1d5f78',
    opacity: 0.46,
  },
  objects: [],
  combat: {
    enabled: false,
    turnNumber: 1,
    currentAction: 1,
    combatants: [],
  },
}

const viewportRef = ref(null)
const scene = ref(structuredClone(defaultScene))
const viewport = ref({ x: 0, y: 0, scale: 0.58 })
const activeTool = ref('select')
const selectedId = ref('')
const dragState = ref(null)
const ruler = ref(null)
const editingTextId = ref('')
const importExportValue = ref('')
const sceneFileInput = ref(null)
const sceneMessage = ref('')
const assetSearch = ref('')
const showCombatSidebar = ref(false)
const showAssetSidebar = ref(false)
const showInstructions = ref(false)
const playerImportMessage = ref('')

const selectedObject = computed(() => scene.value.objects.find((object) => object.id === selectedId.value))
const selectedTokenCombatant = computed(() => {
  if (selectedObject.value?.type !== 'token') {
    return null
  }

  return scene.value.combat.combatants.find((combatant) => combatant.id === selectedObject.value.combatantId)
})
const orderedObjects = computed(() => [...scene.value.objects].sort((a, b) => a.z - b.z))
const orderedCombatants = computed(() =>
  [...scene.value.combat.combatants]
    .filter((combatant) => !combatant.dead)
    .sort((a, b) => Number(a.turnOrder) - Number(b.turnOrder)),
)
const filteredCanvasAssets = computed(() => {
  const query = assetSearch.value.trim().toLowerCase()

  if (!query) {
    return canvasAssets
  }

  return canvasAssets.filter((asset) => asset.name.toLowerCase().includes(query))
})
const gridSize = computed(() => Math.max(16, Number(scene.value.grid.size) || 70))
const rulerDistance = computed(() => {
  if (!ruler.value?.end) {
    return ''
  }

  const dx = ruler.value.end.x - ruler.value.start.x
  const dy = ruler.value.end.y - ruler.value.start.y
  const squares = Math.hypot(dx, dy) / gridSize.value
  const distance = squares * (Number(scene.value.grid.unitDistance) || 1)

  return `${distance.toFixed(distance >= 10 ? 1 : 2)} ${scene.value.grid.unitLabel || 'sq'}`
})

const boardTransform = computed(() => ({
  transform: `translate(${viewport.value.x}px, ${viewport.value.y}px) scale(${viewport.value.scale})`,
}))

const boardBackground = computed(() => {
  if (scene.value.background.type === 'image' && scene.value.background.imageUrl) {
    return {
      backgroundColor: scene.value.background.value,
      backgroundImage: `url("${scene.value.background.imageUrl}")`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: scene.value.background.imageMode,
    }
  }

  return {
    backgroundColor: scene.value.background.value,
  }
})

const gridStyle = computed(() => ({
  display: scene.value.grid.enabled ? 'block' : 'none',
  backgroundImage: `linear-gradient(to right, ${hexToRgba(scene.value.grid.color, scene.value.grid.opacity)} 1px, transparent 1px), linear-gradient(to bottom, ${hexToRgba(scene.value.grid.color, scene.value.grid.opacity)} 1px, transparent 1px)`,
  backgroundSize: `${gridSize.value}px ${gridSize.value}px`,
}))

function objectTransform(object) {
  const rotation = object.type === 'image' || object.type === 'text' ? Number(object.rotation) || 0 : 0
  return `translate(-50%, -50%) rotate(${rotation}deg)`
}

function objectZIndex(object) {
  const layerOffset = object.type === 'token' ? 100000000 : 0
  const selectedOffset = selectedId.value === object.id ? 10000000 : 0
  return layerOffset + selectedOffset + (Number(object.z) || 0)
}

function hexToRgba(hex, opacity) {
  const normalized = String(hex || '#4fc3ff').replace('#', '')
  const value = normalized.length === 3 ? normalized.split('').map((char) => char + char).join('') : normalized
  const int = Number.parseInt(value, 16)
  const red = (int >> 16) & 255
  const green = (int >> 8) & 255
  const blue = int & 255

  return `rgba(${red}, ${green}, ${blue}, ${Number(opacity) || 0.22})`
}

function clampScale(value) {
  return Math.min(Math.max(value, 0.18), 2.5)
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value))
}

function worldPointFromEvent(event) {
  const bounds = viewportRef.value.getBoundingClientRect()

  return {
    x: (event.clientX - bounds.left - viewport.value.x) / viewport.value.scale,
    y: (event.clientY - bounds.top - viewport.value.y) / viewport.value.scale,
  }
}

function snapPoint(point) {
  if (!scene.value.grid.snap) {
    return point
  }

  return {
    x: Math.round(point.x / gridSize.value) * gridSize.value,
    y: Math.round(point.y / gridSize.value) * gridSize.value,
  }
}

function snapSize(value, minimum = 24) {
  const numericValue = Math.max(minimum, Math.round(Number(value) || minimum))
  if (!scene.value.grid.snap) {
    return numericValue
  }

  return Math.max(minimum, Math.round(numericValue / gridSize.value) * gridSize.value)
}

function dispatchCanvasAction(action) {
  if (action.type === 'scene.patch') {
    scene.value = {
      ...scene.value,
      ...action.patch,
    }
  }

  if (action.type === 'object.create') {
    scene.value.objects.push(action.object)
    selectedId.value = action.object.id
  }

  if (action.type === 'object.patch') {
    const object = scene.value.objects.find((item) => item.id === action.objectId)
    if (object) {
      Object.assign(object, action.patch)
    }
  }

  if (action.type === 'object.delete') {
    const object = scene.value.objects.find((item) => item.id === action.objectId)
    scene.value.objects = scene.value.objects.filter((item) => item.id !== action.objectId)
    if (object?.type === 'token' && object.combatantId) {
      scene.value.combat.combatants = scene.value.combat.combatants.filter((combatant) => combatant.id !== object.combatantId)
    }
    if (selectedId.value === action.objectId) {
      selectedId.value = ''
    }
  }

  if (action.type === 'combatant.create') {
    scene.value.combat.combatants.push(action.combatant)
  }

  if (action.type === 'combatant.patch') {
    const combatant = scene.value.combat.combatants.find((item) => item.id === action.combatantId)
    if (combatant) {
      Object.assign(combatant, action.patch)
    }
  }

  if (action.type === 'combatant.delete') {
    const token = scene.value.objects.find((object) => object.type === 'token' && object.combatantId === action.combatantId)
    scene.value.combat.combatants = scene.value.combat.combatants.filter((combatant) => combatant.id !== action.combatantId)
    if (token) {
      scene.value.objects = scene.value.objects.filter((object) => object.id !== token.id)
    }
    if (selectedId.value === token?.id) {
      selectedId.value = ''
    }
  }
}

function handleWheel(event) {
  const bounds = event.currentTarget.getBoundingClientRect()
  const pointX = event.clientX - bounds.left
  const pointY = event.clientY - bounds.top
  const nextScale = clampScale(viewport.value.scale * (event.deltaY < 0 ? 1.1 : 0.9))
  const ratio = nextScale / viewport.value.scale

  viewport.value = {
    x: pointX - (pointX - viewport.value.x) * ratio,
    y: pointY - (pointY - viewport.value.y) * ratio,
    scale: nextScale,
  }
}

function startBoardPointer(event) {
  if (event.button !== 0) {
    return
  }

  const point = worldPointFromEvent(event)
  selectedId.value = ''

  if (activeTool.value === 'ruler') {
    ruler.value = { start: snapPoint(point), end: snapPoint(point) }
    dragState.value = { type: 'ruler', pointerId: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
    return
  }

  dragState.value = {
    type: 'pan',
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: viewport.value.x,
    originY: viewport.value.y,
  }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function startObjectDrag(event, object) {
  if (activeTool.value === 'lock') {
    event.stopPropagation()
    toggleObjectLock(object)
    return
  }

  if (activeTool.value !== 'select' || editingTextId.value || object.locked) {
    return
  }

  event.stopPropagation()
  selectedId.value = object.id
  const point = worldPointFromEvent(event)

  dragState.value = {
    type: 'object',
    pointerId: event.pointerId,
    objectId: object.id,
    offsetX: point.x - object.x,
    offsetY: point.y - object.y,
  }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function startResize(event, object) {
  if (activeTool.value !== 'select' || editingTextId.value || object.locked) {
    return
  }

  event.stopPropagation()
  selectedId.value = object.id
  dragState.value = {
    type: 'resize',
    pointerId: event.pointerId,
    objectId: object.id,
  }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function startRotate(event, object) {
  if (activeTool.value !== 'select' || editingTextId.value || object.locked || !['image', 'text'].includes(object.type)) {
    return
  }

  event.stopPropagation()
  selectedId.value = object.id
  dragState.value = {
    type: 'rotate',
    pointerId: event.pointerId,
    objectId: object.id,
  }
  event.currentTarget.setPointerCapture(event.pointerId)
}

function handlePointerMove(event) {
  if (!dragState.value || dragState.value.pointerId !== event.pointerId) {
    return
  }

  if (dragState.value.type === 'pan') {
    viewport.value = {
      ...viewport.value,
      x: dragState.value.originX + event.clientX - dragState.value.startX,
      y: dragState.value.originY + event.clientY - dragState.value.startY,
    }
  }

  if (dragState.value.type === 'object') {
    const point = snapPoint(worldPointFromEvent(event))
    dispatchCanvasAction({
      type: 'object.patch',
      objectId: dragState.value.objectId,
      patch: {
        x: Math.round(point.x - dragState.value.offsetX),
        y: Math.round(point.y - dragState.value.offsetY),
      },
    })
  }

  if (dragState.value.type === 'ruler' && ruler.value) {
    ruler.value = {
      ...ruler.value,
      end: snapPoint(worldPointFromEvent(event)),
    }
  }

  if (dragState.value.type === 'resize') {
    const object = scene.value.objects.find((item) => item.id === dragState.value.objectId)
    if (!object) {
      return
    }

    const point = worldPointFromEvent(event)
    const width = snapSize(Math.abs(point.x - object.x) * 2, 40)
    const height = snapSize(Math.abs(point.y - object.y) * 2, 40)

    if (object.type === 'image') {
      dispatchCanvasAction({
        type: 'object.patch',
        objectId: object.id,
        patch: { width, height },
      })
    }

    if (object.type === 'token') {
      dispatchCanvasAction({
        type: 'object.patch',
        objectId: object.id,
        patch: { size: snapSize(Math.max(width, height), 24) },
      })
    }

    if (object.type === 'text') {
      dispatchCanvasAction({
        type: 'object.patch',
        objectId: object.id,
        patch: { size: Math.max(12, Math.round(height / 2)) },
      })
    }
  }

  if (dragState.value.type === 'rotate') {
    const object = scene.value.objects.find((item) => item.id === dragState.value.objectId)
    if (!object) {
      return
    }

    const point = worldPointFromEvent(event)
    const angle = Math.atan2(point.y - object.y, point.x - object.x) * (180 / Math.PI) + 90
    dispatchCanvasAction({
      type: 'object.patch',
      objectId: object.id,
      patch: { rotation: Math.round(angle) },
    })
  }
}

function endPointer(event) {
  if (dragState.value?.pointerId === event.pointerId) {
    dragState.value = null
  }
}

function addImageAsset() {
  const src = window.prompt('Image URL')
  if (!src) {
    return
  }

  createImageAssetFromUrl(src)
}

function createImageAssetFromUrl(src, overrides = {}) {
  dispatchCanvasAction({
    type: 'object.create',
    object: {
      id: createId('image'),
      type: 'image',
      src,
      x: 420,
      y: 360,
      width: 360,
      height: 240,
      rotation: 0,
      z: nextZ(),
      locked: false,
      ...overrides,
    },
  })
}

function addSavedImageAsset(asset) {
  createImageAssetFromUrl(asset.url, {
    width: Number(asset.width) || 360,
    height: Number(asset.height) || 240,
    z: nextZ(),
    name: asset.name,
    sourceAssetId: asset.id,
  })
}

function addToken() {
  const name = window.prompt('Token name', 'New Token') || 'New Token'
  const combatant = createCombatant(name)
  const token = createTokenObject(name, combatant.id, {
    x: 700,
    y: 520,
    z: nextZ(),
  })

  dispatchCanvasAction({ type: 'combatant.create', combatant })
  dispatchCanvasAction({ type: 'object.create', object: token })
  showCombatSidebar.value = true
}

function addText() {
  dispatchCanvasAction({
    type: 'object.create',
    object: {
      id: createId('text'),
      type: 'text',
      text: 'Text',
      x: 560,
      y: 720,
      color: '#f8fdff',
      size: 28,
      z: nextZ(),
    },
  })
}

function nextZ() {
  return scene.value.objects.reduce((highest, object) => Math.max(highest, object.z), 0) + 1
}

function createCombatant(name = 'New Combatant') {
  return {
    id: createId('combatant'),
    turnOrder: scene.value.combat.combatants.length + 1,
    name,
    strength: '2D',
    tempDifficulty: '',
    actions: 1,
    health: 'Healthy',
    relativePosition: '',
    knockedProne: false,
    isNpc: false,
    activeStuns: 0,
    damage: '',
    side: 'blue',
    color: '#4fc3ff',
    dead: false,
  }
}

function createTokenObject(name, combatantId, overrides = {}) {
  return {
    id: createId('token'),
    type: 'token',
    combatantId,
    name,
    imageSrc: '',
    color: '#ffcc66',
    x: 700,
    y: 520,
    size: gridSize.value,
    z: nextZ(),
    ...overrides,
  }
}

function getStrength(character) {
  return character.attributes?.find((attribute) => attribute.name === 'Strength')?.dice ?? '2D'
}

function characterSourceId(character) {
  return character.id || character._slug || character.name
}

function findPlayerToken(character) {
  const sourceId = characterSourceId(character)

  return scene.value.objects.find(
    (object) =>
      object.type === 'token' &&
      (object.sourceCharacterId === sourceId || (!object.sourceCharacterId && object.name === character.name)),
  )
}

function findPlayerCombatant(character, token) {
  const sourceId = characterSourceId(character)

  return scene.value.combat.combatants.find(
    (combatant) =>
      combatant.id === token?.combatantId ||
      combatant.sourceCharacterId === sourceId ||
      (!combatant.sourceCharacterId && combatant.name === character.name),
  )
}

function createPlayerCombatant(character, turnOrder) {
  return {
    ...createCombatant(character.name || 'Player Character'),
    id: createId('combatant'),
    source: 'player-character',
    sourceCharacterId: characterSourceId(character),
    turnOrder,
    name: character.name || 'Player Character',
    strength: getStrength(character),
    health: character.health || 'Healthy',
    side: 'blue',
    color: '#4fc3ff',
    dead: false,
  }
}

function createPlayerToken(character, combatantId, index) {
  const stackOffset = index * 18

  return createTokenObject(character.name || 'Player Character', combatantId, {
    source: 'player-character',
    sourceCharacterId: characterSourceId(character),
    imageSrc: character.photo || '',
    color: '#4fc3ff',
    x: boardSize.width / 2 + stackOffset,
    y: boardSize.height / 2 + stackOffset,
    size: gridSize.value,
    z: nextZ(),
  })
}

async function importPlayerCharactersToScene() {
  try {
    const playerCharacters = await loadPlayerCharacters()
    let importedCount = 0

    playerCharacters.forEach((character, index) => {
      const token = findPlayerToken(character)
      let combatant = findPlayerCombatant(character, token)

      if (!combatant) {
        combatant = createPlayerCombatant(character, scene.value.combat.combatants.length + 1)
        scene.value.combat.combatants.push(combatant)
      } else {
        combatant.source = 'player-character'
        combatant.sourceCharacterId = characterSourceId(character)
        combatant.name = character.name || combatant.name
        combatant.strength = getStrength(character)
        combatant.health = character.health || combatant.health
        combatant.color = combatant.color || '#4fc3ff'
      }

      if (token) {
        token.source = 'player-character'
        token.sourceCharacterId = characterSourceId(character)
        token.combatantId = combatant.id
        token.name = character.name || token.name
        token.imageSrc = character.photo || token.imageSrc || ''
        token.color = token.color || '#4fc3ff'
        combatant.color = token.color
        token.size = Number(token.size) || gridSize.value
        return
      }

      scene.value.objects.push(createPlayerToken(character, combatant.id, index))
      importedCount += 1
    })

    playerImportMessage.value = importedCount ? `Imported ${importedCount} player character tokens.` : ''
  } catch (error) {
    playerImportMessage.value = error.message
  }
}

function addCombatToken() {
  const combatant = createCombatant()
  const token = createTokenObject(combatant.name, combatant.id, {
    x: boardSize.width / 2,
    y: boardSize.height / 2,
    z: nextZ(),
  })

  dispatchCanvasAction({ type: 'combatant.create', combatant })
  dispatchCanvasAction({ type: 'object.create', object: token })
}

function deleteCombatant(combatantId) {
  dispatchCanvasAction({ type: 'combatant.delete', combatantId })
}

function selectCombatantToken(combatantId) {
  const token = scene.value.objects.find((object) => object.type === 'token' && object.combatantId === combatantId)
  if (token) {
    selectedId.value = token.id
    activeTool.value = 'select'
  }
}

function updateCombatantName(combatant) {
  const token = scene.value.objects.find((object) => object.type === 'token' && object.combatantId === combatant.id)
  if (token) {
    token.name = combatant.name
  }
}

function updateTokenName(token) {
  const combatant = scene.value.combat.combatants.find((item) => item.id === token.combatantId)
  if (combatant) {
    combatant.name = token.name
  }
}

function tokenForCombatant(combatantId) {
  return scene.value.objects.find((object) => object.type === 'token' && object.combatantId === combatantId)
}

function combatantColor(combatant) {
  return tokenForCombatant(combatant.id)?.color || combatant.color || '#4fc3ff'
}

function updateTokenColor(token) {
  const combatant = scene.value.combat.combatants.find((item) => item.id === token.combatantId)
  if (combatant) {
    combatant.color = token.color
    combatant.side = 'custom'
  }
}

function nextCombatant() {
  const sortedIds = orderedCombatants.value.map((combatant) => combatant.id)
  const firstId = sortedIds[0]
  if (!firstId) {
    return
  }

  const firstCombatant = scene.value.combat.combatants.find((combatant) => combatant.id === firstId)
  const remaining = orderedCombatants.value.filter((combatant) => combatant.id !== firstId)
  ;[...remaining, firstCombatant].filter(Boolean).forEach((combatant, index) => {
    combatant.turnOrder = index + 1
  })
}

function sortCombatants() {
  orderedCombatants.value.forEach((combatant, index) => {
    combatant.turnOrder = index + 1
  })
}

function resetCombatantsForNewTurn() {
  scene.value.combat.combatants.forEach((combatant) => {
    combatant.knockedProne = false
    combatant.tempDifficulty = ''
    combatant.actions = 1
  })
  sortCombatants()
}

function toggleObjectLock(object) {
  object.locked = !object.locked
  if (object.locked && selectedId.value === object.id) {
    selectedId.value = ''
  }
}

function deleteSelected() {
  if (selectedId.value) {
    dispatchCanvasAction({ type: 'object.delete', objectId: selectedId.value })
  }
}

function duplicateSelected() {
  const object = selectedObject.value
  if (!object) {
    return
  }

  const offset = scene.value.grid.snap ? gridSize.value : 40
  const copy = {
    ...clonePlain(object),
    id: createId(object.type),
    x: object.x + offset,
    y: object.y + offset,
    z: nextZ(),
  }

  if (object.type === 'token') {
    const sourceCombatant = scene.value.combat.combatants.find((combatant) => combatant.id === object.combatantId)
    const combatant = {
      ...createCombatant(`${object.name} Copy`),
      ...(sourceCombatant ? clonePlain(sourceCombatant) : {}),
      id: createId('combatant'),
      name: sourceCombatant?.name ? `${sourceCombatant.name} Copy` : `${object.name} Copy`,
      turnOrder: scene.value.combat.combatants.length + 1,
    }

    copy.combatantId = combatant.id
    copy.name = combatant.name
    dispatchCanvasAction({ type: 'combatant.create', combatant })
  }

  dispatchCanvasAction({ type: 'object.create', object: copy })
}

function nudgeZ(direction) {
  if (!selectedObject.value) {
    return
  }

  dispatchCanvasAction({
    type: 'object.patch',
    objectId: selectedObject.value.id,
    patch: { z: selectedObject.value.z + direction },
  })
}

function resetViewport() {
  centerViewport()
}

function centerViewport(scale = 0.58) {
  const bounds = viewportRef.value?.getBoundingClientRect()

  if (!bounds) {
    viewport.value = { x: 0, y: 0, scale }
    return
  }

  viewport.value = {
    x: Math.round((bounds.width - boardSize.width * scale) / 2),
    y: Math.round((bounds.height - boardSize.height * scale) / 2),
    scale,
  }
}

async function clearScene() {
  scene.value = structuredClone(defaultScene)
  selectedId.value = ''
  ruler.value = null
  await importPlayerCharactersToScene()
}

function prepareExport() {
  importExportValue.value = JSON.stringify(scene.value, null, 2)
  sceneMessage.value = 'Scene JSON ready.'
}

function exportSceneToFile() {
  const blob = new Blob([JSON.stringify(scene.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `sw6d-canvas-scene-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
  sceneMessage.value = 'Scene JSON downloaded.'
}

function openSceneFilePicker() {
  sceneFileInput.value?.click()
}

function importSceneFile(event) {
  const [file] = event.currentTarget.files || []
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    importExportValue.value = String(reader.result || '')
    importScene()
    event.currentTarget.value = ''
  }
  reader.onerror = () => {
    sceneMessage.value = 'Import failed: unable to read file.'
    event.currentTarget.value = ''
  }
  reader.readAsText(file)
}

async function importScene() {
  try {
    const parsed = JSON.parse(importExportValue.value)
    scene.value = normalizeScene(parsed)
    ensureTokenCombatants()
    await importPlayerCharactersToScene()
    selectedId.value = ''
    sceneMessage.value = 'Scene imported.'
  } catch (error) {
    sceneMessage.value = `Import failed: ${error.message}`
  }
}

function loadLocalScene() {
  const saved = window.localStorage.getItem(storageKey)
  if (!saved) {
    return
  }

  try {
    const parsed = JSON.parse(saved)
    scene.value = normalizeScene(parsed)
    ensureTokenCombatants()
  } catch {
    scene.value = structuredClone(defaultScene)
  }
}

function normalizeScene(value) {
  const normalized = {
    ...structuredClone(defaultScene),
    ...value,
    grid: { ...defaultScene.grid, ...(value.grid || {}) },
    background: { ...defaultScene.background, ...(value.background || {}) },
    combat: { ...defaultScene.combat, ...(value.combat || {}), combatants: Array.isArray(value.combat?.combatants) ? value.combat.combatants : [] },
    objects: Array.isArray(value.objects) ? value.objects : [],
  }

  if (normalized.grid.color === '#4fc3ff' && Number(normalized.grid.opacity) === 0.22) {
    normalized.grid.color = defaultScene.grid.color
    normalized.grid.opacity = defaultScene.grid.opacity
  }

  if (normalized.background.type === 'color' && normalized.background.value === '#101722') {
    normalized.background.value = defaultScene.background.value
  }

  return normalized
}

function ensureTokenCombatants() {
  scene.value.objects
    .filter((object) => object.type === 'token')
    .forEach((token) => {
      let combatant = scene.value.combat.combatants.find((item) => item.id === token.combatantId)
      if (!combatant) {
        combatant = createCombatant(token.name || 'New Token')
        token.combatantId = combatant.id
        scene.value.combat.combatants.push(combatant)
      }
    })
}

async function editTextObject(object) {
  editingTextId.value = object.id
  await nextTick()
  const editor = document.querySelector(`[data-text-editor="${object.id}"]`)
  editor?.focus()
}

function finishTextEdit(event, object) {
  dispatchCanvasAction({
    type: 'object.patch',
    objectId: object.id,
    patch: { text: event.currentTarget.textContent || 'Text' },
  })
  editingTextId.value = ''
}

onMounted(async () => {
  loadLocalScene()
  await importPlayerCharactersToScene()
  await nextTick()
  centerViewport()
})

watch(
  scene,
  (nextScene) => {
    window.localStorage.setItem(storageKey, JSON.stringify(nextScene))
  },
  { deep: true },
)

watch(
  () => scene.value.combat.turnNumber,
  (newTurnNumber, oldTurnNumber) => {
    if (Number(newTurnNumber) > Number(oldTurnNumber)) {
      resetCombatantsForNewTurn()
    }
  },
)
</script>

<template>
  <main class="canvas-page">
    <section
      ref="viewportRef"
      class="canvas-viewport"
      aria-label="Virtual tabletop canvas"
      @wheel.prevent="handleWheel"
      @pointerdown="startBoardPointer"
      @pointermove="handlePointerMove"
      @pointerup="endPointer"
      @pointercancel="endPointer"
      @pointerleave="endPointer"
    >
      <div class="canvas-world" :style="boardTransform">
        <div class="canvas-board" :style="boardBackground">
          <div class="canvas-grid" :style="gridStyle"></div>

          <svg class="canvas-ruler-layer" :viewBox="`0 0 ${boardSize.width} ${boardSize.height}`" aria-hidden="true">
            <line
              v-if="ruler?.end"
              class="canvas-ruler-line"
              :x1="ruler.start.x"
              :y1="ruler.start.y"
              :x2="ruler.end.x"
              :y2="ruler.end.y"
            />
          </svg>

          <div
            v-for="object in orderedObjects"
            :key="object.id"
            class="canvas-object"
            :class="[`canvas-object-${object.type}`, { 'canvas-object-selected': selectedId === object.id, 'canvas-object-locked': object.locked }]"
            :style="{ left: `${object.x}px`, top: `${object.y}px`, zIndex: objectZIndex(object), transform: objectTransform(object) }"
            @pointerdown="startObjectDrag($event, object)"
            @dblclick.stop="object.type === 'text' && editTextObject(object)"
          >
            <img
              v-if="object.type === 'image'"
              :src="object.src"
              alt=""
              draggable="false"
              :style="{ width: `${object.width}px`, height: `${object.height}px` }"
            />

            <div
              v-else-if="object.type === 'token'"
              class="canvas-token"
              :style="{ width: `${object.size}px`, height: `${object.size}px`, borderColor: object.color, backgroundColor: object.imageSrc ? 'rgba(3, 7, 12, 0.86)' : object.color }"
            >
              <img v-if="object.imageSrc" :src="object.imageSrc" alt="" draggable="false" />
              <span v-else>{{ object.name.slice(0, 2) }}</span>
              <strong>{{ object.name }}</strong>
              <span v-if="scene.combat.combatants.find((combatant) => combatant.id === object.combatantId)?.dead" class="canvas-token-dead-mark" aria-hidden="true"></span>
            </div>

            <div
              v-else
              class="canvas-text"
              :contenteditable="editingTextId === object.id"
              :data-text-editor="object.id"
              :style="{ color: object.color, fontSize: `${object.size}px` }"
              @blur="finishTextEdit($event, object)"
              @keydown.enter.prevent="$event.currentTarget.blur()"
            >
              {{ object.text }}
            </div>

            <button
              v-if="selectedId === object.id && !object.locked && ['image', 'token', 'text'].includes(object.type)"
              type="button"
              class="canvas-resize-handle"
              aria-label="Resize selected object"
              title="Resize"
              @pointerdown="startResize($event, object)"
            ></button>

            <button
              v-if="selectedId === object.id && !object.locked && ['image', 'text'].includes(object.type)"
              type="button"
              class="canvas-rotate-handle"
              aria-label="Rotate selected object"
              title="Rotate"
              @pointerdown="startRotate($event, object)"
            ></button>

            <span v-if="object.locked" class="canvas-lock-badge" aria-hidden="true">LOCK</span>

            <div
              v-if="object.type === 'token' && selectedId === object.id && selectedTokenCombatant"
              class="canvas-token-popover"
              @pointerdown.stop
            >
              <div class="canvas-token-popover-header">
                <strong>{{ selectedTokenCombatant.name }}</strong>
                <span>{{ selectedTokenCombatant.health }}</span>
              </div>

              <div class="canvas-token-popover-grid">
                <label>
                  <span>Health</span>
                  <select v-model="selectedTokenCombatant.health">
                    <option>Healthy</option>
                    <option>Stunned</option>
                    <option>Wounded</option>
                    <option>Incapacitated</option>
                    <option>Mortally Wounded</option>
                  </select>
                </label>
                <label>
                  <span>Strength</span>
                  <input v-model="selectedTokenCombatant.strength" />
                </label>
                <label>
                  <span>Temp. Diff.</span>
                  <input v-model="selectedTokenCombatant.tempDifficulty" />
                </label>
                <label>
                  <span>Position</span>
                  <input v-model="selectedTokenCombatant.relativePosition" />
                </label>
                <label class="canvas-token-checkbox">
                  <input v-model="selectedTokenCombatant.knockedProne" type="checkbox" />
                  <span>Prone</span>
                </label>
                <label class="canvas-token-checkbox">
                  <input v-model="selectedTokenCombatant.isNpc" type="checkbox" />
                  <span>NPC</span>
                </label>
                <label class="canvas-token-checkbox canvas-token-dead-toggle">
                  <input v-model="selectedTokenCombatant.dead" type="checkbox" />
                  <span>Dead</span>
                </label>
                <label v-if="selectedTokenCombatant.isNpc">
                  <span>Stuns</span>
                  <input v-model.number="selectedTokenCombatant.activeStuns" type="number" min="0" />
                </label>
                <label v-if="selectedTokenCombatant.isNpc">
                  <span>Damage</span>
                  <input v-model="selectedTokenCombatant.damage" />
                </label>
              </div>

              <label class="canvas-token-color">
                <span>Token Color</span>
                <input v-model="object.color" type="color" @input="updateTokenColor(object)" />
              </label>
            </div>
          </div>
        </div>
      </div>

      <div v-if="rulerDistance" class="canvas-measurement">{{ rulerDistance }}</div>
      <div v-if="playerImportMessage" class="canvas-scene-message">{{ playerImportMessage }}</div>
    </section>

    <aside v-if="showCombatSidebar" class="canvas-combat-sidebar" aria-label="Canvas combat tracker">
      <div class="canvas-combat-header">
        <div>
          <p>Encounter</p>
          <h2>Combat</h2>
        </div>
        <button type="button" aria-label="Close combat sidebar" @click="showCombatSidebar = false">x</button>
      </div>

      <div class="canvas-combat-turns">
        <label>
          <span>Cur. Action</span>
          <input v-model.number="scene.combat.currentAction" type="number" min="1" />
        </label>
        <label>
          <span>Turn</span>
          <input v-model.number="scene.combat.turnNumber" type="number" min="1" />
        </label>
      </div>

      <div class="canvas-combat-actions">
        <button type="button" @click="nextCombatant">Next</button>
        <button type="button" @click="sortCombatants">Sort</button>
        <button type="button" @click="addCombatToken">Add</button>
      </div>

      <div class="canvas-combat-list">
        <article
          v-for="combatant in orderedCombatants"
          :key="combatant.id"
          class="canvas-combat-row"
          :class="{ 'canvas-combat-row-selected': selectedTokenCombatant?.id === combatant.id }"
          :style="{ borderLeftColor: combatantColor(combatant) }"
          @click="selectCombatantToken(combatant.id)"
        >
          <label>
            <span>Order</span>
            <input v-model.number="combatant.turnOrder" type="number" min="1" @click.stop />
          </label>
          <label>
            <span>Name</span>
            <input v-model="combatant.name" @input="updateCombatantName(combatant)" @click.stop />
          </label>
          <label>
            <span>Actions</span>
            <input v-model.number="combatant.actions" type="number" min="0" @click.stop />
          </label>
          <button type="button" aria-label="Delete combatant" @click.stop="deleteCombatant(combatant.id)">Del</button>
        </article>
      </div>
    </aside>

    <aside v-if="showAssetSidebar" class="canvas-asset-sidebar" aria-label="Saved image imports">
      <div class="canvas-asset-header">
        <div>
          <p>Library</p>
          <h2>Import Image</h2>
        </div>
        <button type="button" aria-label="Close image import sidebar" @click="showAssetSidebar = false">x</button>
      </div>

      <label class="canvas-asset-search">
        <span>Search</span>
        <input v-model="assetSearch" type="search" placeholder="Filter by name" />
      </label>

      <div class="canvas-asset-list">
        <button
          v-for="asset in filteredCanvasAssets"
          :key="asset.id"
          type="button"
          class="canvas-asset-row"
          @click="addSavedImageAsset(asset)"
        >
          <img :src="asset.url" alt="" draggable="false" />
          <span>{{ asset.name }}</span>
        </button>
        <p v-if="filteredCanvasAssets.length === 0" class="canvas-asset-empty">No saved images match that search.</p>
      </div>
    </aside>

    <div
      v-if="showInstructions"
      class="combat-instructions-backdrop"
      role="presentation"
      @click.self="showInstructions = false"
    >
      <section class="combat-instructions" role="dialog" aria-modal="true" aria-labelledby="canvas-combat-instructions-title">
        <div class="combat-instructions-header">
          <div>
            <p>Round Guide</p>
            <h2 id="canvas-combat-instructions-title">Combat Instructions</h2>
          </div>
          <button type="button" aria-label="Close combat instructions" @click="showInstructions = false">Close</button>
        </div>

        <div class="combat-instructions-list">
          <section v-for="instruction in combatInstructions" :key="instruction.title" class="combat-instruction-step">
            <p>{{ instruction.step }}</p>
            <h3>{{ instruction.title }}</h3>
            <span>{{ instruction.details }}</span>
          </section>
        </div>
      </section>
    </div>

    <aside class="canvas-toolbar" aria-label="Canvas toolbar">
      <div class="canvas-toolbar-group canvas-tool-mode-group">
        <button type="button" :class="{ 'canvas-tool-active': activeTool === 'select' }" title="Select and move objects" @click="activeTool = 'select'">Sel</button>
        <button type="button" :class="{ 'canvas-tool-active': activeTool === 'pan' }" title="Pan the board" @click="activeTool = 'pan'">Pan</button>
        <button type="button" :class="{ 'canvas-tool-active': activeTool === 'ruler' }" title="Measure distance" @click="activeTool = 'ruler'">Rul</button>
        <button type="button" :class="{ 'canvas-tool-active': activeTool === 'lock' }" title="Lock or unlock objects" @click="activeTool = 'lock'">Lock</button>
      </div>

      <div class="canvas-toolbar-group">
        <button type="button" title="Add image from URL" @click="addImageAsset">Img</button>
        <button type="button" :class="{ 'canvas-tool-active': showAssetSidebar }" title="Import saved image" @click="showAssetSidebar = !showAssetSidebar">Import</button>
        <button type="button" title="Add character token" @click="addToken">Tok</button>
        <button type="button" title="Add text" @click="addText">Txt</button>
        <button type="button" :class="{ 'canvas-tool-active': showCombatSidebar }" title="Toggle combat tracker" @click="showCombatSidebar = !showCombatSidebar">Cbt</button>
        <button type="button" :class="{ 'canvas-tool-active': showInstructions }" title="Open combat instructions" @click="showInstructions = true">Inst</button>
      </div>

      <div class="canvas-toolbar-group canvas-toolbar-fields">
        <label>
          <span>BG</span>
          <input v-model="scene.background.value" type="color" />
        </label>
        <label>
          <span>BG URL</span>
          <input v-model="scene.background.imageUrl" type="text" placeholder="https://..." />
        </label>
        <label>
          <span>Mode</span>
          <select v-model="scene.background.type">
            <option value="color">Color</option>
            <option value="image">Image</option>
          </select>
        </label>
      </div>

      <div class="canvas-toolbar-group canvas-toolbar-fields">
        <label class="canvas-checkbox">
          <input v-model="scene.grid.enabled" type="checkbox" />
          <span>Grid</span>
        </label>
        <label class="canvas-checkbox">
          <input v-model="scene.grid.snap" type="checkbox" />
          <span>Snap</span>
        </label>
        <label>
          <span>Size</span>
          <input v-model.number="scene.grid.size" type="number" min="16" max="220" />
        </label>
        <label>
          <span>Unit</span>
          <input v-model.number="scene.grid.unitDistance" type="number" min="0.1" step="0.1" />
        </label>
        <label>
          <span>Lbl</span>
          <input v-model="scene.grid.unitLabel" type="text" />
        </label>
      </div>

      <div v-if="selectedObject" class="canvas-toolbar-group canvas-toolbar-fields canvas-selection-tools">
        <label v-if="selectedObject.type === 'token'">
          <span>Name</span>
          <input v-model="selectedObject.name" type="text" @input="updateTokenName(selectedObject)" />
        </label>
        <label v-if="selectedObject.type === 'token' || selectedObject.type === 'text'">
          <span>Color</span>
          <input v-model="selectedObject.color" type="color" @input="selectedObject.type === 'token' && updateTokenColor(selectedObject)" />
        </label>
        <label v-if="selectedObject.type === 'token'">
          <span>Img URL</span>
          <input v-model="selectedObject.imageSrc" type="text" placeholder="https://..." />
        </label>
        <label v-if="selectedObject.type === 'image'">
          <span>Width</span>
          <input v-model.number="selectedObject.width" type="number" min="40" />
        </label>
        <label v-if="selectedObject.type === 'image'">
          <span>Height</span>
          <input v-model.number="selectedObject.height" type="number" min="40" />
        </label>
        <label v-if="selectedObject.type === 'token' || selectedObject.type === 'text'">
          <span>Size</span>
          <input v-model.number="selectedObject.size" type="number" min="12" />
        </label>
        <label v-if="selectedObject.type === 'image' || selectedObject.type === 'text'">
          <span>Rot</span>
          <input v-model.number="selectedObject.rotation" type="number" step="1" />
        </label>
        <button type="button" title="Bring forward" @click="nudgeZ(1)">Up</button>
        <button type="button" title="Send backward" @click="nudgeZ(-1)">Dn</button>
        <button type="button" title="Duplicate selected object" @click="duplicateSelected">Dup</button>
        <button type="button" class="canvas-danger-button" title="Delete selected object" @click="deleteSelected">Del</button>
      </div>

      <div class="canvas-toolbar-group">
        <button type="button" title="Reset viewport" @click="resetViewport">View</button>
        <button type="button" title="Clear ruler" @click="ruler = null">Clr Rul</button>
        <button type="button" class="canvas-danger-button" title="Clear scene" @click="clearScene">Clear</button>
      </div>

      <details class="canvas-json-tools">
        <summary>JSON</summary>
        <div class="canvas-json-panel">
          <input ref="sceneFileInput" class="canvas-file-input" type="file" accept="application/json,.json" @change="importSceneFile" />
          <textarea v-model="importExportValue" rows="5"></textarea>
          <div class="canvas-json-actions">
            <button type="button" @click="prepareExport">Copy</button>
            <button type="button" @click="importScene">Paste</button>
            <button type="button" @click="exportSceneToFile">Export</button>
            <button type="button" @click="openSceneFilePicker">Import</button>
          </div>
          <p v-if="sceneMessage">{{ sceneMessage }}</p>
        </div>
      </details>
    </aside>

    <ReferenceCharts />
  </main>
</template>

<style scoped>
.canvas-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.canvas-viewport {
  position: fixed;
  inset: 64px 0 156px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  background: rgba(0, 0, 0, 0.18);
}

.canvas-viewport:active {
  cursor: grabbing;
}

.canvas-world {
  position: absolute;
  left: 0;
  top: 0;
  width: 3600px;
  height: 2400px;
  transform-origin: 0 0;
}

.canvas-board {
  position: relative;
  width: 3600px;
  height: 2400px;
  overflow: hidden;
  border: 1px solid rgba(79, 195, 255, 0.34);
  box-shadow:
    inset 0 0 80px rgba(0, 0, 0, 0.28),
    0 30px 80px rgba(0, 0, 0, 0.45);
}

.canvas-grid,
.canvas-ruler-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.canvas-ruler-line {
  stroke: #fff2a7;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 22 18;
  filter: drop-shadow(0 0 8px rgba(255, 242, 167, 0.7));
}

.canvas-object {
  position: absolute;
  touch-action: none;
  transform: translate(-50%, -50%);
}

.canvas-object-selected {
  outline: 3px solid #fff2a7;
  outline-offset: 6px;
}

.canvas-object-locked {
  cursor: default;
}

.canvas-object-locked::after {
  content: '';
  position: absolute;
  inset: -8px;
  border: 2px dashed rgba(217, 245, 255, 0.34);
  pointer-events: none;
}

.canvas-lock-badge {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  z-index: 70;
  transform: translateX(-50%);
  border: 1px solid rgba(217, 245, 255, 0.38);
  background: rgba(3, 7, 12, 0.86);
  padding: 3px 6px;
  color: rgba(217, 245, 255, 0.82);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.12em;
  pointer-events: none;
}

.canvas-resize-handle,
.canvas-rotate-handle {
  position: absolute;
  z-index: 90;
  width: 22px;
  height: 22px;
  border: 2px solid rgba(255, 242, 167, 0.92);
  box-shadow: 0 0 14px rgba(255, 242, 167, 0.36);
}

.canvas-resize-handle {
  right: -17px;
  bottom: -17px;
  background:
    linear-gradient(135deg, transparent 0 44%, rgba(255, 242, 167, 0.92) 46% 54%, transparent 56%),
    rgba(3, 7, 12, 0.94);
  cursor: nwse-resize;
}

.canvas-rotate-handle {
  left: 50%;
  top: -42px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(255, 242, 167, 0.96) 0 28%, transparent 30%),
    rgba(3, 7, 12, 0.94);
  cursor: grab;
  transform: translateX(-50%);
}

.canvas-rotate-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  width: 2px;
  height: 22px;
  background: rgba(255, 242, 167, 0.72);
  transform: translateX(-50%);
}

.canvas-object-image img {
  display: block;
  object-fit: contain;
  pointer-events: none;
}

.canvas-token {
  position: relative;
  display: grid;
  box-sizing: border-box;
  place-items: center;
  border: 4px solid #ffcc66;
  border-radius: 999px;
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.42),
    0 0 18px rgba(255, 242, 167, 0.28);
}

.canvas-token img {
  position: absolute;
  inset: 4px;
  z-index: 0;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  border-radius: 999px;
  object-fit: cover;
  pointer-events: none;
}

.canvas-token span {
  position: relative;
  z-index: 1;
  color: #081018;
  font-size: 24px;
  font-weight: 900;
  text-transform: uppercase;
}

.canvas-token-dead-mark {
  position: absolute !important;
  inset: 10%;
  z-index: 3 !important;
  display: block;
  pointer-events: none;
}

.canvas-token-dead-mark::before,
.canvas-token-dead-mark::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 125%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 35, 24, 0.92);
  box-shadow:
    0 0 5px rgba(255, 255, 255, 0.5),
    0 0 16px rgba(255, 35, 24, 0.8);
}

.canvas-token-dead-mark::before {
  transform: translate(-50%, -50%) rotate(45deg);
}

.canvas-token-dead-mark::after {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.canvas-token strong {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  max-width: 180px;
  transform: translateX(-50%);
  color: #f8fdff;
  font-size: 15px;
  font-weight: 900;
  text-align: center;
  text-shadow: 0 2px 5px #000;
  white-space: nowrap;
}

.canvas-token-popover {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 48px);
  z-index: 80;
  width: 360px;
  transform: translateX(-50%);
  border: 1px solid rgba(79, 195, 255, 0.44);
  background: rgba(3, 7, 12, 0.94);
  padding: 12px;
  color: #d9f5ff;
  box-shadow:
    inset 0 0 24px rgba(79, 195, 255, 0.06),
    0 18px 46px rgba(0, 0, 0, 0.52);
}

.canvas-token-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid rgba(79, 195, 255, 0.18);
  padding-bottom: 8px;
}

.canvas-token-popover-header strong {
  position: static;
  max-width: none;
  transform: none;
  color: #f8fdff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 18px;
  text-align: left;
  text-shadow: none;
  white-space: normal;
}

.canvas-token-popover-header span {
  color: #fff2a7;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.canvas-token-popover-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

.canvas-token-popover label {
  display: grid;
  gap: 4px;
}

.canvas-token-popover label span {
  color: rgba(217, 245, 255, 0.7);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.canvas-token-popover input,
.canvas-token-popover select {
  width: 100%;
  border: 1px solid rgba(79, 195, 255, 0.32);
  background: rgba(9, 16, 24, 0.86);
  padding: 7px 8px;
  color: #f8fdff;
  font: inherit;
  font-size: 12px;
  outline: none;
}

.canvas-token-checkbox {
  display: flex !important;
  align-items: center;
  gap: 8px !important;
}

.canvas-token-checkbox input {
  width: 16px;
  height: 16px;
  accent-color: #4fc3ff;
}

.canvas-token-dead-toggle input {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 59, 36, 0.78);
  border-radius: 999px;
  background: rgba(3, 7, 12, 0.86);
}

.canvas-token-dead-toggle input:checked {
  box-shadow: inset 0 0 0 3px rgba(3, 7, 12, 0.95);
  background: #ff3b24;
}

.canvas-token-color {
  margin-top: 10px;
}

.canvas-token-color input {
  height: 34px;
  padding: 3px;
}

.canvas-text {
  min-width: 48px;
  color: #f8fdff;
  font-family: Georgia, 'Times New Roman', serif;
  font-weight: 900;
  line-height: 1.1;
  text-shadow:
    0 2px 4px #000,
    0 0 14px rgba(79, 195, 255, 0.35);
  white-space: pre;
}

.canvas-text[contenteditable='true'] {
  min-width: 160px;
  outline: 2px solid #4fc3ff;
  background: rgba(3, 7, 12, 0.68);
  padding: 6px 8px;
}

.canvas-measurement {
  position: fixed;
  left: 50%;
  top: 84px;
  z-index: 28;
  transform: translateX(-50%);
  border: 1px solid rgba(255, 242, 167, 0.52);
  background: rgba(3, 7, 12, 0.88);
  padding: 8px 12px;
  color: #fff2a7;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.canvas-scene-message {
  position: fixed;
  left: 50%;
  top: 124px;
  z-index: 28;
  max-width: 520px;
  transform: translateX(-50%);
  border: 1px solid rgba(79, 195, 255, 0.38);
  background: rgba(3, 7, 12, 0.88);
  padding: 8px 12px;
  color: rgba(217, 245, 255, 0.86);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: center;
}

.canvas-combat-sidebar {
  position: fixed;
  top: 72px;
  right: 16px;
  bottom: 168px;
  z-index: 10020;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  width: 430px;
  gap: 12px;
  border: 1px solid rgba(79, 195, 255, 0.38);
  background: rgba(3, 7, 12, 0.94);
  padding: 14px;
  color: #d9f5ff;
  box-shadow:
    inset 0 0 28px rgba(79, 195, 255, 0.06),
    0 20px 56px rgba(0, 0, 0, 0.5);
}

.canvas-asset-sidebar {
  position: fixed;
  top: 72px;
  left: 16px;
  bottom: 168px;
  z-index: 10020;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: 360px;
  gap: 12px;
  border: 1px solid rgba(79, 195, 255, 0.38);
  background: rgba(3, 7, 12, 0.94);
  padding: 14px;
  color: #d9f5ff;
  box-shadow:
    inset 0 0 28px rgba(79, 195, 255, 0.06),
    0 20px 56px rgba(0, 0, 0, 0.5);
}

.canvas-asset-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

.canvas-asset-header p {
  color: rgba(217, 245, 255, 0.7);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.canvas-asset-header h2 {
  margin-top: 2px;
  color: #4fc3ff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 900;
}

.canvas-asset-header button {
  border: 1px solid rgba(79, 195, 255, 0.42);
  background: rgba(79, 195, 255, 0.1);
  padding: 8px 10px;
  color: #d9f5ff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.canvas-asset-search {
  display: grid;
  gap: 5px;
}

.canvas-asset-search span {
  color: rgba(217, 245, 255, 0.7);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.canvas-asset-search input {
  width: 100%;
  border: 1px solid rgba(79, 195, 255, 0.3);
  background: rgba(9, 16, 24, 0.8);
  padding: 9px 10px;
  color: #f8fdff;
  font: inherit;
  outline: none;
}

.canvas-asset-list {
  display: grid;
  align-content: start;
  gap: 8px;
  overflow-y: auto;
  padding-right: 3px;
}

.canvas-asset-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border: 1px solid rgba(79, 195, 255, 0.24);
  background: rgba(9, 16, 24, 0.68);
  padding: 8px;
  color: #f8fdff;
  text-align: left;
}

.canvas-asset-row:hover,
.canvas-asset-row:focus-visible {
  border-color: #9be7ff;
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(155, 231, 255, 0.22);
}

.canvas-asset-row img {
  width: 72px;
  height: 48px;
  object-fit: cover;
  border: 1px solid rgba(217, 245, 255, 0.24);
  background: rgba(79, 195, 255, 0.08);
}

.canvas-asset-row span {
  overflow: hidden;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.canvas-asset-empty {
  margin: 0;
  color: rgba(217, 245, 255, 0.72);
  font-size: 13px;
  line-height: 1.45;
}

.canvas-combat-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

.canvas-combat-header p {
  color: rgba(217, 245, 255, 0.7);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.canvas-combat-header h2 {
  margin-top: 2px;
  color: #4fc3ff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 28px;
  font-weight: 900;
}

.canvas-combat-header button,
.canvas-combat-actions button,
.canvas-combat-row button {
  border: 1px solid rgba(79, 195, 255, 0.42);
  background: rgba(79, 195, 255, 0.1);
  padding: 8px 10px;
  color: #d9f5ff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.canvas-combat-turns,
.canvas-combat-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.canvas-combat-turns {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.canvas-combat-turns label,
.canvas-combat-row label {
  display: grid;
  gap: 4px;
}

.canvas-combat-turns span,
.canvas-combat-row span {
  color: rgba(217, 245, 255, 0.7);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.canvas-combat-turns input,
.canvas-combat-row input {
  width: 100%;
  border: 1px solid rgba(79, 195, 255, 0.3);
  background: rgba(9, 16, 24, 0.8);
  padding: 8px 9px;
  color: #f8fdff;
  font: inherit;
  font-size: 13px;
  outline: none;
}

.canvas-combat-list {
  display: grid;
  align-content: start;
  gap: 8px;
  overflow-y: auto;
  padding-right: 3px;
}

.canvas-combat-row {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) 70px auto;
  gap: 8px;
  align-items: end;
  border-left: 4px solid #4fc3ff;
  background: rgba(9, 16, 24, 0.68);
  padding: 9px;
}

.canvas-combat-row:hover,
.canvas-combat-row-selected {
  background: rgba(79, 195, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(155, 231, 255, 0.22);
}

.canvas-combat-row button {
  border-color: rgba(255, 59, 36, 0.5);
  color: #ffd7d2;
}

.canvas-toolbar {
  position: fixed;
  inset: auto 0 0;
  z-index: 10030;
  display: flex;
  min-height: 136px;
  align-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  overflow: visible;
  border-top: 1px solid rgba(79, 195, 255, 0.42);
  background: rgba(3, 7, 12, 0.96);
  padding: 8px 10px;
  color: #d9f5ff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 -18px 46px rgba(0, 0, 0, 0.5);
}

:deep(.reference-charts) {
  z-index: 10040;
  right: 18px;
  bottom: 176px;
}

:global(.canvas-page ~ .dice-roller) {
  z-index: 10040;
  right: 96px;
  bottom: 176px;
}

:global(.canvas-page ~ .dice-roller .dice-overlay) {
  z-index: 10070;
}

:deep(.reference-overlay),
:global(.canvas-page .combat-instructions-backdrop) {
  z-index: 10060;
}

.canvas-toolbar-group {
  display: flex;
  flex: 0 1 auto;
  align-items: center;
  gap: 6px;
  border-right: 1px solid rgba(79, 195, 255, 0.18);
  padding-right: 8px;
}

.canvas-tool-mode-group {
  flex: 0 0 auto;
}

.canvas-toolbar-fields {
  align-items: end;
}

.canvas-selection-tools {
  flex: 1 1 620px;
  background: rgba(79, 195, 255, 0.06);
  padding: 5px 8px;
}

.canvas-toolbar button,
.canvas-toolbar input,
.canvas-toolbar select,
.canvas-toolbar textarea {
  border: 1px solid rgba(79, 195, 255, 0.34);
  background: rgba(9, 16, 24, 0.84);
  color: #f8fdff;
  font: inherit;
  outline: none;
}

.canvas-toolbar button {
  min-width: 42px;
  min-height: 32px;
  padding: 7px 8px;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.canvas-toolbar button:hover,
.canvas-toolbar button:focus-visible,
.canvas-toolbar input:focus,
.canvas-toolbar select:focus,
.canvas-toolbar textarea:focus {
  border-color: #9be7ff;
  box-shadow: 0 0 14px rgba(79, 195, 255, 0.32);
}

.canvas-toolbar .canvas-tool-active {
  border-color: #fff2a7;
  color: #fff2a7;
  box-shadow: 0 0 16px rgba(255, 242, 167, 0.28);
}

.canvas-danger-button {
  border-color: rgba(255, 59, 36, 0.55) !important;
  color: #ffd7d2 !important;
}

.canvas-toolbar label {
  display: grid;
  gap: 3px;
}

.canvas-toolbar label span {
  color: rgba(217, 245, 255, 0.7);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.canvas-toolbar input,
.canvas-toolbar select {
  height: 32px;
  min-width: 56px;
  padding: 5px 7px;
  font-size: 12px;
}

.canvas-toolbar input[type='color'] {
  width: 38px;
  min-width: 38px;
  padding: 3px;
}

.canvas-toolbar input[type='number'] {
  width: 62px;
}

.canvas-toolbar input[type='text'] {
  width: 132px;
}

.canvas-checkbox {
  display: flex !important;
  min-height: 32px;
  align-items: end;
  gap: 6px !important;
}

.canvas-checkbox input {
  width: 16px;
  min-width: 16px;
  height: 16px;
  accent-color: #4fc3ff;
}

.canvas-json-tools {
  position: relative;
  flex: 0 0 auto;
  padding-right: 0;
}

.canvas-json-tools summary {
  display: grid;
  min-width: 48px;
  min-height: 32px;
  place-items: center;
  border: 1px solid rgba(79, 195, 255, 0.34);
  background: rgba(9, 16, 24, 0.84);
  color: #4fc3ff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.canvas-json-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 10px);
  width: 320px;
  border: 1px solid rgba(79, 195, 255, 0.34);
  background: rgba(3, 7, 12, 0.96);
  padding: 10px;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.48);
}

.canvas-json-panel textarea {
  width: 100%;
  padding: 8px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 11px;
}

.canvas-file-input {
  display: none;
}

.canvas-json-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.canvas-json-actions button {
  flex: 1;
  min-width: 0;
  padding-inline: 6px;
}

.canvas-json-panel p {
  margin: 6px 0 0;
  color: rgba(217, 245, 255, 0.72);
  font-size: 12px;
}
</style>
