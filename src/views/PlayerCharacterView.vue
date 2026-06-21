<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loadAllCharacters } from '../data/characters'
import { getSession } from '../services/auth'
import { canManageCharacterSheet, deleteCharacterSheet, saveCharacterSheet } from '../services/characterSheets'

const props = defineProps({
  characterName: {
    type: String,
    required: true,
  },
})

const router = useRouter()

const allCharacters = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const sheet = ref({})
const weapons = ref([])
const armor = ref([])
const equipment = ref([])
const forcePowers = ref([])
const advantages = ref([])
const equipmentPage = ref(1)
const health = ref('Healthy')
const healthCounts = ref({ stunned: 0, wounded: 0 })
const canSaveCharacters = ref(false)
const canViewBackstory = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const saveMessage = ref('')
const saveErrorMessage = ref('')
const isCombatRolling = ref(false)
const combatActionCount = ref(1)
const canViewCharacterPhoto = ref(false)

const character = computed(() => {
  return allCharacters.value.find((entry) => entry.id === props.characterName) ?? null
})
const isForceSensitive = computed(() => {
  return String(sheet.value.force?.forceSensitive ?? '').trim().toLowerCase() === 'yes'
})
const characterPhotoAlt = computed(() => sheet.value.name || 'Character illustration')
const healthClass = computed(() => {
  const normalizedHealth = String(health.value || '').trim().toLowerCase().replace(/\s+/g, '-')
  return normalizedHealth ? `character-sheet-health-${normalizedHealth}` : ''
})

onMounted(async () => {
  try {
    const [{ session }, data] = await Promise.all([getSession(), loadAllCharacters()])
    canViewCharacterPhoto.value = Boolean(session)
    allCharacters.value = data.allCharacters

    if (!character.value) {
      errorMessage.value = 'Character file not found.'
    } else {
      const { canManage, error } = await canManageCharacterSheet(character.value._slug)

      if (error) {
        errorMessage.value = error.message
      } else {
        canSaveCharacters.value = canManage
        canViewBackstory.value = canManage
      }
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
    forcePowers.value = (nextCharacter.forcePowers ?? []).map((power) => ({ ...power }))
    advantages.value = (nextCharacter.advantages ?? []).map((item) => ({ ...item }))
    equipmentPage.value = 1
    health.value = nextCharacter.health ?? 'Healthy'
    healthCounts.value = {
      stunned: Math.max(0, Number(nextCharacter.healthCounts?.stunned ?? 0)),
      wounded: Math.min(2, Math.max(0, Number(nextCharacter.healthCounts?.wounded ?? 0))),
    }
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

function addForcePower() {
  forcePowers.value.push({ name: '', difficulty: '', description: '' })
}

function removeForcePower(index) {
  const powerName = forcePowers.value[index]?.name || 'this Force power'

  if (!window.confirm(`Delete ${powerName}?`)) {
    return
  }

  forcePowers.value.splice(index, 1)
}

function addAdvantage() {
  advantages.value.push({ name: '', description: '' })
}

function removeAdvantage(index) {
  const advantageName = advantages.value[index]?.name || 'this advantage or disadvantage'

  if (!window.confirm(`Delete ${advantageName}?`)) {
    return
  }

  advantages.value.splice(index, 1)
}

function addSkill(attribute) {
  attribute.skills = attribute.skills ?? []
  attribute.skills.push({ name: '', dice: '' })
}

function removeSkill(attribute, index) {
  const skillName = attribute.skills?.[index]?.name || 'this skill'

  if (!window.confirm(`Delete ${skillName}?`)) {
    return
  }

  attribute.skills.splice(index, 1)
}

function incrementHealthCount(key) {
  const limit = key === 'wounded' ? 2 : Infinity
  healthCounts.value[key] = Math.min(limit, Number(healthCounts.value[key] || 0) + 1)
}

function decrementHealthCount(key) {
  healthCounts.value[key] = Math.max(0, Number(healthCounts.value[key] || 0) - 1)
}

function normalizeHealthCount(key) {
  const limit = key === 'wounded' ? 2 : Infinity
  healthCounts.value[key] = Math.min(limit, Math.max(0, Math.floor(Number(healthCounts.value[key] || 0))))
}

function previousEquipmentPage() {
  equipmentPage.value = Math.max(1, equipmentPage.value - 1)
}

function nextEquipmentPage() {
  equipmentPage.value = Math.min(equipmentPageCount.value, equipmentPage.value + 1)
}

function buildCharacterJson() {
  const attributes = (sheet.value.attributes ?? []).map((attribute) => ({
    ...attribute,
    skills: (attribute.skills ?? []).filter((skill) => skill.name?.trim() || skill.dice?.trim()),
  }))
  const quote = sheet.value.quote ?? sheet.value.tagline ?? ''

  const exportData = {
    ...sheet.value,
    attributes,
    tagline: quote,
    quote,
    specialAbilities: (sheet.value.specialAbilitiesText ?? '')
      .split('\n')
      .map((ability) => ability.trim())
      .filter(Boolean),
    force: {
      ...sheet.value.force,
    },
    forcePowers: forcePowers.value,
    advantages: advantages.value,
    weapons: weapons.value,
    armor: armor.value,
    equipment: equipment.value,
    health: health.value,
    healthCounts: healthCounts.value,
    credits: sheet.value.credits ?? '0',
    newRepublicCredits: sheet.value.newRepublicCredits ?? '0',
    peggats: sheet.value.peggats ?? '0',
    requisitionTokens: sheet.value.requisitionTokens ?? '0',
  }
  delete exportData.forceSummary
  delete exportData.specialAbilitiesText
  delete exportData._category
  delete exportData._slug
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

  if (!window.confirm('Save this character sheet and overwrite the database copy?')) {
    return
  }

  isSaving.value = true

  const { error } = await saveCharacterSheet(buildCharacterJson(), sheet.value._slug, sheet.value._category || 'player')

  if (error) {
    saveErrorMessage.value = error.message
  } else {
    saveMessage.value = 'Saved.'
  }

  isSaving.value = false
}

async function deleteCharacterFromSupabase() {
  saveMessage.value = ''
  saveErrorMessage.value = ''

  const characterName = sheet.value.name || 'this character sheet'

  if (!window.confirm(`Delete ${characterName}? This cannot be undone.`)) {
    return
  }

  isDeleting.value = true

  const { error } = await deleteCharacterSheet(sheet.value._slug)

  if (error) {
    saveErrorMessage.value = error.message
    isDeleting.value = false
  } else {
    router.push('/profile')
  }
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

function isValidRoll(value) {
  return isValidDiceCode(applyDiceAdjustments(value, [combatPenalty()]))
}

function parseDiceBonus(value) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return { diceCount: 0, modifier: 0 }
  }

  const signedPipMatch = normalized.match(/^([+-])\s*(\d+)$/)

  if (signedPipMatch) {
    const sign = signedPipMatch[1] === '-' ? -1 : 1
    return { diceCount: 0, modifier: sign * Number(signedPipMatch[2]) }
  }

  const signedDiceMatch = normalized.match(/^([+-])\s*(\d+)\s*d(?:\s*([+-])\s*(\d+))?$/i)

  if (signedDiceMatch) {
    const sign = signedDiceMatch[1] === '-' ? -1 : 1
    const diceCount = sign * Number(signedDiceMatch[2])
    const pipSign = signedDiceMatch[3] === '-' ? -1 : 1
    const modifier = sign * pipSign * Number(signedDiceMatch[4] ?? 0)
    return { diceCount, modifier }
  }

  return parseDiceCode(normalized) ?? null
}

function parseDexPenalty(value) {
  const normalized = String(value ?? '').trim()

  if (!normalized) {
    return { diceCount: 0, modifier: 0 }
  }

  const adjustment = parseDiceBonus(normalized)

  if (!adjustment) {
    return null
  }

  if (normalized.startsWith('-')) {
    return adjustment
  }

  return {
    diceCount: -Math.abs(adjustment.diceCount),
    modifier: -Math.abs(adjustment.modifier),
  }
}

function totalArmorDexPenalty() {
  return armor.value.reduce(
    (total, armorItem) => {
      const penalty = parseDexPenalty(armorItem.dexPenalty)

      if (!penalty) {
        return total
      }

      return {
        diceCount: total.diceCount + penalty.diceCount,
        modifier: total.modifier + penalty.modifier,
      }
    },
    { diceCount: 0, modifier: 0 },
  )
}

function dicePartsToCode(diceCount, modifier) {
  if (diceCount < 1) {
    return ''
  }

  if (modifier === 0) {
    return `${diceCount}D`
  }

  return `${diceCount}D${modifier > 0 ? '+' : ''}${modifier}`
}

function combatPenalty() {
  if (!isCombatRolling.value) {
    return { diceCount: 0, modifier: 0 }
  }

  return {
    diceCount: -Math.max(0, Number(combatActionCount.value || 1) - 1),
    modifier: 0,
  }
}

function healthRollPenalty() {
  return {
    diceCount: -(Number(healthCounts.value.stunned || 0) + Number(healthCounts.value.wounded || 0)),
    modifier: 0,
  }
}

function applyDiceAdjustments(value, adjustments = []) {
  const dice = parseDiceCode(value)

  if (!dice) {
    return ''
  }

  const adjusted = adjustments.reduce(
    (total, adjustment) => ({
      diceCount: total.diceCount + adjustment.diceCount,
      modifier: total.modifier + adjustment.modifier,
    }),
    dice,
  )

  return dicePartsToCode(adjusted.diceCount, adjusted.modifier)
}

function dexAdjustedDiceCode(value) {
  return applyDiceAdjustments(value, [totalArmorDexPenalty()])
}

function strengthDiceCode() {
  const strength = (sheet.value.attributes ?? []).find((attribute) => attribute.name === 'Strength')
  return strength?.dice ?? ''
}

function armorStrengthDiceCode(armorItem) {
  const strength = parseDiceCode(strengthDiceCode())
  const bonus = parseDiceBonus(armorItem.strengthBonus)

  if (!strength || !bonus) {
    return ''
  }

  const diceCount = strength.diceCount + bonus.diceCount
  const modifier = strength.modifier + bonus.modifier

  if (diceCount < 1) {
    return ''
  }

  return dicePartsToCode(diceCount, modifier)
}

function isValidArmorStrength(armorItem) {
  return isValidDiceCode(armorStrengthDiceCode(armorItem))
}

function rollRawDiceCode(value) {
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

function rollDiceCode(value) {
  rollRawDiceCode(applyDiceAdjustments(value, [combatPenalty()]))
}

function rollArmorStrength(armorItem) {
  rollRawDiceCode(armorStrengthDiceCode(armorItem))
}

function rollAttributeDice(attribute) {
  const diceCode = attribute.name === 'Dexterity' ? dexAdjustedDiceCode(attribute.dice) : attribute.dice
  rollDiceCode(applyDiceAdjustments(diceCode, [healthRollPenalty()]))
}

function rollSkillDice(attribute, skill) {
  const diceCode = attribute.name === 'Dexterity' ? dexAdjustedDiceCode(skill.dice) : skill.dice
  rollDiceCode(applyDiceAdjustments(diceCode, [healthRollPenalty()]))
}

function isValidAttributeRoll(attribute) {
  const diceCode = attribute.name === 'Dexterity' ? dexAdjustedDiceCode(attribute.dice) : attribute.dice
  return isValidDiceCode(applyDiceAdjustments(diceCode, [healthRollPenalty(), combatPenalty()]))
}

function isValidSkillRoll(attribute, skill) {
  const diceCode = attribute.name === 'Dexterity' ? dexAdjustedDiceCode(skill.dice) : skill.dice
  return isValidDiceCode(applyDiceAdjustments(diceCode, [healthRollPenalty(), combatPenalty()]))
}

function normalizeCombatActionCount() {
  combatActionCount.value = Math.max(1, Math.floor(Number(combatActionCount.value || 1)))
}

function decreaseCombatActions() {
  combatActionCount.value = Math.max(1, Number(combatActionCount.value || 1) - 1)
}

function increaseCombatActions() {
  combatActionCount.value = Number(combatActionCount.value || 1) + 1
}
</script>

<template>
  <main class="character-sheet-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <div v-if="isLoading" class="mx-auto max-w-7xl text-cyan-100/80">Loading character file...</div>
    <div v-else-if="errorMessage" class="mx-auto max-w-7xl text-red-200">{{ errorMessage }}</div>

    <form v-else class="character-sheet mx-auto max-w-7xl" :class="healthClass">
      <header class="sheet-title">
        <p class="text-sm uppercase tracking-[0.32em] text-cyan-100/80">Dead Empire</p>
        <h1 class="font-serif text-5xl font-bold text-white">{{ sheet.name || 'Unnamed Character' }}</h1>
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
          <img v-if="canViewCharacterPhoto && sheet.photo" class="sheet-portrait" :src="sheet.photo" :alt="characterPhotoAlt" />
          <div v-else class="sheet-portrait sheet-portrait-empty" aria-hidden="true"></div>
          <label class="sheet-field mt-4">
            <span>Character Illustration</span>
            <input v-model="sheet.photo" />
          </label>
          <section class="mt-5">
            <h2 class="sheet-heading">Health</h2>
            <div class="mt-4 space-y-3">
              <label v-for="state in healthStates" :key="state" class="health-row">
                <span>{{ state }}</span>
                <span class="health-row-controls">
                  <span v-if="state === 'Stunned'" class="health-count-control">
                    <button type="button" @click.prevent="decrementHealthCount('stunned')">-</button>
                    <input
                      v-model.number="healthCounts.stunned"
                      type="number"
                      min="0"
                      aria-label="Stunned count"
                      @change="normalizeHealthCount('stunned')"
                    />
                    <button type="button" @click.prevent="incrementHealthCount('stunned')">+</button>
                  </span>
                  <span v-else-if="state === 'Wounded'" class="health-count-control">
                    <button type="button" @click.prevent="decrementHealthCount('wounded')">-</button>
                    <input
                      v-model.number="healthCounts.wounded"
                      type="number"
                      min="0"
                      max="2"
                      aria-label="Wounded count"
                      @change="normalizeHealthCount('wounded')"
                    />
                    <button type="button" @click.prevent="incrementHealthCount('wounded')">+</button>
                  </span>
                  <span v-else class="health-count-spacer" aria-hidden="true"></span>
                  <input v-model="health" type="radio" name="health" :value="state" />
                </span>
              </label>
            </div>
          </section>
        </aside>

        <section class="sheet-panel sheet-panel-full">
          <div class="sheet-heading-row">
            <h2 class="sheet-heading">Attributes & Skills</h2>
            <div class="combat-roll-controls">
              <label class="combat-roll-toggle">
                <input v-model="isCombatRolling" type="checkbox" />
                <span>Combat</span>
              </label>
              <label v-if="isCombatRolling" class="combat-action-control">
                <span>Number of Actions</span>
                <button type="button" @click="decreaseCombatActions">-</button>
                <input
                  v-model.number="combatActionCount"
                  type="number"
                  min="1"
                  step="1"
                  @change="normalizeCombatActionCount"
                />
                <button type="button" @click="increaseCombatActions">+</button>
              </label>
            </div>
          </div>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div v-for="attribute in sheet.attributes ?? []" :key="attribute.name" class="attribute-block">
              <div class="flex items-center justify-between gap-3">
                <label class="sheet-inline-field flex-1">
                  <span class="sheet-attribute-name">
                    {{ attribute.name }}
                    <button class="sheet-icon-add-button" type="button" :aria-label="`Add ${attribute.name} skill`" @click.prevent="addSkill(attribute)">+</button>
                  </span>
                  <span class="sheet-dice-input">
                    <input v-model="attribute.dice" />
                    <button
                      class="sheet-roll-button"
                      type="button"
                      :disabled="!isValidAttributeRoll(attribute)"
                      :aria-label="`Roll ${attribute.name}`"
                      @click="rollAttributeDice(attribute)"
                    >
                      R
                    </button>
                  </span>
                </label>
              </div>

              <div class="mt-2 space-y-2">
                <div
                  v-for="(skill, skillIndex) in attribute.skills ?? []"
                  :key="`${attribute.name}-skill-${skillIndex}`"
                  class="skill-row skill-row-with-action"
                >
                  <button class="sheet-icon-delete-button" type="button" :aria-label="`Delete ${skill.name || 'skill'}`" @click="removeSkill(attribute, skillIndex)">-</button>
                  <input v-model="skill.name" />
                  <span class="sheet-dice-input">
                    <input v-model="skill.dice" />
                    <button
                      class="sheet-roll-button"
                      type="button"
                      :disabled="!isValidSkillRoll(attribute, skill)"
                      :aria-label="`Roll ${skill.name}`"
                      @click="rollSkillDice(attribute, skill)"
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
              <span aria-hidden="true"></span>
              <span>Weapon</span>
              <span>Range</span>
              <span>Damage</span>
            </div>
            <div v-for="(weapon, index) in weapons" :key="`weapon-${index}`" class="sheet-table-row sheet-table-row-with-action">
              <button class="sheet-icon-delete-button" type="button" :aria-label="`Delete ${weapon.name || 'weapon'}`" @click="removeWeapon(index)">-</button>
              <input v-model="weapon.name" aria-label="Weapon name" />
              <input v-model="weapon.range" aria-label="Weapon range" />
              <span class="sheet-dice-input">
                <input v-model="weapon.damage" aria-label="Weapon damage" />
                <button
                  class="sheet-roll-button"
                  type="button"
                  :disabled="!isValidDiceCode(weapon.damage)"
                  :aria-label="`Roll ${weapon.name || 'weapon'} damage`"
                  @click="rollRawDiceCode(weapon.damage)"
                >
                  R
                </button>
              </span>
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
              <span aria-hidden="true"></span>
              <span>Armor</span>
              <span>Str Bonus</span>
              <span>Dex Penalty</span>
            </div>
            <div v-for="(armorItem, index) in armor" :key="`armor-${index}`" class="sheet-table-row sheet-table-row-with-action">
              <button class="sheet-icon-delete-button" type="button" :aria-label="`Delete ${armorItem.name || 'armor'}`" @click="removeArmor(index)">-</button>
              <input v-model="armorItem.name" aria-label="Armor name" />
              <span class="sheet-dice-input">
                <input v-model="armorItem.strengthBonus" aria-label="Armor strength bonus" />
                <button
                  class="sheet-roll-button"
                  type="button"
                  :disabled="!isValidArmorStrength(armorItem)"
                  :aria-label="`Roll ${armorItem.name || 'armor'} strength total`"
                  @click="rollArmorStrength(armorItem)"
                >
                  R
                </button>
              </span>
              <input v-model="armorItem.dexPenalty" aria-label="Armor dexterity penalty" />
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
              <button class="sheet-icon-delete-button" type="button" :aria-label="`Delete ${equipment[index] || 'equipment item'}`" @click="removeEquipment(index)">-</button>
              <input
                v-model="equipment[index]"
                class="sheet-line-input"
                aria-label="Equipment item"
              />
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
            class="mt-4 min-h-36"
          />
        </section>

        <section class="sheet-panel">
          <h2 class="sheet-heading">The Force</h2>
          <div class="mt-4 grid grid-cols-3 gap-3">
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
          </div>

          <div class="mt-4 grid grid-cols-3 gap-3">
            <label class="sheet-field">
              <span>Control</span>
              <span class="sheet-dice-input">
                <input v-model="sheet.force.control" />
                <button class="sheet-roll-button" type="button" :disabled="!isValidRoll(sheet.force.control)" @click="rollDiceCode(sheet.force.control)">
                  R
                </button>
              </span>
            </label>
            <label class="sheet-field">
              <span>Sense</span>
              <span class="sheet-dice-input">
                <input v-model="sheet.force.sense" />
                <button class="sheet-roll-button" type="button" :disabled="!isValidRoll(sheet.force.sense)" @click="rollDiceCode(sheet.force.sense)">
                  R
                </button>
              </span>
            </label>
            <label class="sheet-field">
              <span>Alter</span>
              <span class="sheet-dice-input">
                <input v-model="sheet.force.alter" />
                <button class="sheet-roll-button" type="button" :disabled="!isValidRoll(sheet.force.alter)" @click="rollDiceCode(sheet.force.alter)">
                  R
                </button>
              </span>
            </label>
          </div>
        </section>

        <section v-if="isForceSensitive" class="sheet-panel sheet-panel-full">
          <div class="sheet-section-header">
            <h2 class="sheet-heading">Force Powers</h2>
            <button class="sheet-add-button" type="button" @click="addForcePower">Add</button>
          </div>
          <p v-if="forcePowers.length === 0" class="mt-4 text-cyan-100/70">No Force powers entered yet.</p>
          <div v-for="(power, index) in forcePowers" :key="`force-power-${index}`" class="force-power-row mt-4">
            <label class="sheet-field">
              <span class="sheet-field-label-with-action">
                Name
                <button class="sheet-icon-delete-button" type="button" :aria-label="`Delete ${power.name || 'Force power'}`" @click.prevent="removeForcePower(index)">-</button>
              </span>
              <input v-model="power.name" />
            </label>
            <label class="sheet-field">
              <span>Difficulty</span>
              <input v-model="power.difficulty" />
            </label>
            <label class="sheet-field">
              <span>Description</span>
              <textarea v-model="power.description" rows="3" />
            </label>
          </div>
        </section>

        <section class="sheet-panel sheet-panel-full">
          <div class="sheet-section-header">
            <h2 class="sheet-heading">Advantages &amp; Disadvantages</h2>
            <button class="sheet-add-button" type="button" @click="addAdvantage">Add</button>
          </div>
          <p v-if="advantages.length === 0" class="mt-4 text-cyan-100/70">
            No advantages or disadvantages entered yet.
          </p>
          <div
            v-for="(item, index) in advantages"
            :key="`advantage-${index}`"
            class="advantage-row mt-4"
          >
            <label class="sheet-field">
              <span class="sheet-field-label-with-action">
                Name
                <button class="sheet-icon-delete-button" type="button" :aria-label="`Delete ${item.name || 'advantage or disadvantage'}`" @click.prevent="removeAdvantage(index)">-</button>
              </span>
              <input v-model="item.name" />
            </label>
            <label class="sheet-field">
              <span>Description</span>
              <input v-model="item.description" />
            </label>
          </div>
        </section>

        <section v-if="canViewBackstory" class="sheet-panel sheet-panel-full">
          <h2 class="sheet-heading">Background</h2>
          <textarea v-model="sheet.background" class="mt-4 min-h-36" />
        </section>
      </section>

      <div class="mt-10 flex flex-wrap justify-center gap-3">
        <button
          v-if="canSaveCharacters"
          class="sheet-export-button"
          type="button"
          :disabled="isSaving || isDeleting"
          @click="saveCharacterToSupabase"
        >
          Save
        </button>
        <button
          v-if="canSaveCharacters"
          class="sheet-export-button sheet-danger-button"
          type="button"
          :disabled="isSaving || isDeleting"
          @click="deleteCharacterFromSupabase"
        >
          Delete
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
