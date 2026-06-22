<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSession, isAdminSession, onAuthStateChange } from '../services/auth'
import { loadPlanets, updatePlanet } from '../services/planets'

const searchTerm = ref('')
const selectedStatus = ref('All')
const planets = ref([])
const isLoading = ref(true)
const isSavingPlanet = ref(false)
const isEditModalOpen = ref(false)
const editingPlanetId = ref('')
const session = ref(null)
const loadErrorMessage = ref('')
const editErrorMessage = ref('')
const editMessage = ref('')
const planetForm = ref(createBlankPlanetForm())
let unsubscribe = null

const isAdmin = computed(() => isAdminSession(session.value))
const statuses = computed(() => ['All', ...new Set(planets.value.map((planet) => planet.status).filter(Boolean))])

const filteredPlanets = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return planets.value.filter((planet) => {
    const matchesStatus = selectedStatus.value === 'All' || planet.status === selectedStatus.value
    const haystack = [
      planet.name,
      planet.region,
      planet.status,
      planet.notes,
      ...planet.moons.flatMap((moon) => [moon.name, moon.description]),
      ...planet.locations.flatMap((location) => [location.name, location.description]),
    ]
      .join(' ')
      .toLowerCase()

    return matchesStatus && (!query || haystack.includes(query))
  })
})

function createBlankPlanetForm() {
  return {
    name: '',
    region: '',
    color: '#4fc3ff',
    status: '',
    moons: [{ name: '', description: '' }],
    locations: [{ name: '', description: '' }],
    notes: '',
  }
}

function cloneDetailList(list) {
  const cloned = list.map((item) => ({
    name: item.name || '',
    description: item.description || '',
  }))

  return cloned.length ? cloned : [{ name: '', description: '' }]
}

function planetToForm(planet) {
  return {
    name: planet.name || '',
    region: planet.region || '',
    color: planet.color || '#4fc3ff',
    status: planet.status || '',
    moons: cloneDetailList(planet.moons || []),
    locations: cloneDetailList(planet.locations || []),
    notes: planet.notes || '',
  }
}

async function refreshPlanets() {
  isLoading.value = true
  loadErrorMessage.value = ''

  const { planets: loadedPlanets, error } = await loadPlanets()

  if (error) {
    loadErrorMessage.value = error.message
  } else {
    planets.value = loadedPlanets
  }

  isLoading.value = false
}

function clearEditFeedback() {
  editMessage.value = ''
  editErrorMessage.value = ''
}

function openEditModal(planet) {
  clearEditFeedback()
  editingPlanetId.value = planet.id
  planetForm.value = planetToForm(planet)
  isEditModalOpen.value = true
}

function closeEditModal() {
  if (isSavingPlanet.value) {
    return
  }

  isEditModalOpen.value = false
  editingPlanetId.value = ''
}

function addPlanetDetail(listName) {
  planetForm.value[listName].push({ name: '', description: '' })
}

function removePlanetDetail(listName, index) {
  planetForm.value[listName].splice(index, 1)

  if (!planetForm.value[listName].length) {
    planetForm.value[listName].push({ name: '', description: '' })
  }
}

async function savePlanet() {
  clearEditFeedback()
  isSavingPlanet.value = true

  const { planet, error } = await updatePlanet(editingPlanetId.value, planetForm.value)

  if (error) {
    editErrorMessage.value = error.message
  } else {
    const index = planets.value.findIndex((existingPlanet) => existingPlanet.id === planet.id)

    if (index >= 0) {
      planets.value.splice(index, 1, planet)
    }

    editMessage.value = `Updated ${planet.name}.`
    isEditModalOpen.value = false
    editingPlanetId.value = ''
  }

  isSavingPlanet.value = false
}

onMounted(async () => {
  const { session: activeSession, error } = await getSession()

  if (error) {
    loadErrorMessage.value = error.message
  }

  session.value = activeSession
  await refreshPlanets()

  unsubscribe = onAuthStateChange((activeSession) => {
    session.value = activeSession
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<template>
  <main class="planets-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Astrogation Index</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Planets</h1>

      <section class="bestiary-tools mt-10">
        <label>
          <span>Search Planets</span>
          <input v-model="searchTerm" type="search" placeholder="Search Coruscant, palace, Core Worlds..." />
        </label>

        <label>
          <span>Filter Status</span>
          <select v-model="selectedStatus">
            <option v-for="status in statuses" :key="status">{{ status }}</option>
          </select>
        </label>
      </section>

      <p v-if="isLoading" class="profile-message mt-8">Loading planet records...</p>
      <p v-else-if="loadErrorMessage" class="profile-message profile-message-error mt-8">{{ loadErrorMessage }}</p>
      <p v-else-if="!filteredPlanets.length" class="profile-message mt-8">No planet records found.</p>

      <section v-else class="planet-grid mt-8">
        <article v-for="planet in filteredPlanets" :key="planet.id || planet.name" class="planet-card">
          <div class="planet-card-header">
            <span class="planet-orb" :style="{ background: planet.color }" />
            <div>
              <h2>{{ planet.name }}</h2>
              <p>{{ planet.region }}</p>
            </div>
            <button
              v-if="isAdmin"
              class="planet-edit-button"
              type="button"
              @click="openEditModal(planet)"
            >
              Edit
            </button>
          </div>

          <p class="planet-status mt-5">{{ planet.status }}</p>

          <div class="planet-detail-grid mt-5">
            <section>
              <h3>Moons / Satellites</h3>
              <dl>
                <template v-for="moon in planet.moons" :key="moon.name">
                  <dt>{{ moon.name }}</dt>
                  <dd>{{ moon.description }}</dd>
                </template>
              </dl>
            </section>

            <section>
              <h3>Locations</h3>
              <dl>
                <template v-for="location in planet.locations" :key="location.name">
                  <dt>{{ location.name }}</dt>
                  <dd>{{ location.description }}</dd>
                </template>
              </dl>
            </section>
          </div>

          <section class="mt-5">
            <h3>Notes</h3>
            <p class="mt-2 text-cyan-100/80">{{ planet.notes }}</p>
          </section>
        </article>
      </section>

      <p v-if="editMessage" class="profile-message mt-5">{{ editMessage }}</p>
    </section>

    <div v-if="isEditModalOpen" class="admin-modal-backdrop" role="presentation" @click.self="closeEditModal">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="planet-edit-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Astrogation Index</p>
            <h2 id="planet-edit-title">Edit Planet</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingPlanet" @click="closeEditModal">
            x
          </button>
        </div>

        <form class="admin-import-form mt-6" @submit.prevent="savePlanet">
          <div class="admin-form-grid">
            <label>
              <span>Name</span>
              <input v-model="planetForm.name" type="text" required placeholder="Coruscant" />
            </label>

            <label>
              <span>Region</span>
              <input v-model="planetForm.region" type="text" placeholder="Core Worlds" />
            </label>

            <label>
              <span>Color</span>
              <input v-model="planetForm.color" type="color" />
            </label>
          </div>

          <label>
            <span>Status</span>
            <input v-model="planetForm.status" type="text" placeholder="Occupied by Imperial Security Bureau" />
          </label>

          <section class="admin-list-editor">
            <div class="admin-list-editor-header">
              <span>Moons / Satellites</span>
              <button class="profile-button profile-button-secondary" type="button" @click="addPlanetDetail('moons')">
                Add Moon
              </button>
            </div>

            <div v-for="(_moon, index) in planetForm.moons" :key="`moon-${index}`" class="admin-detail-row">
              <input v-model="planetForm.moons[index].name" type="text" placeholder="Habitation Spheres" />
              <textarea v-model="planetForm.moons[index].description" rows="2" placeholder="Description"></textarea>
              <button
                class="profile-button profile-button-secondary"
                type="button"
                :disabled="planetForm.moons.length === 1 && !planetForm.moons[0].name && !planetForm.moons[0].description"
                @click="removePlanetDetail('moons', index)"
              >
                Remove
              </button>
            </div>
          </section>

          <section class="admin-list-editor">
            <div class="admin-list-editor-header">
              <span>Locations</span>
              <button class="profile-button profile-button-secondary" type="button" @click="addPlanetDetail('locations')">
                Add Location
              </button>
            </div>

            <div v-for="(_location, index) in planetForm.locations" :key="`location-${index}`" class="admin-detail-row">
              <input v-model="planetForm.locations[index].name" type="text" placeholder="Imperial Palace" />
              <textarea v-model="planetForm.locations[index].description" rows="2" placeholder="Description"></textarea>
              <button
                class="profile-button profile-button-secondary"
                type="button"
                :disabled="planetForm.locations.length === 1 && !planetForm.locations[0].name && !planetForm.locations[0].description"
                @click="removePlanetDetail('locations', index)"
              >
                Remove
              </button>
            </div>
          </section>

          <label>
            <span>Notes</span>
            <textarea v-model="planetForm.notes" rows="4" placeholder="A city-world under immense surveillance..."></textarea>
          </label>

          <div class="admin-actions">
            <button class="profile-button" type="submit" :disabled="isSavingPlanet">
              {{ isSavingPlanet ? 'Saving...' : 'Save Changes' }}
            </button>
            <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingPlanet" @click="closeEditModal">
              Cancel
            </button>
          </div>

          <p v-if="editErrorMessage" class="profile-message profile-message-error">{{ editErrorMessage }}</p>
        </form>
      </section>
    </div>
  </main>
</template>
