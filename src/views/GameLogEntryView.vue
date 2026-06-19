<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getGameLog } from '../data/gameLogs'

const route = useRoute()
const log = computed(() => getGameLog(route.params.logSlug))

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
</script>

<template>
  <main class="game-log-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <article v-if="log" class="game-log-entry mx-auto max-w-4xl">
      <RouterLink class="game-log-back-link" to="/log">Back to logs</RouterLink>

      <header class="mt-8 border-b border-[#4fc3ff]/35 pb-8">
        <time :datetime="log.date">{{ formatDate(log.date) }}</time>
        <h1 class="mt-3 font-serif text-5xl font-bold text-[#4fc3ff]">{{ log.title }}</h1>
        <p class="mt-4">{{ log.participatingCharacters.join(', ') }}</p>
      </header>

      <div class="game-log-body mt-8">
        <p v-for="paragraph in log.body" :key="paragraph">{{ paragraph }}</p>
      </div>
    </article>

    <section v-else class="mx-auto max-w-4xl border-t border-[#4fc3ff] py-12">
      <h1 class="font-serif text-4xl font-bold text-[#4fc3ff]">Log Not Found</h1>
      <RouterLink class="game-log-back-link mt-6" to="/log">Back to logs</RouterLink>
    </section>
  </main>
</template>
