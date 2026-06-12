<script setup>
import { computed, ref } from 'vue'
import ReferenceList from './ReferenceList.vue'
import { combatReferences } from '../data/combatReferences'

const isOpen = ref(false)
const searchTerm = ref('')

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
  <div class="reference-charts">
    <button class="reference-fab" type="button" aria-label="Open reference charts" @click="isOpen = true">
      <span>Ref</span>
    </button>

    <div v-if="isOpen" class="reference-overlay" role="dialog" aria-modal="true" aria-label="Reference charts">
      <button class="reference-overlay-backdrop" type="button" aria-label="Close reference charts" @click="isOpen = false" />

      <section class="reference-panel">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.26em] text-cyan-100/70">Combat</p>
            <h2 class="mt-1 font-serif text-3xl font-bold text-[#4fc3ff]">Reference</h2>
          </div>
          <button class="dice-close-button" type="button" aria-label="Close reference charts" @click="isOpen = false">
            X
          </button>
        </div>

        <label class="reference-search mt-5">
          <span>Filter Reference</span>
          <input v-model="searchTerm" type="search" placeholder="Search cover, stun, scale..." />
        </label>

        <div class="reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>
      </section>
    </div>
  </div>
</template>
