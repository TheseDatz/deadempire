<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { loadAllCharacters } from '../data/characters'

const props = defineProps({
  characterName: {
    type: String,
    required: true,
  },
})

const allCharacters = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const sheet = ref({})
const weapons = ref([])
const armor = ref([])
const equipment = ref([])
const health = ref('Healthy')

const character = computed(() => {
  return allCharacters.value.find((entry) => entry.id === props.characterName) ?? null
})

onMounted(async () => {
  try {
    const data = await loadAllCharacters()
    allCharacters.value = data.allCharacters

    if (!character.value) {
      errorMessage.value = 'Character file not found.'
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
})

watch(
  character,
  (nextCharacter) => {
    if (!nextCharacter) {
      return
    }

    const nextSheet = JSON.parse(JSON.stringify(nextCharacter))
    nextSheet.force = nextSheet.force ?? {
      forceSensitive: 'No',
      forcePoints: '0',
      darkSidePoints: '0',
      control: '-',
      sense: '-',
      alter: '-',
    }
    nextSheet.forceSummary = `${nextSheet.force.control ?? '-'} / ${nextSheet.force.sense ?? '-'} / ${nextSheet.force.alter ?? '-'}`
    nextSheet.specialAbilitiesText = (nextSheet.specialAbilities ?? ['No special abilities entered yet.']).join('\n')
    sheet.value = nextSheet
    weapons.value = (nextCharacter.weapons ?? []).map((weapon) => ({ ...weapon }))
    armor.value = (nextCharacter.armor ?? []).map((armorItem) => ({ ...armorItem }))
    equipment.value = [...(nextCharacter.equipment ?? [])]
    health.value = nextCharacter.health ?? 'Healthy'
  },
  { immediate: true },
)

function addWeapon() {
  weapons.value.push({ name: '', range: '', damage: '' })
}

function addArmor() {
  armor.value.push({ name: '', strengthBonus: '', dexPenalty: '' })
}

function addEquipment() {
  equipment.value.push('')
}

function removeWeapon(index) {
  weapons.value.splice(index, 1)
}

function removeArmor(index) {
  armor.value.splice(index, 1)
}

function removeEquipment(index) {
  equipment.value.splice(index, 1)
}

function exportCharacterJson() {
  const [control = '-', sense = '-', alter = '-'] = (sheet.value.forceSummary ?? '- / - / -')
    .split('/')
    .map((value) => value.trim())
  const exportData = {
    ...sheet.value,
    specialAbilities: (sheet.value.specialAbilitiesText ?? '')
      .split('\n')
      .map((ability) => ability.trim())
      .filter(Boolean),
    force: {
      ...sheet.value.force,
      control,
      sense,
      alter,
    },
    weapons: weapons.value,
    armor: armor.value,
    equipment: equipment.value,
    health: health.value,
  }
  delete exportData.forceSummary
  delete exportData.specialAbilitiesText
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sheet.value.id ?? 'character'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const sheetFields = computed(() => [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'species', label: 'Species' },
  { key: 'homeworld', label: 'Homeworld' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'height', label: 'Height' },
  { key: 'weight', label: 'Weight' },
  { key: 'move', label: 'Move' },
  { key: 'characterPoints', label: 'Character Points' },
])

const healthStates = ['Healthy', 'Stunned', 'Wounded', 'Incapacitated', 'Mortally Wounded']
</script>

<template>
  <main class="character-sheet-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <div v-if="isLoading" class="mx-auto max-w-7xl text-cyan-100/80">Loading character file...</div>
    <div v-else-if="errorMessage" class="mx-auto max-w-7xl text-red-200">{{ errorMessage }}</div>

    <form v-else class="character-sheet mx-auto max-w-7xl">
      <header class="sheet-title">
        <p class="text-sm uppercase tracking-[0.32em] text-cyan-100/80">Dead Empire</p>
        <h1 class="font-serif text-5xl font-bold text-white">{{ sheet.name }}</h1>
      </header>

      <section class="sheet-grid mt-8">
        <div class="sheet-panel lg:col-span-2">
          <div class="sheet-field-grid">
            <label v-for="field in sheetFields" :key="field.label" class="sheet-field">
              <span>{{ field.label }}</span>
              <input v-model="sheet[field.key]" />
            </label>
          </div>

          <label class="sheet-field mt-4">
            <span>Appearance</span>
            <textarea v-model="sheet.appearance" rows="2" />
          </label>

          <label class="sheet-field mt-4">
            <span>Personality</span>
            <textarea v-model="sheet.personality" rows="2" />
          </label>

          <label class="sheet-field mt-4">
            <span>A Quote</span>
            <input v-model="sheet.quote" />
          </label>
        </div>

        <aside class="sheet-panel">
          <img class="sheet-portrait" :src="sheet.photo" :alt="sheet.name" />
          <label class="sheet-field mt-4">
            <span>Character Illustration</span>
            <input v-model="sheet.photo" />
          </label>
        </aside>

        <section class="sheet-panel lg:row-span-2">
          <h2 class="sheet-heading">Attributes & Skills</h2>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div v-for="attribute in sheet.attributes ?? []" :key="attribute.name" class="attribute-block">
              <div class="flex items-center justify-between gap-3">
                <label class="sheet-inline-field flex-1">
                  <span>{{ attribute.name }}</span>
                  <input v-model="attribute.dice" />
                </label>
              </div>

              <div class="mt-2 space-y-2">
                <div v-for="skill in attribute.skills" :key="skill.name" class="skill-row">
                  <input v-model="skill.name" />
                  <input v-model="skill.dice" />
                </div>
                <div v-for="slot in 3" :key="slot" class="skill-row">
                  <input value="" />
                  <input value="" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <div class="sheet-section-header">
            <h2 class="sheet-heading">Weapons</h2>
            <button class="sheet-add-button" type="button" @click="addWeapon">Add</button>
          </div>
          <div class="sheet-table mt-4">
            <div class="sheet-table-head sheet-table-head-with-action">
              <span>Weapon</span>
              <span>Range</span>
              <span>Damage</span>
              <span aria-hidden="true"></span>
            </div>
            <div v-for="(weapon, index) in weapons" :key="`weapon-${index}`" class="sheet-table-row sheet-table-row-with-action">
              <input v-model="weapon.name" aria-label="Weapon name" />
              <input v-model="weapon.range" aria-label="Weapon range" />
              <input v-model="weapon.damage" aria-label="Weapon damage" />
              <button class="sheet-delete-button" type="button" @click="removeWeapon(index)">Delete</button>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <div class="sheet-section-header">
            <h2 class="sheet-heading">Armor</h2>
            <button class="sheet-add-button" type="button" @click="addArmor">Add</button>
          </div>
          <div class="sheet-table mt-4">
            <div class="sheet-table-head sheet-table-head-with-action">
              <span>Armor</span>
              <span>Str Bonus</span>
              <span>Dex Penalty</span>
              <span aria-hidden="true"></span>
            </div>
            <div v-for="(armorItem, index) in armor" :key="`armor-${index}`" class="sheet-table-row sheet-table-row-with-action">
              <input v-model="armorItem.name" aria-label="Armor name" />
              <input v-model="armorItem.strengthBonus" aria-label="Armor strength bonus" />
              <input v-model="armorItem.dexPenalty" aria-label="Armor dexterity penalty" />
              <button class="sheet-delete-button" type="button" @click="removeArmor(index)">Delete</button>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <div class="flex items-start justify-between gap-4">
            <h2 class="sheet-heading">Equipment</h2>
            <div class="flex items-start gap-3">
              <label class="sheet-inline-field max-w-32">
                <span>Credits</span>
                <input v-model="sheet.credits" />
              </label>
              <button class="sheet-add-button mt-5" type="button" @click="addEquipment">Add</button>
            </div>
          </div>
          <div class="mt-4 space-y-2">
            <div
              v-for="(item, index) in equipment"
              :key="`equipment-${index}`"
              class="equipment-row"
            >
              <input
                v-model="equipment[index]"
                class="sheet-line-input"
                aria-label="Equipment item"
              />
              <button class="sheet-delete-button" type="button" @click="removeEquipment(index)">Delete</button>
            </div>
          </div>
        </section>

        <section class="sheet-panel">
          <h2 class="sheet-heading">Background</h2>
          <textarea v-model="sheet.background" class="mt-4 min-h-36" />
        </section>

        <section class="sheet-panel">
          <h2 class="sheet-heading">Special Abilities</h2>
          <textarea
            v-model="sheet.specialAbilitiesText"
            class="mt-4 min-h-28"
          />
        </section>

        <section class="sheet-panel">
          <h2 class="sheet-heading">The Force</h2>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <label class="sheet-field">
              <span>Force Sensitive?</span>
              <input v-model="sheet.force.forceSensitive" />
            </label>
            <label class="sheet-field">
              <span>Force Points</span>
              <input v-model="sheet.force.forcePoints" />
            </label>
            <label class="sheet-field">
              <span>Dark Side Points</span>
              <input v-model="sheet.force.darkSidePoints" />
            </label>
            <label class="sheet-field">
              <span>Control / Sense / Alter</span>
              <input v-model="sheet.forceSummary" />
            </label>
          </div>
        </section>

        <section class="sheet-panel">
          <h2 class="sheet-heading">Health</h2>
          <div class="mt-4 space-y-3">
            <label v-for="state in healthStates" :key="state" class="health-row">
              <span>{{ state }}</span>
              <input v-model="health" type="radio" name="health" :value="state" />
            </label>
          </div>
        </section>
      </section>

      <div class="mt-10 flex justify-center">
        <button class="sheet-export-button" type="button" @click="exportCharacterJson">
          Export to JSON
        </button>
      </div>
    </form>
  </main>
</template>
