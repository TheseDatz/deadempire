<script setup>
import { ref } from 'vue'
import { createBestiaryNpc } from '../services/bestiary'
import { createFaction } from '../services/factions'
import { createPlanet } from '../services/planets'
import {
  exportCharacterSheetBackup,
  isSupabaseConfigured,
} from '../services/characterSheets'

const isWorking = ref(false)
const isSavingNpc = ref(false)
const isSavingFaction = ref(false)
const isSavingPlanet = ref(false)
const isNpcModalOpen = ref(false)
const isFactionModalOpen = ref(false)
const isPlanetModalOpen = ref(false)
const message = ref('')
const errorMessage = ref('')
const npcForm = ref(createBlankNpcForm())
const factionForm = ref(createBlankFactionForm())
const planetForm = ref(createBlankPlanetForm())

function createBlankNpcForm() {
  return {
    role: '',
    name: '',
    move: '',
    description: '',
    attributes: '',
    skills: [''],
    gear: [''],
  }
}

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

function clearFeedback() {
  message.value = ''
  errorMessage.value = ''
}

function openNpcModal() {
  clearFeedback()
  npcForm.value = createBlankNpcForm()
  isNpcModalOpen.value = true
}

function closeNpcModal() {
  if (isSavingNpc.value) {
    return
  }

  isNpcModalOpen.value = false
}

function openFactionModal() {
  clearFeedback()
  factionForm.value = createBlankFactionForm()
  isFactionModalOpen.value = true
}

function closeFactionModal() {
  if (isSavingFaction.value) {
    return
  }

  isFactionModalOpen.value = false
}

function openPlanetModal() {
  clearFeedback()
  planetForm.value = createBlankPlanetForm()
  isPlanetModalOpen.value = true
}

function closePlanetModal() {
  if (isSavingPlanet.value) {
    return
  }

  isPlanetModalOpen.value = false
}

function addListItem(listName) {
  npcForm.value[listName].push('')
}

function removeListItem(listName, index) {
  npcForm.value[listName].splice(index, 1)

  if (!npcForm.value[listName].length) {
    npcForm.value[listName].push('')
  }
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

function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadCharacterBackup() {
  clearFeedback()
  isWorking.value = true

  const { data, error } = await exportCharacterSheetBackup()

  if (error) {
    errorMessage.value = error.message
  } else {
    downloadJson('dead-empire-character-sheets-backup.json', {
      exportedAt: new Date().toISOString(),
      character_sheets: data,
    })
    message.value = `Downloaded ${data.length} character sheet backup ${data.length === 1 ? 'row' : 'rows'}.`
  }

  isWorking.value = false
}

async function saveBestiaryNpc() {
  clearFeedback()
  isSavingNpc.value = true

  const { npc, error } = await createBestiaryNpc(npcForm.value)

  if (error) {
    errorMessage.value = error.message
  } else {
    message.value = `Added ${npc.name} to the bestiary.`
    npcForm.value = createBlankNpcForm()
    isNpcModalOpen.value = false
  }

  isSavingNpc.value = false
}

async function saveFaction() {
  clearFeedback()
  isSavingFaction.value = true

  const { faction, error } = await createFaction(factionForm.value)

  if (error) {
    errorMessage.value = error.message
  } else {
    message.value = `Added ${faction.name} to the factions index.`
    factionForm.value = createBlankFactionForm()
    isFactionModalOpen.value = false
  }

  isSavingFaction.value = false
}

async function savePlanet() {
  clearFeedback()
  isSavingPlanet.value = true

  const { planet, error } = await createPlanet(planetForm.value)

  if (error) {
    errorMessage.value = error.message
  } else {
    message.value = `Added ${planet.name} to the planets index.`
    planetForm.value = createBlankPlanetForm()
    isPlanetModalOpen.value = false
  }

  isSavingPlanet.value = false
}

</script>

<template>
  <main class="admin-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-5xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Command Access</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Admin</h1>

      <section class="admin-panel mt-10">
        <h2>Character Sheet Database</h2>

        <p v-if="!isSupabaseConfigured" class="profile-message profile-message-error mt-5">
          Supabase environment variables are not configured for this build.
        </p>

        <template v-else>
          <p class="admin-copy mt-3">
            Character sheets are stored in Supabase as JSON. Download a backup before large edits.
          </p>

          <div class="admin-actions mt-6">
            <button class="profile-button" type="button" :disabled="isWorking" @click="downloadCharacterBackup">
              Download Backup
            </button>
            <button class="profile-button" type="button" @click="openNpcModal">
              Add Bestiary NPC
            </button>
            <button class="profile-button" type="button" @click="openPlanetModal">
              Add Planet
            </button>
            <button class="profile-button" type="button" @click="openFactionModal">
              Add Faction
            </button>
          </div>

        </template>

        <p v-if="message" class="profile-message mt-5">{{ message }}</p>
        <p v-if="errorMessage" class="profile-message profile-message-error mt-5">{{ errorMessage }}</p>
      </section>
    </section>

    <div v-if="isNpcModalOpen" class="admin-modal-backdrop" role="presentation" @click.self="closeNpcModal">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="bestiary-npc-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Opposition Archive</p>
            <h2 id="bestiary-npc-title">Add Bestiary NPC</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingNpc" @click="closeNpcModal">
            x
          </button>
        </div>

        <form class="admin-import-form mt-6" @submit.prevent="saveBestiaryNpc">
          <div class="admin-form-grid">
            <label>
              <span>Role</span>
              <input v-model="npcForm.role" type="text" required placeholder="Empire" />
            </label>

            <label>
              <span>Name</span>
              <input v-model="npcForm.name" type="text" required placeholder="Imperial Trooper" />
            </label>

            <label>
              <span>Move</span>
              <input v-model="npcForm.move" type="text" placeholder="10" />
            </label>
          </div>

          <label>
            <span>Description</span>
            <textarea v-model="npcForm.description" rows="3" placeholder="Standard enforcer of the regime."></textarea>
          </label>

          <label>
            <span>Attributes</span>
            <textarea v-model="npcForm.attributes" rows="4" placeholder="All stats 2D except Dexterity 3D."></textarea>
          </label>

          <section class="admin-list-editor">
            <div class="admin-list-editor-header">
              <span>Skills</span>
              <button class="profile-button profile-button-secondary" type="button" @click="addListItem('skills')">
                Add Skill
              </button>
            </div>

            <div v-for="(_skill, index) in npcForm.skills" :key="`skill-${index}`" class="admin-list-row">
              <input v-model="npcForm.skills[index]" type="text" placeholder="Blaster 4D" />
              <button
                class="profile-button profile-button-secondary"
                type="button"
                :disabled="npcForm.skills.length === 1 && !npcForm.skills[0]"
                @click="removeListItem('skills', index)"
              >
                Remove
              </button>
            </div>
          </section>

          <section class="admin-list-editor">
            <div class="admin-list-editor-header">
              <span>Gear</span>
              <button class="profile-button profile-button-secondary" type="button" @click="addListItem('gear')">
                Add Gear
              </button>
            </div>

            <div v-for="(_item, index) in npcForm.gear" :key="`gear-${index}`" class="admin-list-row">
              <input v-model="npcForm.gear[index]" type="text" placeholder="Blaster rifle: 5D damage" />
              <button
                class="profile-button profile-button-secondary"
                type="button"
                :disabled="npcForm.gear.length === 1 && !npcForm.gear[0]"
                @click="removeListItem('gear', index)"
              >
                Remove
              </button>
            </div>
          </section>

          <div class="admin-actions">
            <button class="profile-button" type="submit" :disabled="isSavingNpc">
              {{ isSavingNpc ? 'Saving...' : 'Save NPC' }}
            </button>
            <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingNpc" @click="closeNpcModal">
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="isPlanetModalOpen" class="admin-modal-backdrop" role="presentation" @click.self="closePlanetModal">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="planet-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Astrogation Index</p>
            <h2 id="planet-title">Add Planet</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingPlanet" @click="closePlanetModal">
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
              {{ isSavingPlanet ? 'Saving...' : 'Save Planet' }}
            </button>
            <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingPlanet" @click="closePlanetModal">
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>

    <div v-if="isFactionModalOpen" class="admin-modal-backdrop" role="presentation" @click.self="closeFactionModal">
      <section class="admin-modal" role="dialog" aria-modal="true" aria-labelledby="faction-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Political Index</p>
            <h2 id="faction-title">Add Faction</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingFaction" @click="closeFactionModal">
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
              {{ isSavingFaction ? 'Saving...' : 'Save Faction' }}
            </button>
            <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingFaction" @click="closeFactionModal">
              Cancel
            </button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>
