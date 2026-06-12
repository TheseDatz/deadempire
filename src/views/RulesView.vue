<script setup>
import { computed, ref } from 'vue'
import ReferenceList from '../components/ReferenceList.vue'
import { combatReferences } from '../data/combatReferences'

const searchTerm = ref('')

const resources = [
  { label: 'D6 Holocron', href: 'http://d6holocron.com/' },
  { label: 'Rancor Pit', href: 'https://www.rancorpit.com/' },
]

const filteredReferences = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (!query) {
    return combatReferences
  }

  return combatReferences.filter((reference) => {
    const haystack = [
      reference.title,
      reference.summary,
      ...(reference.bullets ?? []),
      ...(reference.rows ?? []).flat(),
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
})
</script>

<template>
  <main class="rules-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Rules Reference</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Dead Empire Rules</h1>

      <section class="rules-intro mt-10">
        <p>
          Dead Empire is a resource for a tabletop roleplaying campaign using the REUP version
          of the Star Wars D6 rules. All rules, trademarks, and source material remain the
          property of their original owners.
        </p>
        <a class="rules-primary-link" href="http://d6holocron.com/downloads/books/REUP.pdf" target="_blank" rel="noreferrer">
          Open REUP Rules
        </a>
      </section>

      <section class="rules-resource-section mt-10">
        <h2>Other Resources</h2>
        <div class="tools-grid mt-5">
          <a
            v-for="resource in resources"
            :key="resource.href"
            class="tool-card"
            :href="resource.href"
            target="_blank"
            rel="noreferrer"
          >
            {{ resource.label }}
          </a>
        </div>
      </section>

      <section class="rules-reference-panel mt-12">
        <div class="rules-section-heading">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Index</p>
            <h2>Combat Reference</h2>
          </div>
        </div>

        <label class="reference-search mt-5">
          <span>Search Combat Reference</span>
          <input v-model="searchTerm" type="search" placeholder="Search cover, stun, scale..." />
        </label>

        <div class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>
      </section>
    </section>
  </main>
</template>
