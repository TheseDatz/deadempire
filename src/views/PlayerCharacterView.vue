<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { loadAllCharacters } from '../data/characters'
import { getSession, isAdminSession } from '../services/auth'
import { saveCharacterSheet } from '../services/characterSheets'

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
const equipmentPage = ref(1)
const emptySkillRows = ref({})
const health = ref('Healthy')
const canSaveCharacters = ref(false)
const isSaving = ref(false)
const saveMessage = ref('')
const saveErrorMessage = ref('')

const character = computed(() => {
  return allCharacters.value.find((entry) => entry.id === props.characterName) ?? null
})

onMounted(async () => {
  try {
    const [{ session }, data] = await Promise.all([getSession(), loadAllCharacters()])
    canSaveCharacters.value = isAdminSession(session)
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
    nextSheet.credits = nextSheet.credits ?? '0'
    nextSheet.newRepublicCredits = nextSheet.newRepublicCredits ?? '0'
    nextSheet.peggats = nextSheet.peggats ?? '0'
    nextSheet.requisitionTokens = nextSheet.requisitionTokens ?? '0'
    sheet.value = nextSheet
    weapons.value = (nextCharacter.weapons ?? []).map((weapon) => ({ ...weapon }))
    armor.value = (nextCharacter.armor ?? []).map((armorItem) => ({ ...armorItem }))
    equipment.value = [...(nextCharacter.equipment ?? [])]
    equipmentPage.value = 1
    emptySkillRows.value = Object.fromEntries(
      (nextSheet.attributes ?? []).map((attribute, index) => [
        emptySkillKey(attribute, index),
        Array.from({ length: 3 }, () => ({ name: '', dice: '' })),
      ]),
    )
    health.value = nextCharacter.health ?? 'Healthy'
  },
  { immediate: true },
)

const equipmentItemsPerPage = 5

const equipmentPageCount = computed(() => Math.max(1, Math.ceil(equipment.value.length / equipmentItemsPerPage)))

const equipmentStartIndex = computed(() => (equipmentPage.value - 1) * equipmentItemsPerPage)

const paginatedEquipment = computed(() => {
  return equipment.value
    .slice(equipmentStartIndex.value, equipmentStartIndex.value + equipmentItemsPerPage)
    .map((item, index) => ({
      item,
      index: equipmentStartIndex.value + index,
    }))
})

function addWeapon() {
  weapons.value.push({ name: '', range: '', damage: '' })
}

function addArmor() {
  armor.value.push({ name: '', strengthBonus: '', dexPenalty: '' })
}

function addEquipment() {
  equipment.value.push('')
  equipmentPage.value = equipmentPageCount.value
}

function removeWeapon(index) {
  const weaponName = weapons.value[index]?.name || 'this weapon'

  if (!window.confirm(`Delete ${weaponName}?`)) {
    return
  }

  weapons.value.splice(index, 1)
}

function removeArmor(index) {
  const armorName = armor.value[index]?.name || 'this armor'

  if (!window.confirm(`Delete ${armorName}?`)) {
    return
  }

  armor.value.splice(index, 1)
}

function removeEquipment(index) {
  const equipmentName = equipment.value[index] || 'this equipment item'

  if (!window.confirm(`Delete ${equipmentName}?`)) {
    return
  }

  equipment.value.splice(index, 1)
  equipmentPage.value = Math.min(equipmentPage.value, equipmentPageCount.value)
}

function previousEquipmentPage() {
  equipmentPage.value = Math.max(1, equipmentPage.value - 1)
}

function nextEquipmentPage() {
  equipmentPage.value = Math.min(equipmentPageCount.value, equipmentPage.value + 1)
}

function emptySkillKey(attribute, index) {
  return `${index}-${attribute.name}`
}

function buildCharacterJson() {
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
    credits: sheet.value.credits ?? '0',
    newRepublicCredits: sheet.value.newRepublicCredits ?? '0',
    peggats: sheet.value.peggats ?? '0',
    requisitionTokens: sheet.value.requisitionTokens ?? '0',
  }
  delete exportData.forceSummary
  delete exportData.specialAbilitiesText
  delete exportData._category
  return exportData
}

function exportCharacterJson() {
  const exportData = buildCharacterJson()
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sheet.value.id ?? 'character'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

async function saveCharacterToSupabase() {
  saveMessage.value = ''
  saveErrorMessage.value = ''
  isSaving.value = true

  const { error } = await saveCharacterSheet(buildCharacterJson(), sheet.value._category || 'player')

  if (error) {
    saveErrorMessage.value = error.message
  } else {
    saveMessage.value = 'Saved to Supabase.'
  }

  isSaving.value = false
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

function parseDiceCode(value) {
  const match = String(value ?? '').trim().match(/^(\d+)\s*d(?:\s*([+-])\s*(\d+))?$/i)

  if (!match) {
    return null
  }

  const diceCount = Number(match[1])
  const modifierValue = Number(match[3] ?? 0)
  const modifier = match[2] === '-' ? -modifierValue : modifierValue

  if (
    !Number.isInteger(diceCount) ||
    diceCount < 1 ||
    diceCount > 30 ||
    !Number.isInteger(modifier) ||
    modifier < -99 ||
    modifier > 99
  ) {
    return null
  }

  return { diceCount, modifier }
}

function isValidDiceCode(value) {
  return Boolean(parseDiceCode(value))
}

function rollDiceCode(value) {
  const parsedDice = parseDiceCode(value)

  if (!parsedDice) {
    return
  }

  window.dispatchEvent(
    new CustomEvent('sw6d-roll-dice', {
      detail: parsedDice,
    }),
  )
}
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
        <div class="sheet-panel">
          <h2 class="sheet-heading">Character Bio</h2>
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
          <section class="mt-5">
            <h2 class="sheet-heading">Health</h2>
            <div class="mt-4 space-y-3">
              <label v-for="state in healthStates" :key="state" class="health-row">
                <span>{{ state }}</span>
                <input v-model="health" type="radio" name="health" :value="state" />
              </label>
            </div>
          </section>
        </aside>

        <section class="sheet-panel sheet-panel-full">
          <h2 class="sheet-heading">Attributes & Skills</h2>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div v-for="(attribute, attributeIndex) in sheet.attributes ?? []" :key="attribute.name" class="attribute-block">
              <div class="flex items-center justify-between gap-3">
                <label class="sheet-inline-field flex-1">
                  <span>{{ attribute.name }}</span>
                  <span class="sheet-dice-input">
                    <input v-model="attribute.dice" />
                    <button
                      class="sheet-roll-button"
                      type="button"
                      :disabled="!isValidDiceCode(attribute.dice)"
                      :aria-label="`Roll ${attribute.name}`"
                      @click="rollDiceCode(attribute.dice)"
                    >
                      R
                    </button>
                  </span>
                </label>
              </div>

              <div class="mt-2 space-y-2">
                <div v-for="skill in attribute.skills" :key="skill.name" class="skill-row">
                  <input v-model="skill.name" />
                  <span class="sheet-dice-input">
                    <input v-model="skill.dice" />
                    <button
                      class="sheet-roll-button"
                      type="button"
                      :disabled="!isValidDiceCode(skill.dice)"
                      :aria-label="`Roll ${skill.name}`"
                      @click="rollDiceCode(skill.dice)"
                    >
                      R
                    </button>
                  </span>
                </div>
                <div
                  v-for="(emptySkill, slot) in emptySkillRows[emptySkillKey(attribute, attributeIndex)]"
                  :key="`empty-skill-${slot}`"
                  class="skill-row"
                >
                  <input v-model="emptySkill.name" />
                  <span class="sheet-dice-input">
                    <input v-model="emptySkill.dice" />
                    <button
                      class="sheet-roll-button"
                      type="button"
                      :disabled="!isValidDiceCode(emptySkill.dice)"
                      :aria-label="`Roll ${emptySkill.name || 'empty skill row'}`"
                      @click="rollDiceCode(emptySkill.dice)"
                    >
                      R
                    </button>
                  </span>
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
          <div class="sheet-section-header">
            <h2 class="sheet-heading">Equipment</h2>
            <button class="sheet-add-button" type="button" @click="addEquipment">Add</button>
          </div>
          <div class="mt-4 space-y-2">
            <div
              v-for="{ index } in paginatedEquipment"
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
          <div v-if="equipmentPageCount > 1" class="sheet-pagination">
            <button type="button" :disabled="equipmentPage === 1" @click="previousEquipmentPage">
              Previous
            </button>
            <span>Page {{ equipmentPage }} of {{ equipmentPageCount }}</span>
            <button
              type="button"
              :disabled="equipmentPage === equipmentPageCount"
              @click="nextEquipmentPage"
            >
              Next
            </button>
          </div>
        </section>

        <section class="sheet-panel">
          <h2 class="sheet-heading">Funds & Currency</h2>
          <div class="currency-grid mt-4">
            <label class="sheet-field">
              <span>Imperial Credits</span>
              <input v-model="sheet.credits" />
            </label>
            <label class="sheet-field">
              <span>New Republic Credits</span>
              <input v-model="sheet.newRepublicCredits" />
            </label>
            <label class="sheet-field">
              <span>Peggats</span>
              <input v-model="sheet.peggats" />
            </label>
            <label class="sheet-field">
              <span>Requisition Tokens</span>
              <input v-model="sheet.requisitionTokens" />
            </label>
          </div>
          <p class="currency-note">
            Conversions are approximate: 1 Republic credit is worth 2 to 3.5 Imperial credits,
            1 peggat is worth 40 to 50 Imperial credits, and 1 requisition token is worth about
            100 Imperial credits.
          </p>
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

        <section class="sheet-panel sheet-panel-full">
          <h2 class="sheet-heading">Background</h2>
          <textarea v-model="sheet.background" class="mt-4 min-h-36" />
        </section>
      </section>

      <div class="mt-10 flex flex-wrap justify-center gap-3">
        <button
          v-if="canSaveCharacters"
          class="sheet-export-button"
          type="button"
          :disabled="isSaving"
          @click="saveCharacterToSupabase"
        >
          Save to Supabase
        </button>
        <button class="sheet-export-button" type="button" @click="exportCharacterJson">
          Export to JSON
        </button>
      </div>

      <p v-if="saveMessage" class="profile-message mx-auto mt-5 max-w-2xl text-center">{{ saveMessage }}</p>
      <p v-if="saveErrorMessage" class="profile-message profile-message-error mx-auto mt-5 max-w-2xl text-center">
        {{ saveErrorMessage }}
      </p>
    </form>
  </main>
</template>
