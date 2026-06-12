<script setup>
import { computed, ref } from 'vue'

const searchTerm = ref('')
const selectedStatus = ref('All')

const planets = [
  {
    name: 'Coruscant',
    region: 'Core Worlds',
    color: '#8b949e',
    status: 'Occupied by Imperial Security Bureau',
    moons: [
      {
        name: 'Habitation Spheres',
        description: 'Two large spherical space stations housing thousands of people. Yet to be completed.',
      },
    ],
    locations: [
      {
        name: 'Senate Building',
        description: 'Former seat of the galactic senate.',
      },
      {
        name: 'Imperial Palace',
        description: 'A labyrinthine maze inside a pyramidal structure that used to be the primary residence of the Emperor.',
      },
    ],
    notes: 'A city-world under immense surveillance, with whole districts sealed behind shifting security cordons.',
  },
]

const statuses = computed(() => ['All', ...new Set(planets.map((planet) => planet.status))])

const filteredPlanets = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return planets.filter((planet) => {
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

      <section class="planet-grid mt-8">
        <article v-for="planet in filteredPlanets" :key="planet.name" class="planet-card">
          <div class="planet-card-header">
            <span class="planet-orb" :style="{ background: planet.color }" />
            <div>
              <h2>{{ planet.name }}</h2>
              <p>{{ planet.region }}</p>
            </div>
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
    </section>
  </main>
</template>
