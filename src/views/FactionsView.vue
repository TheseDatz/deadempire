<script setup>
import { computed, ref } from 'vue'

const searchTerm = ref('')
const selectedHostility = ref('All')

const factions = [
  {
    name: 'Imperial Security Bureau',
    borderColor: '#ff3b24',
    capitalPlanet: 'Coruscant',
    hostility: 'Hostile',
    currentLeader: 'Grand Vzier Mas Amedda',
    description:
      'Imperial remnants around the Imperial Capital have consolidated beneath the Imperial Security Bureau, much to the dismay of Imperial Navy officers. In-fighting is rampant and the power structure is rapidly shifting and changing.',
    notes:
      'While Mas Amedda is the crowned leader of the Empire underneath the ISB, rumours suggest he has very little control of things.',
  },
]

const hostilityLevels = computed(() => ['All', ...new Set(factions.map((faction) => faction.hostility))])

const filteredFactions = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return factions.filter((faction) => {
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

      <section class="faction-grid mt-8">
        <article
          v-for="faction in filteredFactions"
          :key="faction.name"
          class="faction-card"
          :style="{ borderColor: faction.borderColor }"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="faction-hostility">{{ faction.hostility }}</p>
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
    </section>
  </main>
</template>
