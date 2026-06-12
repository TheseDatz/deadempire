<script setup>
import { onMounted, ref } from 'vue'
import CharacterProfileCard from '../components/CharacterProfileCard.vue'
import { loadAllCharacters } from '../data/characters'

const playerCharacters = ref([])
const importantNpcs = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const data = await loadAllCharacters()
    playerCharacters.value = data.playerCharacters
    importantNpcs.value = data.importantNpcs
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-[#0c0c0b] px-6 pb-16 pt-32 text-stone-100">
    <div class="mx-auto max-w-6xl">
      <h1 class="font-serif text-5xl font-bold text-[#4fc3ff]">Characters</h1>

      <p v-if="isLoading" class="mt-8 text-cyan-100/80">Loading character files...</p>
      <p v-else-if="errorMessage" class="mt-8 text-red-200">{{ errorMessage }}</p>

      <section v-else class="character-section mt-10">
        <h2 class="character-section-title">Player Characters</h2>
        <div class="character-grid">
          <CharacterProfileCard
            v-for="character in playerCharacters"
            :key="character.name"
            :character="character"
          />
        </div>
      </section>

      <section v-if="!isLoading && !errorMessage" class="character-section mt-10">
        <div class="character-section-header">
          <h2 class="character-section-title">Important NPCs</h2>
          <RouterLink class="character-other-button" to="/bestiary">Other</RouterLink>
        </div>
        <p v-if="importantNpcs.length === 0" class="mt-4 text-cyan-100/70">
          No important NPC files found yet.
        </p>
        <div v-else class="character-grid">
          <CharacterProfileCard
            v-for="character in importantNpcs"
            :key="character.name"
            :character="character"
          />
        </div>
      </section>
    </div>
  </main>
</template>
