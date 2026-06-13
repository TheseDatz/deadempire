<script setup>
import { computed, ref } from 'vue'
import ReferenceList from '../components/ReferenceList.vue'
import { combatReferences } from '../data/combatReferences'

const searchTerm = ref('')
const activeReference = ref('character-creation')

const resources = [
  { label: 'D6 Holocron', href: 'http://d6holocron.com/' },
  { label: 'Rancor Pit', href: 'https://www.rancorpit.com/' },
]

const referenceSections = [
  { id: 'character-creation', label: 'Character Creation' },
  { id: 'combat', label: 'Combat' },
]

const activeReferenceLabel = computed(() => {
  return referenceSections.find((section) => section.id === activeReference.value)?.label ?? 'Reference'
})

const filteredReferences = computed(() => {
  if (activeReference.value !== 'combat') {
    return []
  }

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
        <p class="rules-disclaimer">
          Dead Empire is an unofficial, non-commercial fan site for a private tabletop campaign.
          Star Wars and related names, characters, locations, artwork, and trademarks are the
          property of Lucasfilm Ltd. and/or The Walt Disney Company. This site is not affiliated
          with, sponsored by, endorsed by, or approved by Lucasfilm, Disney, West End Games, or any
          current rights holder. Rules references are provided for play aid purposes and are
          summarized or independently written unless otherwise noted.
        </p>
        <p class="rules-disclaimer">
          This site is built to be compatible with the Star Wars: REUP system:
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

      <div class="rules-reference-divider mt-12" aria-hidden="true"></div>

      <nav class="rules-reference-tabs mt-8" aria-label="Rules references">
        <button
          v-for="section in referenceSections"
          :key="section.id"
          type="button"
          :class="{ 'rules-reference-tab-active': activeReference === section.id }"
          @click="activeReference = section.id"
        >
          {{ section.label }}
        </button>
      </nav>

      <section class="rules-reference-panel mt-12">
        <div class="rules-section-heading">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Index</p>
            <h2>{{ activeReferenceLabel }} Reference</h2>
          </div>
        </div>

        <label v-if="activeReference === 'combat'" class="reference-search mt-5">
          <span>Search Combat Reference</span>
          <input v-model="searchTerm" type="search" placeholder="Search cover, stun, scale..." />
        </label>

        <div v-if="activeReference === 'combat'" class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>
      </section>
    </section>
  </main>
</template>
