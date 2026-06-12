<script setup>
import { computed, ref } from 'vue'

const searchTerm = ref('')
const selectedRole = ref('All')

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

const npcs = [
  {
    name: 'Pig Guard',
    role: 'Scum',
    tagline: 'A hulking bodyguard with a pig-like face.',
    move: '8',
    stats: 'All stats 2D except Dexterity 3D, Strength 4D.',
    skills: ['Melee combat: vibroaxe 4D+1', 'Melee parry 3D'],
    gear: ['Vibroaxe: STR+3D+1 damage'],
  },
  {
    name: 'Imperial Trooper',
    role: 'Empire',
    tagline: 'Standard enforcer of the regime.',
    move: '10',
    stats: 'All stats 2D except Dexterity 3D.',
    skills: ['Blaster 4D', 'Brawling parry 4D', 'Dodge 4D', 'Brawling 3D'],
    gear: [
      'Trooper armor: +2D physical, +1D energy, -1D Dexterity and related skills',
      'Blaster rifle: 5D damage',
      'Blaster pistol: 4D damage',
    ],
  },
]

const roles = computed(() => ['All', ...new Set(npcs.map((npc) => npc.role))])

const filteredNpcs = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return npcs.filter((npc) => {
    const matchesRole = selectedRole.value === 'All' || npc.role === selectedRole.value
    const haystack = [npc.name, npc.role, npc.tagline, npc.stats, ...npc.skills, ...npc.gear]
      .join(' ')
      .toLowerCase()

    return matchesRole && (!query || haystack.includes(query))
  })
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

      <section class="bestiary-grid mt-8">
        <article v-for="npc in filteredNpcs" :key="npc.name" class="npc-card">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="npc-role">{{ npc.role }}</p>
              <h2>{{ npc.name }}</h2>
            </div>
            <span class="npc-move">Move {{ npc.move }}</span>
          </div>

          <p class="mt-3 text-cyan-100/80">{{ npc.tagline }}</p>
          <p class="mt-4 text-sm text-slate-300">{{ npc.stats }}</p>

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
