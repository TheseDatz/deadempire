<script setup>
import { onMounted, ref, watch } from 'vue'
import CombatantRow from '../components/CombatantRow.vue'
import ReferenceCharts from '../components/ReferenceCharts.vue'
import { loadPlayerCharacters } from '../data/characters'

const combatants = ref([])
const turnNumber = ref(1)
const currentAction = ref(1)
const isLoading = ref(true)
const errorMessage = ref('')
const showInstructions = ref(false)

const combatInstructions = [
  {
    title: 'Know the terms',
    details:
      'A round is the official five-second slice of action. In this tracker, Turn counts the current combat round, and Cur. Action tracks the current action pass inside that round: first actions, second actions, third actions, and so on.',
  },
  {
    title: 'Set sides and roll initiative',
    details:
      'Decide which sides are in the fight. The character with the highest Perception on each side rolls Perception. The side with the highest roll chooses whether that side acts first or last this round. Reroll ties, or break them by special first-action abilities, Perception, search, Dexterity, dodge, then special gear or situation.',
  },
  {
    title: 'Declare first actions',
    details:
      'Start with the first side. Characters on that side act from highest Perception to lowest. Each character declares how many total actions they will take this round before rolling their first action. Then repeat for the next side, and any extra sides.',
  },
  {
    title: 'Apply action costs',
    details:
      'Drawing a weapon, reloading, switching to stun, throwing a grenade, attacking, dodging, or parrying each counts as an action. For each action beyond the first, subtract -1D from all skill and attribute rolls that round, but not damage, damage resistance, or initiative.',
  },
  {
    title: 'Check surprise',
    details:
      'If one side is surprised, the attackers take their first action before the surprised side can dodge or parry. After that first action, continue with the normal side order and Perception order.',
  },
  {
    title: 'Set attack difficulty',
    details:
      'For ranged attacks, use range: point-blank is Very Easy, short is Easy, medium is Moderate, and long is Difficult. For melee, use the weapon difficulty. Brawling is usually Very Easy.',
  },
  {
    title: 'Handle reactions when attacked',
    details:
      'Targets may dodge ranged attacks, parry melee attacks, or use a full reaction as their only action. A reaction can spend a remaining action or become an extra action with the higher multiple-action penalty. A normal reaction roll becomes the new difficulty for that attack type for the rest of the round. A full reaction adds the roll to the attack difficulty.',
  },
  {
    title: 'Roll the attack',
    details:
      'Roll the proper skill or default attribute. Add fire control if the weapon has it, then compare the total to the final difficulty. If the roll meets or beats the number, the attack hits.',
  },
  {
    title: 'Resolve cover and blasts',
    details:
      'Add visibility or physical cover modifiers before the attack roll. If a covered target is missed only because of cover, roll damage against the cover and pass reduced damage through if it breaks. For grenades, place the blast or roll deviation on a miss.',
  },
  {
    title: 'Roll damage',
    details:
      'Roll weapon damage against the target Strength plus armor. Compare the difference on the damage chart and update health, penalties, armor damage, or weapon damage as needed.',
  },
  {
    title: 'Advance action passes',
    details:
      'When every combatant with a first action has acted, set Cur. Action to 2 and repeat the same side order and Perception order for second actions. Skip characters with no action left. Continue until all declared actions are resolved. Characters cannot hold an action to act later in the round.',
  },
  {
    title: 'End the round',
    details:
      'Apply stun and wound effects, mark ammo or fire-rate limits, clear reactions that only lasted this round, reset Cur. Action to 1, advance Turn to the next combat round, and roll initiative again if needed.',
  },
]

function getStrength(character) {
  return character.attributes?.find((attribute) => attribute.name === 'Strength')?.dice ?? '2D'
}

function createCombatant(character = {}) {
  return {
    id: `${character.id ?? 'combatant'}-${crypto.randomUUID()}`,
    turnOrder: 1,
    name: character.name ?? 'New Combatant',
    strength: getStrength(character),
    tempDifficulty: '',
    actions: 1,
    health: character.health ?? 'Healthy',
    relativePosition: '',
    knockedProne: false,
    isNpc: false,
    activeStuns: 0,
    damage: '',
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

function resetCombatantsForNewTurn() {
  combatants.value.forEach((combatant) => {
    combatant.knockedProne = false
    combatant.tempDifficulty = ''
    combatant.actions = 1
  })

  sortCombatants()
}

watch(turnNumber, (newTurnNumber, oldTurnNumber) => {
  if (Number(newTurnNumber) > Number(oldTurnNumber)) {
    resetCombatantsForNewTurn()
  }
})
</script>

<template>
  <main class="combat-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <div class="combat-header">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Encounter Tool</p>
          <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Combat Tracker</h1>
        </div>

        <div class="combat-round-trackers">
          <label class="combat-turn-field">
            <span>Cur. Action</span>
            <input v-model.number="currentAction" type="number" min="1" />
          </label>

          <label class="combat-turn-field">
            <span>Turn</span>
            <input v-model.number="turnNumber" type="number" min="1" />
          </label>
        </div>
      </div>

      <div class="combat-controls mt-8">
        <button type="button" @click="nextCombatant">Next</button>
        <button type="button" @click="sortCombatants">Sort</button>
        <button type="button" @click="addCombatant">Add Combatant</button>
        <button type="button" @click="showInstructions = true">Instructions</button>
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

    <div
      v-if="showInstructions"
      class="combat-instructions-backdrop"
      role="presentation"
      @click.self="showInstructions = false"
    >
      <section class="combat-instructions" role="dialog" aria-modal="true" aria-labelledby="combat-instructions-title">
        <div class="combat-instructions-header">
          <div>
            <p>Round Guide</p>
            <h2 id="combat-instructions-title">Combat Instructions</h2>
          </div>
          <button type="button" aria-label="Close combat instructions" @click="showInstructions = false">Close</button>
        </div>

        <ol class="combat-instructions-list">
          <li v-for="instruction in combatInstructions" :key="instruction.title">
            <strong>{{ instruction.title }}</strong>
            <span>{{ instruction.details }}</span>
          </li>
        </ol>
      </section>
    </div>

    <ReferenceCharts />
  </main>
</template>
