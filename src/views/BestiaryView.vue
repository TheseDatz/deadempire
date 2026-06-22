<script setup>
import { computed, onMounted, ref } from 'vue'
import { loadBestiaryNpcs } from '../services/bestiary'

const searchTerm = ref('')
const selectedRole = ref('All')
const npcs = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const dieCodeRows = [
  ['1D', 'Below human average for an attribute.'],
  ['2D', 'Human average for an attribute and many skills.'],
  ['3D', 'Average level of training for a human.'],
  ['4D', 'Professional level of training for a human.'],
  ['5D', 'Above average expertise.'],
  ['6D', 'Best in a city or geographic area; about 1 in 100,000.'],
  ['7D', 'Among the best on a continent; about 1 in 10,000,000.'],
  ['8D', 'Among the best on a planet; about 1 in 100,000,000.'],
  ['9D', 'One of the best for several nearby systems; about 1 in a billion.'],
  ['10D', 'One of the best in a sector.'],
  ['11D', 'One of the best in a region.'],
  ['12D+', 'Among the best in the galaxy.'],
]

const challengeRows = [
  ['None', '-15D or more', '-3D or more'],
  ['Minor', '-5D to -14D', '-2D'],
  ['Moderate', '-4D to +4D', '-1D to +1D'],
  ['Serious', '+5D to +14D', '+2D'],
  ['Major', '+15D or more', '+3D or more'],
]

const roles = computed(() => ['All', ...new Set(npcs.value.map((npc) => npc.role).filter(Boolean))])

const filteredNpcs = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return npcs.value.filter((npc) => {
    const matchesRole = selectedRole.value === 'All' || npc.role === selectedRole.value
    const haystack = [
      npc.name,
      npc.role,
      npc.description,
      npc.attributes,
      ...npc.skills,
      ...npc.gear,
    ]
      .join(' ')
      .toLowerCase()

    return matchesRole && (!query || haystack.includes(query))
  })
})

onMounted(async () => {
  isLoading.value = true
  errorMessage.value = ''

  const { npcs: loadedNpcs, error } = await loadBestiaryNpcs()

  if (error) {
    errorMessage.value = error.message
  } else {
    npcs.value = loadedNpcs
  }

  isLoading.value = false
})
</script>

<template>
  <main class="bestiary-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Opposition Archive</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Bestiary</h1>

      <div class="bestiary-charts mt-10">
        <section class="reference-card">
          <h3>Relative Power Levels</h3>
          <div class="damage-chart-table">
            <div class="damage-chart-head bestiary-die-grid">
              <span>Die Code</span>
              <span>Description</span>
            </div>
            <div v-for="row in dieCodeRows" :key="row[0]" class="damage-chart-row bestiary-die-grid">
              <span>{{ row[0] }}</span>
              <span>{{ row[1] }}</span>
            </div>
          </div>
        </section>

        <section class="reference-card">
          <h3>Challenge Level</h3>
          <div class="damage-chart-table">
            <div class="damage-chart-head bestiary-challenge-grid">
              <span>Challenge Level</span>
              <span>Total Dice</span>
              <span>Specific Skill</span>
            </div>
            <div v-for="row in challengeRows" :key="row[0]" class="damage-chart-row bestiary-challenge-grid">
              <span>{{ row[0] }}</span>
              <span>{{ row[1] }}</span>
              <span>{{ row[2] }}</span>
            </div>
          </div>
        </section>
      </div>

      <section class="bestiary-tools mt-10">
        <label>
          <span>Search NPCs</span>
          <input v-model="searchTerm" type="search" placeholder="Search trooper, vibroaxe, armor..." />
        </label>

        <label>
          <span>Filter Role</span>
          <select v-model="selectedRole">
            <option v-for="role in roles" :key="role">{{ role }}</option>
          </select>
        </label>
      </section>

      <p v-if="isLoading" class="profile-message mt-8">Loading bestiary records...</p>
      <p v-else-if="errorMessage" class="profile-message profile-message-error mt-8">{{ errorMessage }}</p>
      <p v-else-if="!filteredNpcs.length" class="profile-message mt-8">No bestiary records found.</p>

      <section v-else class="bestiary-grid mt-8">
        <article v-for="npc in filteredNpcs" :key="npc.id || npc.name" class="npc-card">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="npc-role">{{ npc.role }}</p>
              <h2>{{ npc.name }}</h2>
            </div>
            <span class="npc-move">Move {{ npc.move }}</span>
          </div>

          <p class="mt-3 text-cyan-100/80">{{ npc.description }}</p>
          <p class="mt-4 text-sm text-slate-300">{{ npc.attributes }}</p>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <h3>Skills</h3>
              <ul>
                <li v-for="skill in npc.skills" :key="skill">{{ skill }}</li>
              </ul>
            </div>
            <div>
              <h3>Gear</h3>
              <ul>
                <li v-for="item in npc.gear" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
