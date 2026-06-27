<script setup>
import { computed, onMounted, ref } from 'vue'
import ContentBlockEditor from '../components/ContentBlockEditor.vue'
import ContentBlockPreview from '../components/ContentBlockPreview.vue'
import ContentBlockRenderer from '../components/ContentBlockRenderer.vue'
import { createArc, deleteArc, loadArcs, updateArc } from '../services/arcs'
import { createBestiaryNpc } from '../services/bestiary'
import { createFaction } from '../services/factions'
import { createPlanet } from '../services/planets'
import {
  exportCharacterSheetBackup,
  isSupabaseConfigured,
} from '../services/characterSheets'
import {
  createBlankBlockList,
  findInvalidImageBlock,
  formBlocksFromContent,
  normalizeDelimitedList,
  normalizeEditorBlocks,
  slugify,
} from '../services/contentBlocks'

const isWorking = ref(false)
const isSavingNpc = ref(false)
const isSavingFaction = ref(false)
const isSavingPlanet = ref(false)
const isLoadingArcs = ref(true)
const isSavingArc = ref(false)
const isDeletingArc = ref(false)
const isNpcModalOpen = ref(false)
const isFactionModalOpen = ref(false)
const isPlanetModalOpen = ref(false)
const isArcModalOpen = ref(false)
const message = ref('')
const errorMessage = ref('')
const arcMessage = ref('')
const arcErrorMessage = ref('')
const arcEditorErrorMessage = ref('')
const arcSearchTerm = ref('')
const selectedArcTag = ref('All')
const arcs = ref([])
const selectedArc = ref(null)
const editingArcSlug = ref('')
const npcForm = ref(createBlankNpcForm())
const factionForm = ref(createBlankFactionForm())
const planetForm = ref(createBlankPlanetForm())
const arcForm = ref(createBlankArcForm())

const arcTags = computed(() => [
  'All',
  ...new Set(arcs.value.flatMap((arc) => arc.tags)),
].sort((first, second) => {
  if (first === 'All') return -1
  if (second === 'All') return 1
  return first.localeCompare(second)
}))

const filteredArcs = computed(() => {
  const query = arcSearchTerm.value.trim().toLowerCase()

  return arcs.value.filter((arc) => {
    const matchesTag = selectedArcTag.value === 'All' || arc.tags.includes(selectedArcTag.value)
    const blockText = arc.contentBlocks.flatMap((block) => {
      if (block.type === 'image') return [block.url, block.alt]
      if (block.type === 'accordion') return block.items.flatMap((item) => [item.title, item.content])
      if (block.type === 'reference') {
        return [block.title, block.content, ...block.sections.flatMap((section) => [section.title, section.content])]
      }
      return [block.content]
    })
    const haystack = [arc.date, arc.title, ...arc.tags, ...arc.body, ...blockText].join(' ').toLowerCase()

    return matchesTag && (!query || haystack.includes(query))
  })
})

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

function createBlankArcForm() {
  return {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    tags: '',
    blocks: createBlankBlockList(),
  }
}

function clearFeedback() {
  message.value = ''
  errorMessage.value = ''
}

function clearArcFeedback() {
  arcMessage.value = ''
  arcErrorMessage.value = ''
  arcEditorErrorMessage.value = ''
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

function openNewArcModal() {
  clearArcFeedback()
  editingArcSlug.value = ''
  arcForm.value = createBlankArcForm()
  isArcModalOpen.value = true
}

function openArcViewer(arc) {
  selectedArc.value = arc
}

function closeArcViewer() {
  selectedArc.value = null
}

function openEditArcModal(arc) {
  clearArcFeedback()
  editingArcSlug.value = arc.slug
  arcForm.value = {
    title: arc.title,
    date: arc.date,
    tags: arc.tags.join(', '),
    blocks: formBlocksFromContent(arc.contentBlocks, arc.body),
  }
  isArcModalOpen.value = true
}

function closeArcModal() {
  if (isSavingArc.value) {
    return
  }

  isArcModalOpen.value = false
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

async function loadArcEntries() {
  isLoadingArcs.value = true
  arcErrorMessage.value = ''

  const { arcs: loadedArcs, error } = await loadArcs()

  if (error) {
    arcErrorMessage.value = error.message
    arcs.value = []
  } else {
    arcs.value = loadedArcs
  }

  isLoadingArcs.value = false
}

async function saveArc() {
  clearArcFeedback()

  const title = arcForm.value.title.trim()
  const blocks = normalizeEditorBlocks(arcForm.value.blocks)
  const invalidImage = findInvalidImageBlock(blocks)

  if (!title) {
    arcEditorErrorMessage.value = 'Title is required.'
    return
  }

  if (!arcForm.value.date) {
    arcEditorErrorMessage.value = 'Date is required.'
    return
  }

  if (!blocks.length) {
    arcEditorErrorMessage.value = 'Add at least one text, image, GM note, or accordion block.'
    return
  }

  if (invalidImage) {
    arcEditorErrorMessage.value = 'Image URLs must start with http:// or https://.'
    return
  }

  isSavingArc.value = true

  const payload = {
    slug: `${slugify(title, 'arc')}-${arcForm.value.date}`,
    title,
    date: arcForm.value.date,
    tags: normalizeDelimitedList(arcForm.value.tags),
    contentBlocks: blocks,
  }
  const result = editingArcSlug.value ? await updateArc(editingArcSlug.value, payload) : await createArc(payload)

  if (result.error) {
    arcEditorErrorMessage.value = result.error.message
  } else {
    const savedArc = result.arc
    const previousSlug = editingArcSlug.value
    arcs.value = [savedArc, ...arcs.value.filter((arc) => arc.slug !== previousSlug)]
      .filter((item, index, list) => list.findIndex((candidate) => candidate.slug === item.slug) === index)
      .sort((first, second) => new Date(second.date) - new Date(first.date))
    arcMessage.value = `${editingArcSlug.value ? 'Updated' : 'Added'} ${savedArc.title}.`
    arcForm.value = createBlankArcForm()
    editingArcSlug.value = ''
    isArcModalOpen.value = false
  }

  isSavingArc.value = false
}

async function removeArc(arc) {
  if (isDeletingArc.value) {
    return
  }

  const confirmed = window.confirm(`Delete "${arc.title}"? This cannot be undone.`)

  if (!confirmed) {
    return
  }

  clearArcFeedback()
  isDeletingArc.value = true

  const { error } = await deleteArc(arc.slug)

  if (error) {
    arcErrorMessage.value = error.message
  } else {
    arcs.value = arcs.value.filter((entry) => entry.slug !== arc.slug)
    arcMessage.value = `Deleted ${arc.title}.`
  }

  isDeletingArc.value = false
}

function formatArcDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

onMounted(loadArcEntries)

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

      <section class="admin-panel mt-10">
        <div class="admin-section-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">GM Prep</p>
            <h2>Arcs</h2>
          </div>
          <button class="profile-button" type="button" @click="openNewArcModal">New Arc</button>
        </div>

        <p class="admin-copy mt-3">
          Build session prep notes with the shared post block system, then search and filter them by tags.
        </p>

        <section class="game-log-tools mt-6">
          <label>
            <span>Search Arcs</span>
            <input v-model="arcSearchTerm" type="search" placeholder="Search title, note text, tag..." />
          </label>

          <label>
            <span>Filter Tag</span>
            <select v-model="selectedArcTag">
              <option v-for="tag in arcTags" :key="tag">{{ tag }}</option>
            </select>
          </label>
        </section>

        <p v-if="arcMessage" class="profile-message mt-5">{{ arcMessage }}</p>
        <p v-if="arcErrorMessage" class="profile-message profile-message-error mt-5">{{ arcErrorMessage }}</p>
        <p v-else-if="isLoadingArcs" class="mt-5 text-cyan-100/70">Loading arcs...</p>

        <section v-else class="admin-arc-list mt-6" aria-label="Arcs">
          <article v-for="arc in filteredArcs" :key="arc.slug" class="admin-arc-card">
            <div>
              <time :datetime="arc.date">{{ formatArcDate(arc.date) }}</time>
              <h3>{{ arc.title }}</h3>
              <p>{{ arc.tags.join(', ') || 'No tags' }}</p>
            </div>

            <div class="admin-arc-actions">
              <button class="profile-button profile-button-secondary" type="button" :disabled="isDeletingArc" @click="openArcViewer(arc)">
                View
              </button>
              <button class="profile-button profile-button-secondary" type="button" :disabled="isDeletingArc" @click="openEditArcModal(arc)">
                Edit
              </button>
              <button class="profile-button profile-button-danger" type="button" :disabled="isDeletingArc" @click="removeArc(arc)">
                Delete
              </button>
            </div>
          </article>
        </section>

        <p v-if="!isLoadingArcs && !arcErrorMessage && filteredArcs.length === 0" class="mt-5 text-cyan-100/70">
          No matching arcs found.
        </p>
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

    <div v-if="selectedArc" class="admin-modal-backdrop" role="presentation" @click.self="closeArcViewer">
      <article class="admin-modal admin-arc-view-modal" role="dialog" aria-modal="true" aria-labelledby="arc-view-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Arc Briefing</p>
            <h2 id="arc-view-title">{{ selectedArc.title }}</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" @click="closeArcViewer">
            x
          </button>
        </div>

        <header class="admin-arc-view-header mt-8">
          <time :datetime="selectedArc.date">{{ formatArcDate(selectedArc.date) }}</time>
          <p>{{ selectedArc.tags.join(', ') || 'No tags' }}</p>
        </header>

        <ContentBlockRenderer :blocks="selectedArc.contentBlocks" :fallback-body="selectedArc.body" show-gm-notes />
      </article>
    </div>

    <div v-if="isArcModalOpen" class="admin-modal-backdrop game-log-editor-backdrop" role="presentation" @click.self="closeArcModal">
      <section class="admin-modal game-log-editor-modal" role="dialog" aria-modal="true" aria-labelledby="arc-editor-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Arc Console</p>
            <h2 id="arc-editor-title">{{ editingArcSlug ? 'Edit Arc' : 'New Arc' }}</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingArc" @click="closeArcModal">
            x
          </button>
        </div>

        <div class="game-log-editor-layout mt-6">
          <form class="admin-import-form game-log-editor-form" @submit.prevent="saveArc">
            <div class="admin-form-grid admin-form-grid-two">
              <label>
                <span>Title</span>
                <input v-model="arcForm.title" type="text" required />
              </label>

              <label>
                <span>Date</span>
                <input v-model="arcForm.date" type="date" required />
              </label>
            </div>

            <label>
              <span>Tags</span>
              <input v-model="arcForm.tags" type="text" placeholder="Act II, Nal Hutta, Underworld" />
            </label>

            <ContentBlockEditor v-model="arcForm.blocks" :disabled="isSavingArc" enable-accordion enable-reference />

            <p v-if="arcEditorErrorMessage" class="profile-message profile-message-error">{{ arcEditorErrorMessage }}</p>

            <div class="admin-actions">
              <button class="profile-button" type="submit" :disabled="isSavingArc">
                {{ isSavingArc ? 'Saving...' : editingArcSlug ? 'Save Changes' : 'Save Arc' }}
              </button>
              <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingArc" @click="closeArcModal">
                Cancel
              </button>
            </div>
          </form>

          <ContentBlockPreview
            :title="arcForm.title"
            :date="arcForm.date"
            :meta="arcForm.tags"
            empty-meta="No tags listed"
            :blocks="arcForm.blocks"
          />
        </div>
      </section>
    </div>
  </main>
</template>
