<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSession, isAdminSession, onAuthStateChange } from '../services/auth'
import { loadFactions, updateFaction } from '../services/factions'

const searchTerm = ref('')
const selectedHostility = ref('All')
const factions = ref([])
const isLoading = ref(true)
const isSavingFaction = ref(false)
const isEditModalOpen = ref(false)
const editingFactionId = ref('')
const session = ref(null)
const loadErrorMessage = ref('')
const editErrorMessage = ref('')
const editMessage = ref('')
const factionForm = ref(createBlankFactionForm())
let unsubscribe = null

const isAdmin = computed(() => isAdminSession(session.value))
const hostilityLevels = computed(() => [
  'All',
  ...new Set(factions.value.map((faction) => faction.hostility).filter(Boolean)),
])

const filteredFactions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return factions.value.filter((faction) => {
    const matchesHostility =
      selectedHostility.value === 'All' || faction.hostility === selectedHostility.value
    const haystack = [
      faction.name,
      faction.capitalPlanet,
      faction.hostility,
      faction.currentLeader,
      faction.description,
      faction.notes,
    ]
      .join(' ')
      .toLowerCase()

    return matchesHostility && (!query || haystack.includes(query))
  })
})

function createBlankFactionForm() {
  return {
    name: '',
    borderColor: '#4fc3ff',
    capitalPlanet: '',
    hostility: '',
    currentLeader: '',
    description: '',
    notes: '',
  }
}

function factionToForm(faction) {
  return {
    name: faction.name || '',
    borderColor: faction.borderColor || '#4fc3ff',
    capitalPlanet: faction.capitalPlanet || '',
    hostility: faction.hostility || '',
    currentLeader: faction.currentLeader || '',
    description: faction.description || '',
    notes: faction.notes || '',
  }
}

async function refreshFactions() {
  isLoading.value = true
  loadErrorMessage.value = ''

  const { factions: loadedFactions, error } = await loadFactions()

  if (error) {
    loadErrorMessage.value = error.message
  } else {
    factions.value = loadedFactions
  }

  isLoading.value = false
}

function clearEditFeedback() {
  editMessage.value = ''
  editErrorMessage.value = ''
}

function openEditModal(faction) {
  clearEditFeedback()
  editingFactionId.value = faction.id
  factionForm.value = factionToForm(faction)
  isEditModalOpen.value = true
}

function closeEditModal() {
  if (isSavingFaction.value) {
    return
  }

  isEditModalOpen.value = false
  editingFactionId.value = ''
}

async function saveFaction() {
  clearEditFeedback()
  isSavingFaction.value = true

  const { faction, error } = await updateFaction(editingFactionId.value, factionForm.value)

  if (error) {
    editErrorMessage.value = error.message
  } else {
    const index = factions.value.findIndex((existingFaction) => existingFaction.id === faction.id)

    if (index >= 0) {
      factions.value.splice(index, 1, faction)
    }

    editMessage.value = `Updated ${faction.name}.`
    isEditModalOpen.value = false
    editingFactionId.value = ''
  }

  isSavingFaction.value = false
}

onMounted(async () => {
  const { session: activeSession, error } = await getSession()

  if (error) {
    loadErrorMessage.value = error.message
  }

  session.value = activeSession
  await refreshFactions()

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
  <main class="factions-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Political Index</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Factions</h1>

      <section class="bestiary-tools mt-10">
        <label>
          <span>Search Factions</span>
          <input v-model="searchTerm" type="search" placeholder="Search ISB, Coruscant, hostile..." />
        </label>

        <label>
          <span>Filter Hostility</span>
          <select v-model="selectedHostility">
            <option v-for="hostility in hostilityLevels" :key="hostility">{{ hostility }}</option>
          </select>
        </label>
      </section>

      <p v-if="isLoading" class="profile-message mt-8">Loading faction records...</p>
      <p v-else-if="loadErrorMessage" class="profile-message profile-message-error mt-8">{{ loadErrorMessage }}</p>
      <p v-else-if="!filteredFactions.length" class="profile-message mt-8">No faction records found.</p>

      <section v-else class="faction-grid mt-8">
        <article
          v-for="faction in filteredFactions"
          :key="faction.id || faction.name"
          class="faction-card"
          :style="{ borderColor: faction.borderColor }"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="faction-hostility-row">
                <p class="faction-hostility">{{ faction.hostility }}</p>
                <button
                  v-if="isAdmin"
                  class="faction-edit-button"
                  type="button"
                  @click="openEditModal(faction)"
                >
                  Edit
                </button>
              </div>
              <h2>{{ faction.name }}</h2>
            </div>
            <span class="faction-capital">{{ faction.capitalPlanet }}</span>
          </div>

          <dl class="faction-facts mt-5">
            <div>
              <dt>Current Leader</dt>
              <dd>{{ faction.currentLeader }}</dd>
            </div>
            <div>
              <dt>Capital Planet</dt>
              <dd>{{ faction.capitalPlanet }}</dd>
            </div>
          </dl>

          <section class="mt-5">
            <h3>Description</h3>
            <p class="mt-2 text-cyan-100/80">{{ faction.description }}</p>
          </section>

          <section class="mt-5">
            <h3>Notes</h3>
            <p class="mt-2 text-cyan-100/80">{{ faction.notes }}</p>
          </section>
        </article>
      </section>

      <p v-if="editMessage" class="profile-message mt-5">{{ editMessage }}</p>
    </section>

    <div v-if="isEditModalOpen" class="admin-modal-backdrop" role="presentation" @click.self="closeEditModal">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="faction-edit-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Political Index</p>
            <h2 id="faction-edit-title">Edit Faction</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingFaction" @click="closeEditModal">
            x
          </button>
        </div>

        <form class="admin-import-form mt-6" @submit.prevent="saveFaction">
          <div class="admin-form-grid">
            <label>
              <span>Name</span>
              <input v-model="factionForm.name" type="text" required placeholder="Imperial Security Bureau" />
            </label>

            <label>
              <span>Capital Planet</span>
              <input v-model="factionForm.capitalPlanet" type="text" placeholder="Coruscant" />
            </label>

            <label>
              <span>Border Color</span>
              <input v-model="factionForm.borderColor" type="color" />
            </label>
          </div>

          <div class="admin-form-grid admin-form-grid-two">
            <label>
              <span>Hostility</span>
              <input v-model="factionForm.hostility" type="text" placeholder="Hostile" />
            </label>

            <label>
              <span>Current Leader</span>
              <input v-model="factionForm.currentLeader" type="text" placeholder="Grand Vizier Mas Amedda" />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea v-model="factionForm.description" rows="4" placeholder="Faction description"></textarea>
          </label>

          <label>
            <span>Notes</span>
            <textarea v-model="factionForm.notes" rows="4" placeholder="Faction notes"></textarea>
          </label>

          <div class="admin-actions">
            <button class="profile-button" type="submit" :disabled="isSavingFaction">
              {{ isSavingFaction ? 'Saving...' : 'Save Changes' }}
            </button>
            <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingFaction" @click="closeEditModal">
              Cancel
            </button>
          </div>

          <p v-if="editErrorMessage" class="profile-message profile-message-error">{{ editErrorMessage }}</p>
        </form>
      </section>
    </div>
  </main>
</template>
