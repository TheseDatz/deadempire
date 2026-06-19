<script setup>
import { computed, ref } from 'vue'
import { gameLogs, getGameLogPlayers } from '../data/gameLogs'

const searchTerm = ref('')
const selectedPlayer = ref('All')

const players = computed(() => ['All', ...getGameLogPlayers()])

const filteredLogs = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return gameLogs.filter((log) => {
    const matchesPlayer =
      selectedPlayer.value === 'All' || log.participatingCharacters.includes(selectedPlayer.value)
    const haystack = [log.date, log.title, ...log.participatingCharacters, ...log.body]
      .join(' ')
      .toLowerCase()

    return matchesPlayer && (!query || haystack.includes(query))
  })
})

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
</script>

<template>
  <main class="game-log-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-5xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Session Archive</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Game Log</h1>

      <section class="game-log-tools mt-10">
        <label>
          <span>Search Logs</span>
          <input v-model="searchTerm" type="search" placeholder="Search title, session text, player..." />
        </label>

        <label>
          <span>Filter Player</span>
          <select v-model="selectedPlayer">
            <option v-for="player in players" :key="player">{{ player }}</option>
          </select>
        </label>
      </section>

      <section class="game-log-list mt-8">
        <RouterLink v-for="log in filteredLogs" :key="log.slug" class="game-log-card" :to="`/log/${log.slug}`">
          <time :datetime="log.date">{{ formatDate(log.date) }}</time>
          <h2>{{ log.title }}</h2>
          <p>{{ log.participatingCharacters.join(', ') }}</p>
        </RouterLink>
      </section>

      <p v-if="filteredLogs.length === 0" class="mt-8 text-cyan-100/70">No matching logs found.</p>
    </section>
  </main>
</template>
