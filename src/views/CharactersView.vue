<script setup>
import { onMounted, ref } from 'vue'
import CharacterProfileCard from '../components/CharacterProfileCard.vue'
import { loadAllCharacters } from '../data/characters'
import { getSession } from '../services/auth'

const playerCharacters = ref([])
const importantNpcs = ref([])
const canViewCharacterPhotos = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const [{ session }, data] = await Promise.all([getSession(), loadAllCharacters()])
    canViewCharacterPhotos.value = Boolean(session)
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
  <main class="galaxy-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
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
            :show-photo="canViewCharacterPhotos"
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
            :show-photo="canViewCharacterPhotos"
          />
        </div>
      </section>
    </div>
  </main>
</template>
