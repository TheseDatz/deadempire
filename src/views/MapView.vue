<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSession, isAdminSession, onAuthStateChange } from '../services/auth'
import { isSupabaseConfigured, loadMapData, saveMapData } from '../services/mapData'

const mapImageUrl =
  'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/b996fcf2-a801-4962-8029-0b0799d38e30/d9tsjom-0f83965a-bcd0-448c-a959-081e7f4a1392.jpg/v1/fill/w_5400,h_5930,q_95,strp/star_wars_ulitme_galaxy_map_version_0_01_by_rexxaakobra_d9tsjom-map.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NjI3NyIsInBhdGgiOiIvZi9iOTk2ZmNmMi1hODAxLTQ5NjItODAyOS0wYjA3OTlkMzhlMzAvZDl0c2pvbS0wZjgzOTY1YS1iY2QwLTQ0OGMtYTk1OS0wODFlN2Y0YTEzOTIuanBnIiwid2lkdGgiOiI8PTU3MTYifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.LQHsvRK7SxUae3iQI-o2YB-PNnPyZTCDoAuE_wNPvwI'

const mapSize = { width: 5400, height: 5930 }
const viewportRef = ref(null)
const scale = ref(0.26)
const position = ref({ x: 0, y: 48 })
const dragStart = ref(null)
const overlayDrag = ref(null)
const isEditorOpen = ref(false)
const addPointMode = ref(false)
const selectedType = ref('label')
const selectedId = ref('')
const session = ref(null)
const isLoadingMapData = ref(false)
const isSavingMapData = ref(false)
const mapDataMessage = ref('')
const mapDataError = ref('')
const labels = ref([])
const borders = ref([])
const planets = ref([])
const ships = ref([])
let unsubscribe = null

const isAdmin = computed(() => isAdminSession(session.value))
const selectedLabel = computed(() => labels.value.find((label) => label.id === selectedId.value))
const selectedBorder = computed(() => borders.value.find((border) => border.id === selectedId.value))
const selectedPlanet = computed(() => planets.value.find((planet) => planet.id === selectedId.value))
const selectedShip = computed(() => ships.value.find((ship) => ship.id === selectedId.value))
const overlayData = computed(() =>
  JSON.stringify({ labels: labels.value, borders: borders.value, planets: planets.value, ships: ships.value }, null, 2),
)

const mapTransform = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${scale.value})`,
}))

function clampScale(value) {
  return Math.min(Math.max(value, 0.16), 2.6)
}

function mapPointFromEvent(event) {
  const viewerBounds = viewportRef.value.getBoundingClientRect()
  return {
    x: Math.round((event.clientX - viewerBounds.left - position.value.x) / scale.value),
    y: Math.round((event.clientY - viewerBounds.top - position.value.y) / scale.value),
  }
}

function zoomAt(event, direction) {
  const viewerBounds = event.currentTarget.getBoundingClientRect()
  const pointX = event.clientX - viewerBounds.left
  const pointY = event.clientY - viewerBounds.top
  const nextScale = clampScale(scale.value * direction)
  const ratio = nextScale / scale.value

  position.value = {
    x: pointX - (pointX - position.value.x) * ratio,
    y: pointY - (pointY - position.value.y) * ratio,
  }
  scale.value = nextScale
}

function handleWheel(event) {
  zoomAt(event, event.deltaY < 0 ? 1.12 : 0.88)
}

function startPan(event) {
  if (event.target.closest('.map-overlay-hotspot')) {
    return
  }

  event.currentTarget.setPointerCapture(event.pointerId)
  dragStart.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: position.value.x,
    originY: position.value.y,
  }
}

function pan(event) {
  if (!dragStart.value || dragStart.value.pointerId !== event.pointerId) {
    return
  }

  position.value = {
    x: dragStart.value.originX + event.clientX - dragStart.value.startX,
    y: dragStart.value.originY + event.clientY - dragStart.value.startY,
  }
}

function endPan(event) {
  if (dragStart.value?.pointerId === event.pointerId) {
    dragStart.value = null
  }

  if (overlayDrag.value?.pointerId === event.pointerId) {
    overlayDrag.value = null
  }
}

function handleMapClick(event) {
  if (!isAdmin.value || !addPointMode.value || selectedType.value !== 'border' || !selectedBorder.value) {
    return
  }

  selectedBorder.value.points.push(mapPointFromEvent(event))
}

function handleOverlayClick(event) {
  if (isAdmin.value) {
    event.stopPropagation()
  }
}

function selectBorder(event, border) {
  if (!isAdmin.value) {
    return
  }

  event.stopPropagation()
  selectedType.value = 'border'
  selectedId.value = border.id
}

function startLabelDrag(event, label) {
  if (!isAdmin.value) {
    return
  }

  event.stopPropagation()
  event.currentTarget.setPointerCapture(event.pointerId)
  selectedType.value = 'label'
  selectedId.value = label.id
  overlayDrag.value = { pointerId: event.pointerId, type: 'label', id: label.id }
}

function startPointDrag(event, border, pointIndex) {
  if (!isAdmin.value) {
    return
  }

  event.stopPropagation()
  event.currentTarget.setPointerCapture(event.pointerId)
  selectedType.value = 'border'
  selectedId.value = border.id
  overlayDrag.value = { pointerId: event.pointerId, type: 'point', id: border.id, pointIndex }
}

function dragOverlay(event) {
  if (!isAdmin.value || !overlayDrag.value || overlayDrag.value.pointerId !== event.pointerId) {
    return
  }

  const point = mapPointFromEvent(event)

  if (overlayDrag.value.type === 'label') {
    const label = labels.value.find((item) => item.id === overlayDrag.value.id)
    if (label) {
      label.x = point.x
      label.y = point.y
    }
  }

  if (overlayDrag.value.type === 'planet') {
    const planet = planets.value.find((item) => item.id === overlayDrag.value.id)
    if (planet) {
      planet.x = point.x
      planet.y = point.y
    }
  }

  if (overlayDrag.value.type === 'ship') {
    const ship = ships.value.find((item) => item.id === overlayDrag.value.id)
    if (ship) {
      ship.x = point.x
      ship.y = point.y
    }
  }

  if (overlayDrag.value.type === 'point') {
    const border = borders.value.find((item) => item.id === overlayDrag.value.id)
    if (border?.points[overlayDrag.value.pointIndex]) {
      border.points[overlayDrag.value.pointIndex] = point
    }
  }
}

function startPlanetDrag(event, planet) {
  if (!isAdmin.value) {
    return
  }

  event.stopPropagation()
  event.currentTarget.setPointerCapture(event.pointerId)
  selectedType.value = 'planet'
  selectedId.value = planet.id
  overlayDrag.value = { pointerId: event.pointerId, type: 'planet', id: planet.id }
}

function startShipDrag(event, ship) {
  if (!isAdmin.value) {
    return
  }

  event.stopPropagation()
  event.currentTarget.setPointerCapture(event.pointerId)
  selectedType.value = 'ship'
  selectedId.value = ship.id
  overlayDrag.value = { pointerId: event.pointerId, type: 'ship', id: ship.id }
}

function addLabel() {
  if (!isAdmin.value) {
    return
  }

  const id = `label-${Date.now()}`
  labels.value.push({ id, text: 'New Label', x: 2700, y: 2965, color: '#f8fdff', size: 30, opacity: 1 })
  selectedType.value = 'label'
  selectedId.value = id
}

function addPlanet() {
  if (!isAdmin.value) {
    return
  }

  const id = `planet-${Date.now()}`
  planets.value.push({
    id,
    name: 'New Planet',
    x: 2700,
    y: 2965,
    color: '#4fc3ff',
    radius: 24,
    labelSize: 24,
    labelColor: '#f8fdff',
    opacity: 1,
  })
  selectedType.value = 'planet'
  selectedId.value = id
}

function addShip() {
  if (!isAdmin.value) {
    return
  }

  const id = `ship-${Date.now()}`
  ships.value.push({
    id,
    name: 'Party Ship',
    x: 2700,
    y: 2965,
    color: '#ffef9a',
    size: 34,
    labelSize: 22,
    labelColor: '#f8fdff',
    rotation: 0,
    opacity: 1,
  })
  selectedType.value = 'ship'
  selectedId.value = id
}

function addBorder() {
  if (!isAdmin.value) {
    return
  }

  const id = `border-${Date.now()}`
  borders.value.push({
    id,
    name: 'New Border',
    color: '#ffcc66',
    width: 10,
    nodeSize: 18,
    points: [
      { x: 2500, y: 2850 },
      { x: 2900, y: 2850 },
      { x: 2900, y: 3250 },
      { x: 2500, y: 3250 },
    ],
  })
  selectedType.value = 'border'
  selectedId.value = id
}

function deleteSelected() {
  if (!isAdmin.value) {
    return
  }

  if (selectedLabel.value) {
    labels.value = labels.value.filter((label) => label.id !== selectedId.value)
  }

  if (selectedBorder.value) {
    borders.value = borders.value.filter((border) => border.id !== selectedId.value)
  }

  if (selectedPlanet.value) {
    planets.value = planets.value.filter((planet) => planet.id !== selectedId.value)
  }

  if (selectedShip.value) {
    ships.value = ships.value.filter((ship) => ship.id !== selectedId.value)
  }

  selectFirstOverlay()
}

function deleteLastPoint() {
  if (!isAdmin.value) {
    return
  }

  if (selectedBorder.value && selectedBorder.value.points.length > 0) {
    selectedBorder.value.points.pop()
  }
}

function zoomIn() {
  scale.value = clampScale(scale.value * 1.18)
}

function zoomOut() {
  scale.value = clampScale(scale.value * 0.82)
}

function resetMap() {
  scale.value = 0.26
  position.value = { x: 0, y: 48 }
}

function selectFirstOverlay() {
  const nextSelection = labels.value[0] ?? borders.value[0] ?? planets.value[0] ?? ships.value[0]
  selectedType.value = labels.value[0] ? 'label' : borders.value[0] ? 'border' : planets.value[0] ? 'planet' : 'ship'
  selectedId.value = nextSelection?.id ?? ''
}

function updateSelectionType() {
  if (!isAdmin.value) {
    return
  }

  if (labels.value.some((label) => label.id === selectedId.value)) {
    selectedType.value = 'label'
    return
  }

  if (borders.value.some((border) => border.id === selectedId.value)) {
    selectedType.value = 'border'
    return
  }

  if (planets.value.some((planet) => planet.id === selectedId.value)) {
    selectedType.value = 'planet'
    return
  }

  selectedType.value = 'ship'
}

async function loadOverlays() {
  mapDataMessage.value = ''
  mapDataError.value = ''

  if (!isSupabaseConfigured) {
    mapDataError.value = 'Supabase environment variables are not configured for this build.'
    return
  }

  isLoadingMapData.value = true
  const { labels: loadedLabels, borders: loadedBorders, planets: loadedPlanets, ships: loadedShips, error } = await loadMapData()
  isLoadingMapData.value = false

  if (error) {
    mapDataError.value = error.message
    return
  }

  labels.value = loadedLabels
  borders.value = loadedBorders
  planets.value = loadedPlanets
  ships.value = loadedShips
  selectFirstOverlay()
  mapDataMessage.value =
    loadedLabels.length || loadedBorders.length || loadedPlanets.length || loadedShips.length ? 'Map overlays loaded.' : 'No map overlays found.'
}

async function saveOverlays() {
  mapDataMessage.value = ''
  mapDataError.value = ''

  if (!isAdmin.value) {
    mapDataError.value = 'Only admins can save map overlays.'
    return
  }

  if (!isSupabaseConfigured) {
    mapDataError.value = 'Supabase environment variables are not configured for this build.'
    return
  }

  isSavingMapData.value = true
  const { error } = await saveMapData(labels.value, borders.value, planets.value, ships.value)
  isSavingMapData.value = false

  if (error) {
    mapDataError.value = error.message
    return
  }

  mapDataMessage.value = 'Map overlays saved.'
}

onMounted(async () => {
  const { session: activeSession, error } = await getSession()

  if (error) {
    mapDataError.value = error.message
  }

  session.value = activeSession
  await loadOverlays()

  unsubscribe = onAuthStateChange((activeSession) => {
    session.value = activeSession

    if (!isAdminSession(activeSession)) {
      isEditorOpen.value = false
      overlayDrag.value = null
      addPointMode.value = false
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<template>
  <main class="map-page">
    <div class="map-attribution">
      <span>
        Map image:
        <a href="https://www.deviantart.com/rexxaakobra/art/star-wars-ulitme-galaxy-map-version-0-01-594236326" target="_blank" rel="noreferrer">
          star wars ulitme galaxy map version 0.01
        </a>
        by
        <a href="https://www.deviantart.com/rexxaakobra" target="_blank" rel="noreferrer">RexxaaKobra</a>,
        licensed under
        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>.
      </span>
    </div>

    <section
      ref="viewportRef"
      class="map-viewport"
      aria-label="Pan and zoom galactic map"
      @wheel.prevent="handleWheel"
      @pointerdown="startPan"
      @pointermove="pan"
      @pointerup="endPan"
      @pointercancel="endPan"
      @pointerleave="endPan"
      @click="handleMapClick"
    >
      <div class="map-layer" :style="mapTransform" @pointermove="dragOverlay">
        <img class="map-image" :src="mapImageUrl" alt="Star Wars galaxy map by RexxaaKobra" draggable="false" />

        <svg class="map-overlay" :viewBox="`0 0 ${mapSize.width} ${mapSize.height}`" aria-hidden="true">
          <g v-for="border in borders" :key="border.id">
            <polygon
              class="map-border-fill"
              :class="{ 'map-overlay-hotspot': isAdmin, 'map-overlay-selected': isAdmin && selectedId === border.id }"
              :points="border.points.map((point) => `${point.x},${point.y}`).join(' ')"
              :fill="border.color"
              :stroke="border.color"
              :stroke-width="isAdmin && selectedId === border.id ? border.width + 6 : border.width"
              :style="{ pointerEvents: isAdmin ? 'auto' : 'none' }"
              @pointerdown="selectBorder($event, border)"
              @click="handleOverlayClick"
            />
            <template v-if="isAdmin && selectedId === border.id">
              <circle
                v-for="(point, pointIndex) in border.points"
                :key="`${border.id}-${pointIndex}`"
                class="map-border-point map-overlay-hotspot"
                :cx="point.x"
                :cy="point.y"
                :r="border.nodeSize"
                :style="{ pointerEvents: isAdmin ? 'auto' : 'none' }"
                @pointerdown="startPointDrag($event, border, pointIndex)"
                @click="handleOverlayClick"
              />
            </template>
          </g>

          <g
            v-for="planet in planets"
            :key="planet.id"
            class="map-planet"
            :class="{ 'map-overlay-hotspot': isAdmin, 'map-overlay-selected': isAdmin && selectedId === planet.id }"
            :style="{ pointerEvents: isAdmin ? 'auto' : 'none', opacity: planet.opacity ?? 1 }"
            @pointerdown="startPlanetDrag($event, planet)"
            @click="handleOverlayClick"
          >
            <circle
              class="map-planet-dot"
              :cx="planet.x"
              :cy="planet.y"
              :r="planet.radius"
              :fill="planet.color"
            />
            <text
              class="map-planet-label"
              :x="planet.x"
              :y="planet.y + planet.radius + planet.labelSize + 8"
              :fill="planet.labelColor"
              :font-size="planet.labelSize"
            >
              {{ planet.name }}
            </text>
          </g>

          <g
            v-for="ship in ships"
            :key="ship.id"
            class="map-ship"
            :class="{ 'map-overlay-hotspot': isAdmin, 'map-overlay-selected': isAdmin && selectedId === ship.id }"
            :style="{ pointerEvents: isAdmin ? 'auto' : 'none', opacity: ship.opacity ?? 1 }"
            @pointerdown="startShipDrag($event, ship)"
            @click="handleOverlayClick"
          >
            <path
              class="map-ship-icon"
              :d="`M ${ship.x} ${ship.y - ship.size} L ${ship.x + ship.size * 0.68} ${ship.y + ship.size * 0.82} L ${ship.x} ${ship.y + ship.size * 0.42} L ${ship.x - ship.size * 0.68} ${ship.y + ship.size * 0.82} Z`"
              :fill="ship.color"
              :transform="`rotate(${ship.rotation || 0} ${ship.x} ${ship.y})`"
            />
            <text
              class="map-ship-label"
              :x="ship.x"
              :y="ship.y + ship.size + ship.labelSize + 10"
              :fill="ship.labelColor"
              :font-size="ship.labelSize"
            >
              {{ ship.name }}
            </text>
          </g>
        </svg>

        <button
          v-for="label in labels"
          :key="label.id"
          type="button"
          class="map-label"
          :class="{ 'map-overlay-hotspot': isAdmin, 'map-overlay-selected': isAdmin && selectedId === label.id }"
          :style="{ left: `${label.x}px`, top: `${label.y}px`, color: label.color, fontSize: `${label.size}px`, opacity: label.opacity ?? 1, pointerEvents: isAdmin ? 'auto' : 'none' }"
          :tabindex="isAdmin ? 0 : -1"
          @pointerdown="startLabelDrag($event, label)"
          @click="handleOverlayClick"
        >
          {{ label.text }}
        </button>
      </div>
    </section>

    <aside v-if="isAdmin && isEditorOpen" class="map-editor">
      <div class="map-editor-header">
        <h2>Map Overlays</h2>
        <button type="button" aria-label="Close overlay editor" @click="isEditorOpen = false">x</button>
      </div>

      <div class="map-editor-actions">
        <button type="button" :disabled="isLoadingMapData || isSavingMapData" @click="addLabel">Add Label</button>
        <button type="button" :disabled="isLoadingMapData || isSavingMapData" @click="addBorder">Add Border</button>
        <button type="button" :disabled="isLoadingMapData || isSavingMapData" @click="addPlanet">Add Planet</button>
        <button type="button" :disabled="isLoadingMapData || isSavingMapData" @click="addShip">Add Ship</button>
        <button type="button" :disabled="isLoadingMapData || isSavingMapData" @click="saveOverlays">
          {{ isSavingMapData ? 'Saving...' : 'Save' }}
        </button>
        <button type="button" :disabled="isLoadingMapData || isSavingMapData" @click="loadOverlays">
          {{ isLoadingMapData ? 'Loading...' : 'Reload' }}
        </button>
      </div>

      <p v-if="mapDataError" class="map-editor-message map-editor-message-error">{{ mapDataError }}</p>
      <p v-else-if="mapDataMessage" class="map-editor-message">{{ mapDataMessage }}</p>

      <label v-if="labels.length || borders.length || planets.length || ships.length">
        <span>Selection</span>
        <select v-model="selectedId" @change="updateSelectionType">
          <optgroup label="Labels">
            <option v-for="label in labels" :key="label.id" :value="label.id">{{ label.text }}</option>
          </optgroup>
          <optgroup label="Borders">
            <option v-for="border in borders" :key="border.id" :value="border.id">{{ border.name }}</option>
          </optgroup>
          <optgroup label="Planets">
            <option v-for="planet in planets" :key="planet.id" :value="planet.id">{{ planet.name }}</option>
          </optgroup>
          <optgroup label="Ships">
            <option v-for="ship in ships" :key="ship.id" :value="ship.id">{{ ship.name }}</option>
          </optgroup>
        </select>
      </label>
      <p v-else class="map-editor-empty">No overlays loaded yet.</p>

      <div v-if="selectedLabel" class="map-editor-fields">
        <label>
          <span>Label</span>
          <input v-model="selectedLabel.text" type="text" />
        </label>
        <label>
          <span>Color</span>
          <input v-model="selectedLabel.color" type="color" />
        </label>
        <label>
          <span>Size</span>
          <input v-model.number="selectedLabel.size" type="number" min="12" max="96" />
        </label>
        <label>
          <span>Transparency</span>
          <input v-model.number="selectedLabel.opacity" type="range" min="0.1" max="1" step="0.05" />
        </label>
      </div>

      <div v-if="selectedBorder" class="map-editor-fields">
        <label>
          <span>Border Name</span>
          <input v-model="selectedBorder.name" type="text" />
        </label>
        <label>
          <span>Color</span>
          <input v-model="selectedBorder.color" type="color" />
        </label>
        <label>
          <span>Border Width</span>
          <input v-model.number="selectedBorder.width" type="number" min="1" max="80" />
        </label>
        <label>
          <span>Edit Node Size</span>
          <input v-model.number="selectedBorder.nodeSize" type="number" min="4" max="80" />
        </label>
        <label class="map-editor-toggle">
          <input v-model="addPointMode" type="checkbox" />
          <span>Add points by clicking map</span>
        </label>
        <button type="button" @click="deleteLastPoint">Remove Last Point</button>
      </div>

      <div v-if="selectedPlanet" class="map-editor-fields">
        <label>
          <span>Planet Name</span>
          <input v-model="selectedPlanet.name" type="text" />
        </label>
        <label>
          <span>Planet Color</span>
          <input v-model="selectedPlanet.color" type="color" />
        </label>
        <label>
          <span>Label Color</span>
          <input v-model="selectedPlanet.labelColor" type="color" />
        </label>
        <label>
          <span>Radius</span>
          <input v-model.number="selectedPlanet.radius" type="number" min="4" max="120" />
        </label>
        <label>
          <span>Label Size</span>
          <input v-model.number="selectedPlanet.labelSize" type="number" min="10" max="96" />
        </label>
        <label>
          <span>Transparency</span>
          <input v-model.number="selectedPlanet.opacity" type="range" min="0.1" max="1" step="0.05" />
        </label>
      </div>

      <div v-if="selectedShip" class="map-editor-fields">
        <label>
          <span>Ship Name</span>
          <input v-model="selectedShip.name" type="text" />
        </label>
        <label>
          <span>Ship Color</span>
          <input v-model="selectedShip.color" type="color" />
        </label>
        <label>
          <span>Label Color</span>
          <input v-model="selectedShip.labelColor" type="color" />
        </label>
        <label>
          <span>Icon Size</span>
          <input v-model.number="selectedShip.size" type="number" min="8" max="140" />
        </label>
        <label>
          <span>Label Size</span>
          <input v-model.number="selectedShip.labelSize" type="number" min="10" max="96" />
        </label>
        <label>
          <span>Rotation</span>
          <input v-model.number="selectedShip.rotation" type="range" min="0" max="359" step="1" />
        </label>
        <label>
          <span>Transparency</span>
          <input v-model.number="selectedShip.opacity" type="range" min="0.1" max="1" step="0.05" />
        </label>
      </div>

      <button class="map-editor-delete" type="button" @click="deleteSelected">Delete Selected</button>

      <label>
        <span>Current Overlay JSON</span>
        <textarea :value="overlayData" readonly rows="8"></textarea>
      </label>
    </aside>

    <button v-else-if="isAdmin" class="map-editor-toggle-button" type="button" @click="isEditorOpen = true">Overlays</button>

    <div class="map-controls" aria-label="Map controls">
      <button type="button" aria-label="Zoom out" @click="zoomOut">-</button>
      <button type="button" aria-label="Reset map" @click="resetMap">Reset</button>
      <button type="button" aria-label="Zoom in" @click="zoomIn">+</button>
    </div>
  </main>
</template>
