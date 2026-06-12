<script setup>
import { onMounted, ref } from 'vue'
import CombatantRow from '../components/CombatantRow.vue'
import ReferenceCharts from '../components/ReferenceCharts.vue'
import { loadPlayerCharacters } from '../data/characters'

const combatants = ref([])
const turnNumber = ref(1)
const isLoading = ref(true)
const errorMessage = ref('')

function getStrength(character) {
  return character.attributes?.find((attribute) => attribute.name === 'Strength')?.dice ?? '2D'
}

function createCombatant(character = {}) {
  return {
    id: `${character.id ?? 'combatant'}-${crypto.randomUUID()}`,
    turnOrder: 1,
    name: character.name ?? 'New Combatant',
    strength: getStrength(character),
    actions: 1,
    health: character.health ?? 'Healthy',
    side: 'blue',
  }
}

onMounted(async () => {
  try {
    const playerCharacters = await loadPlayerCharacters()
    combatants.value = playerCharacters.map((character) => createCombatant(character))
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
})

function addCombatant() {
  combatants.value.push(createCombatant())
}

function deleteCombatant(index) {
  combatants.value.splice(index, 1)
}

function setSide(index, side) {
  combatants.value[index].side = side
}

function nextCombatant() {
  const [firstCombatant] = combatants.value.splice(0, 1)

  if (firstCombatant) {
    combatants.value.push(firstCombatant)
  }
}

function sortCombatants() {
  combatants.value.sort((a, b) => Number(a.turnOrder) - Number(b.turnOrder))
}
</script>

<template>
  <main class="combat-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <div class="combat-header">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Encounter Tool</p>
          <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Combat Tracker</h1>
        </div>

        <label class="combat-turn-field">
          <span>Turn</span>
          <input v-model.number="turnNumber" type="number" min="1" />
        </label>
      </div>

      <div class="combat-controls mt-8">
        <button type="button" @click="nextCombatant">Next</button>
        <button type="button" @click="sortCombatants">Sort</button>
        <button type="button" @click="addCombatant">Add Combatant</button>
      </div>

      <p v-if="isLoading" class="mt-8 text-cyan-100/80">Loading combatants...</p>
      <p v-else-if="errorMessage" class="mt-8 text-red-200">{{ errorMessage }}</p>

      <div v-else class="combat-list mt-8">
        <CombatantRow
          v-for="(combatant, index) in combatants"
          :key="combatant.id"
          :combatant="combatant"
          @delete="deleteCombatant(index)"
          @set-side="setSide(index, $event)"
        />
      </div>
    </section>

    <ReferenceCharts />
  </main>
</template>
