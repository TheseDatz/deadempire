<script setup>
import { computed, reactive, ref } from 'vue'

const ATTRIBUTE_NAMES = ['Dexterity', 'Knowledge', 'Mechanical', 'Perception', 'Strength', 'Technical']
const FORCE_SKILLS = ['Control', 'Sense', 'Alter']
const SKILL_DICE_LIMIT = 7
const SUGGESTED_SKILLS = {
  Dexterity: ['Blaster', 'Dodge', 'Melee Combat', 'Melee Parry', 'Pick Pocket'],
  Knowledge: ['Languages', 'Planetary Systems', 'Streetwise', 'Survival', 'Value'],
  Mechanical: ['Astrogation', 'Repulsorlift Operation', 'Sensors', 'Space Transports', 'Starship Gunnery'],
  Perception: ['Bargain', 'Con', 'Hide', 'Search', 'Sneak'],
  Strength: ['Brawling', 'Climbing/Jumping', 'Lifting', 'Stamina', 'Swimming'],
  Technical: ['Computer Programming/Repair', 'Droid Programming', 'First Aid', 'Security', 'Space Transports Repair'],
}

const isBasicInfoOpen = ref(true)
const isAttributesOpen = ref(false)
const isSpecialAbilitiesOpen = ref(false)
const isForceOpen = ref(false)
const isSkillsOpen = ref(false)
const isEquipmentOpen = ref(false)
const template = reactive({
  characterName: '',
  playerName: '',
  type: '',
  species: '',
  attributeDice: 12,
  attributes: Object.fromEntries(
    ATTRIBUTE_NAMES.map((name) => [
      name,
      {
        dice: 2,
        pips: 0,
      },
    ]),
  ),
  move: '',
  hasNoSpecialAbilities: false,
  specialAbilities: '',
  forceSensitive: false,
  forceSkills: Object.fromEntries(
    FORCE_SKILLS.map((name) => [
      name,
      {
        dice: 0,
        pips: 0,
      },
    ]),
  ),
  forcePowers: Array.from({ length: 3 }, () => ({ name: '', difficulty: '', description: '' })),
  skills: Object.fromEntries(ATTRIBUTE_NAMES.map((name) => [name, []])),
  credits: '250',
  weapons: [],
  armor: [],
  equipment: [],
})

const baseAttributePips = computed(() => diceToPips(template.attributeDice))
const totalAttributePips = computed(() => baseAttributePips.value + diceToPips(6))
const assignedAttributePips = computed(() => {
  const attributePips = ATTRIBUTE_NAMES.reduce((total, name) => {
    const attribute = template.attributes[name]
    return total + diceToPips(attribute.dice) + Number(attribute.pips || 0)
  }, 0)

  return FORCE_SKILLS.reduce((total, name) => {
    const skill = template.forceSkills[name]
    return total + diceToPips(skill.dice) + Number(skill.pips || 0)
  }, attributePips)
})
const remainingAttributePips = computed(() => totalAttributePips.value - assignedAttributePips.value)
const totalSkillPips = computed(() => diceToPips(SKILL_DICE_LIMIT))
const assignedSkillPips = computed(() => {
  return ATTRIBUTE_NAMES.reduce((attributeTotal, attributeName) => {
    return (
      attributeTotal +
      template.skills[attributeName].reduce((skillTotal, skill) => {
        return skillTotal + diceToPips(skill.dice) + Number(skill.pips || 0)
      }, 0)
    )
  }, 0)
})
const remainingSkillPips = computed(() => totalSkillPips.value - assignedSkillPips.value)
const basicInfoComplete = computed(() => {
  return Boolean(
    template.characterName.trim() &&
      template.playerName.trim() &&
      template.type.trim() &&
      template.species.trim(),
  )
})
const attributesComplete = computed(() => {
  return (
    Number(template.attributeDice) > 0 &&
    template.move.trim() &&
    remainingAttributePips.value === 0 &&
    ATTRIBUTE_NAMES.every((name) => {
      const attribute = template.attributes[name]
      return Number(attribute.dice) > 0 && Number(attribute.pips) >= 0 && Number(attribute.pips) <= 2
    })
  )
})
const specialAbilitiesComplete = computed(() => {
  return template.hasNoSpecialAbilities || Boolean(template.specialAbilities.trim())
})
const forceComplete = computed(() => {
  return (
    remainingAttributePips.value >= 0 &&
    FORCE_SKILLS.every((name) => {
      const skill = template.forceSkills[name]
      return forceSkillPips(skill) >= 0 && forceSkillPips(skill) <= 3
    }) &&
    forcePowersComplete.value
  )
})
const forcePoints = computed(() => (template.forceSensitive ? 2 : 1))
const availableForcePowerSlots = computed(() => {
  if (!template.forceSensitive) {
    return 0
  }

  return FORCE_SKILLS.filter((name) => forceSkillPips(template.forceSkills[name]) >= 3).length
})
const forcePowersComplete = computed(() => {
  if (!template.forceSensitive) {
    return true
  }

  return template.forcePowers.slice(0, availableForcePowerSlots.value).every((power) => {
    const hasAnyValue = power.name.trim() || power.difficulty.trim() || power.description.trim()
    return !hasAnyValue || (power.name.trim() && power.difficulty.trim() && power.description.trim())
  })
})
const skillsComplete = computed(() => {
  const skills = ATTRIBUTE_NAMES.flatMap((name) => template.skills[name])

  return (
    skills.length > 0 &&
    remainingSkillPips.value === 0 &&
    skills.every((skill) => skill.name.trim() && Number(skill.dice) >= 0 && Number(skill.pips) >= 0 && Number(skill.pips) <= 2)
  )
})
const equipmentComplete = computed(() => {
  return (
    template.weapons.every((weapon) => weapon.name.trim() && weapon.range.trim() && weapon.damage.trim()) &&
    template.armor.every((armorItem) => armorItem.name.trim() && armorItem.strengthBonus.trim() && armorItem.dexPenalty.trim()) &&
    template.equipment.every((item) => item.trim())
  )
})

function diceToPips(dice) {
  return Number(dice || 0) * 3
}

function formatPips(pips) {
  const sign = pips < 0 ? '-' : ''
  const absolutePips = Math.abs(pips)
  const dice = Math.floor(absolutePips / 3)
  const pipRemainder = absolutePips % 3

  if (pipRemainder === 0) {
    return `${sign}${dice}D`
  }

  return `${sign}${dice}D+${pipRemainder}`
}

function attributePips(attributeName) {
  const attribute = template.attributes[attributeName]
  return diceToPips(attribute.dice) + Number(attribute.pips || 0)
}

function skillTotalPips(attributeName, skill) {
  return attributePips(attributeName) + diceToPips(skill.dice) + Number(skill.pips || 0)
}

function forceSkillPips(skill) {
  return diceToPips(skill.dice) + Number(skill.pips || 0)
}

function normalizePips(attribute) {
  const pips = Number(attribute.pips || 0)

  if (pips >= 3) {
    attribute.dice = Number(attribute.dice || 0) + Math.floor(pips / 3)
    attribute.pips = pips % 3
  } else if (pips < 0) {
    attribute.pips = 0
  }
}

function normalizeForcePips(skill) {
  const cappedPips = Math.min(3, Math.max(0, forceSkillPips(skill)))
  skill.dice = Math.floor(cappedPips / 3)
  skill.pips = cappedPips % 3
}

function addSkill(attributeName, skillName = '') {
  template.skills[attributeName].push({
    name: skillName,
    dice: 0,
    pips: 0,
  })
}

function removeSkill(attributeName, index) {
  template.skills[attributeName].splice(index, 1)
}

function addWeapon() {
  template.weapons.push({ name: '', range: '', damage: '' })
}

function removeWeapon(index) {
  template.weapons.splice(index, 1)
}

function addArmor() {
  template.armor.push({ name: '', strengthBonus: '', dexPenalty: '' })
}

function removeArmor(index) {
  template.armor.splice(index, 1)
}

function addEquipment() {
  template.equipment.push('')
}

function removeEquipment(index) {
  template.equipment.splice(index, 1)
}
</script>

<template>
  <main class="character-wizard-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-5xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Character Creation</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Character Wizard</h1>

      <section class="wizard-shell mt-10">
        <article class="wizard-accordion">
          <button
            class="wizard-accordion-header"
            type="button"
            :aria-expanded="isBasicInfoOpen"
            @click="isBasicInfoOpen = !isBasicInfoOpen"
          >
            <span>Basic Information</span>
            <svg
              class="wizard-accordion-cue"
              :class="{ 'wizard-accordion-cue-closed': !isBasicInfoOpen }"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path :d="isBasicInfoOpen ? 'M6 9l6 6 6-6' : 'M6 12h12'" />
            </svg>
            <span
              class="wizard-check"
              :class="{ 'wizard-check-complete': basicInfoComplete }"
              aria-label="Section complete"
            >
              {{ basicInfoComplete ? '✓' : '×' }}
            </span>
          </button>

          <div v-if="isBasicInfoOpen" class="wizard-accordion-body">
            <p>
              To begin creating your character you must create a template. While choosing a pre-existing template from one of the
              available resources is perfectly acceptable in the rules, this wizard is designed to create the perfect character for you.
            </p>

            <p>Information about creating a template is on page 25 of the REUP rulebook.</p>

            <section class="wizard-step">
              <div class="wizard-two-column">
                <label class="wizard-field">
                  <span>Character Name</span>
                  <input v-model="template.characterName" type="text" />
                </label>
                <label class="wizard-field">
                  <span>Player Name</span>
                  <input v-model="template.playerName" type="text" />
                </label>
              </div>
            </section>

            <section class="wizard-step">
              <label class="wizard-field">
                <span>Type</span>
                <input v-model="template.type" type="text" />
              </label>
              <p>
                Each character template has a type. A type is simply a slogan for the template, ie. "Smuggler" or "Brash Pilot".
                Choose something that vaguely describes your character or use the one written on your template of choice.
              </p>
            </section>

            <section class="wizard-step">
              <label class="wizard-field">
                <span>Species</span>
                <input v-model="template.species" type="text" />
              </label>
              <p>
                Select which species your character belongs to. The rancorpit has a large resource of alien species
                <a href="https://www.rancorpit.com/forums/downloads/Rancor%20Pit%20Stat%20Compilations/Aliens_Stats.pdf" target="_blank" rel="noreferrer">here</a>,
                the REUP species are found on page 279. You may also play as droids; rancorpit has a large fan-compiled resource
                <a href="https://www.rancorpit.com/forums/downloads/Rancor%20Pit%20Stat%20Compilations/Droids_Stats.pdf" target="_blank" rel="noreferrer">here</a>.
              </p>
            </section>
          </div>
        </article>

        <article class="wizard-accordion">
          <button
            class="wizard-accordion-header"
            type="button"
            :aria-expanded="isAttributesOpen"
            @click="isAttributesOpen = !isAttributesOpen"
          >
            <span>Attributes</span>
            <svg
              class="wizard-accordion-cue"
              :class="{ 'wizard-accordion-cue-closed': !isAttributesOpen }"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path :d="isAttributesOpen ? 'M6 9l6 6 6-6' : 'M6 12h12'" />
            </svg>
            <span
              class="wizard-check"
              :class="{ 'wizard-check-complete': attributesComplete }"
              aria-label="Section complete"
            >
              {{ attributesComplete ? '✓' : '×' }}
            </span>
          </button>

          <div v-if="isAttributesOpen" class="wizard-accordion-body">
            <section class="wizard-step">
              <label class="wizard-field wizard-field-short">
                <span>Attribute Dice</span>
                <input v-model.number="template.attributeDice" type="number" min="0" step="1" />
              </label>
              <p>
                Each species has an associated Attribute dice found on their stats page. For a standard human the attribute dice is
                "12D".
              </p>
              <p class="wizard-total">
                Total attribute dice: {{ template.attributeDice || 0 }}D + 6D = {{ formatPips(totalAttributePips) }}
              </p>
            </section>

            <section class="wizard-step">
              <h2>Assigning Dice</h2>
              <p>
                Each species has a minimum and a maximum that each attribute can be denoted with minD/maxD. Spend your total
                attribute dice as you wish.
              </p>

              <div class="wizard-attribute-meter" :class="{ 'wizard-attribute-over': remainingAttributePips < 0 }">
                Assigned {{ formatPips(assignedAttributePips) }} / {{ formatPips(totalAttributePips) }}
                <span v-if="remainingAttributePips >= 0">({{ formatPips(remainingAttributePips) }} remaining)</span>
                <span v-else>({{ formatPips(remainingAttributePips) }} over)</span>
              </div>

              <div class="wizard-attribute-grid">
                <fieldset v-for="name in ATTRIBUTE_NAMES" :key="name" class="wizard-attribute-field">
                  <legend>{{ name }}</legend>
                  <label>
                    <span>Dice</span>
                    <input v-model.number="template.attributes[name].dice" type="number" min="0" step="1" />
                  </label>
                  <label>
                    <span>Pips</span>
                    <input
                      v-model.number="template.attributes[name].pips"
                      type="number"
                      min="0"
                      max="2"
                      step="1"
                      @change="normalizePips(template.attributes[name])"
                    />
                  </label>
                </fieldset>
              </div>

              <label class="wizard-field wizard-field-short mt-4">
                <span>Move</span>
                <input v-model="template.move" type="text" />
              </label>
            </section>
          </div>
        </article>

        <article class="wizard-accordion">
          <button
            class="wizard-accordion-header"
            type="button"
            :aria-expanded="isSpecialAbilitiesOpen"
            @click="isSpecialAbilitiesOpen = !isSpecialAbilitiesOpen"
          >
            <span>Special Abilities</span>
            <svg
              class="wizard-accordion-cue"
              :class="{ 'wizard-accordion-cue-closed': !isSpecialAbilitiesOpen }"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path :d="isSpecialAbilitiesOpen ? 'M6 9l6 6 6-6' : 'M6 12h12'" />
            </svg>
            <span
              class="wizard-check"
              :class="{ 'wizard-check-complete': specialAbilitiesComplete }"
              aria-label="Section complete"
            >
              {{ specialAbilitiesComplete ? '✓' : '×' }}
            </span>
          </button>

          <div v-if="isSpecialAbilitiesOpen" class="wizard-accordion-body">
            <section class="wizard-step">
              <p>Some species have special abilities, write them down here.</p>

              <label class="wizard-field">
                <span>Special Abilities</span>
                <textarea
                  v-model="template.specialAbilities"
                  class="wizard-textarea"
                  rows="8"
                  :disabled="template.hasNoSpecialAbilities"
                />
              </label>

              <label class="wizard-checkbox">
                <input v-model="template.hasNoSpecialAbilities" type="checkbox" />
                <span>This character has no species special abilities.</span>
              </label>
            </section>
          </div>
        </article>

        <article class="wizard-accordion">
          <button
            class="wizard-accordion-header"
            type="button"
            :aria-expanded="isForceOpen"
            @click="isForceOpen = !isForceOpen"
          >
            <span>The Force</span>
            <svg
              class="wizard-accordion-cue"
              :class="{ 'wizard-accordion-cue-closed': !isForceOpen }"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path :d="isForceOpen ? 'M6 9l6 6 6-6' : 'M6 12h12'" />
            </svg>
            <span
              class="wizard-check"
              :class="{ 'wizard-check-complete': forceComplete }"
              aria-label="Section complete"
            >
              {{ forceComplete ? '✓' : '×' }}
            </span>
          </button>

          <div v-if="isForceOpen" class="wizard-accordion-body">
            <section class="wizard-step">
              <p>
                Some characters are naturally sensitive to the Force and can learn to rely on Force powers. Others begin without
                that connection, though they may later choose to become Force-sensitive at a significant cost.
              </p>

              <label class="wizard-checkbox">
                <input v-model="template.forceSensitive" type="checkbox" />
                <span>Force-sensitive</span>
              </label>

              <p class="wizard-total">Force Points: {{ forcePoints }}</p>

              <p>
                If you want to begin with Force training, assign dice to Control, Sense, and Alter below. These dice spend from the
                same total pool as your attributes.
              </p>

              <div class="wizard-attribute-meter" :class="{ 'wizard-attribute-over': remainingAttributePips < 0 }">
                Assigned {{ formatPips(assignedAttributePips) }} / {{ formatPips(totalAttributePips) }}
                <span v-if="remainingAttributePips >= 0">({{ formatPips(remainingAttributePips) }} remaining)</span>
                <span v-else>({{ formatPips(remainingAttributePips) }} over)</span>
              </div>

              <div class="wizard-attribute-grid">
                <fieldset v-for="name in FORCE_SKILLS" :key="name" class="wizard-attribute-field">
                  <legend>{{ name }}</legend>
                  <label>
                    <span>Dice</span>
                    <input
                      v-model.number="template.forceSkills[name].dice"
                      type="number"
                      min="0"
                      max="1"
                      step="1"
                      @change="normalizeForcePips(template.forceSkills[name])"
                    />
                  </label>
                  <label>
                    <span>Pips</span>
                    <input
                      v-model.number="template.forceSkills[name].pips"
                      type="number"
                      min="0"
                      max="2"
                      step="1"
                      @change="normalizeForcePips(template.forceSkills[name])"
                    />
                  </label>
                </fieldset>
              </div>

              <section class="wizard-force-powers" :class="{ 'wizard-disabled-section': !template.forceSensitive }">
                <div class="wizard-skill-group-header">
                  <div>
                    <h2>Force Powers</h2>
                    <p>{{ availableForcePowerSlots }} / 3 slots available</p>
                  </div>
                </div>

                <p>
                  Force powers are available only to Force-sensitive characters. One slot unlocks for each Control, Sense, or Alter
                  field that has at least 1D assigned.
                </p>

                <div
                  v-for="(power, index) in template.forcePowers"
                  :key="`force-power-${index}`"
                  class="wizard-force-power-row"
                >
                  <p class="wizard-muted">Power {{ index + 1 }}</p>
                  <label class="wizard-field">
                    <span>Name</span>
                    <input v-model="power.name" type="text" :disabled="index >= availableForcePowerSlots" />
                  </label>
                  <label class="wizard-field">
                    <span>Difficulty</span>
                    <textarea v-model="power.difficulty" rows="4" :disabled="index >= availableForcePowerSlots" />
                  </label>
                  <label class="wizard-field">
                    <span>Description</span>
                    <textarea v-model="power.description" rows="4" :disabled="index >= availableForcePowerSlots" />
                  </label>
                </div>
              </section>
            </section>
          </div>
        </article>

        <article class="wizard-accordion">
          <button
            class="wizard-accordion-header"
            type="button"
            :aria-expanded="isSkillsOpen"
            @click="isSkillsOpen = !isSkillsOpen"
          >
            <span>Skills</span>
            <svg
              class="wizard-accordion-cue"
              :class="{ 'wizard-accordion-cue-closed': !isSkillsOpen }"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path :d="isSkillsOpen ? 'M6 9l6 6 6-6' : 'M6 12h12'" />
            </svg>
            <span
              class="wizard-check"
              :class="{ 'wizard-check-complete': skillsComplete }"
              aria-label="Section complete"
            >
              {{ skillsComplete ? '✓' : '×' }}
            </span>
          </button>

          <div v-if="isSkillsOpen" class="wizard-accordion-body">
            <section class="wizard-step">
              <p>
                Skills are chosen after your attributes are set. A beginning character has 7D to improve starting skills. Each skill
                begins at the value of its parent attribute, then any skill dice you add here are added on top.
              </p>
              <p>
                Skills are covered on page 34 of the rulebook. You can also reference this
                <a href="https://www.rancorpit.com/forums/downloads/Other%20Fan-Made%20Supplements/R%26E_Character_Templates.pdf" target="_blank" rel="noreferrer">template collection</a>
                for useful starting skill ideas based on your character type. Do not worry too much about getting this perfect:
                characters can learn additional skills as they level up. The gamemaster may remove unusual or advanced skills from
                a starting template, so have a good explanation for anything strange.
              </p>

              <div class="wizard-attribute-meter" :class="{ 'wizard-attribute-over': remainingSkillPips < 0 }">
                Skill dice assigned {{ formatPips(assignedSkillPips) }} / {{ formatPips(totalSkillPips) }}
                <span v-if="remainingSkillPips >= 0">({{ formatPips(remainingSkillPips) }} remaining)</span>
                <span v-else>({{ formatPips(remainingSkillPips) }} over)</span>
              </div>

              <div class="wizard-skill-groups">
                <section v-for="attributeName in ATTRIBUTE_NAMES" :key="attributeName" class="wizard-skill-group">
                  <div class="wizard-skill-group-header">
                    <div>
                      <h2>{{ attributeName }}</h2>
                      <p>Base {{ formatPips(attributePips(attributeName)) }}</p>
                    </div>
                    <button class="sheet-add-button" type="button" @click="addSkill(attributeName)">+</button>
                  </div>

                  <div class="wizard-skill-suggestions">
                    <button
                      v-for="skillName in SUGGESTED_SKILLS[attributeName]"
                      :key="skillName"
                      type="button"
                      @click="addSkill(attributeName, skillName)"
                    >
                      + {{ skillName }}
                    </button>
                  </div>

                  <p v-if="template.skills[attributeName].length === 0" class="wizard-muted">
                    No {{ attributeName }} skills selected yet.
                  </p>

                  <div
                    v-for="(skill, index) in template.skills[attributeName]"
                    :key="`${attributeName}-${index}`"
                    class="wizard-skill-row"
                  >
                    <label class="wizard-field">
                      <span>Skill</span>
                      <input v-model="skill.name" type="text" />
                    </label>
                    <label class="wizard-field">
                      <span>Dice</span>
                      <input v-model.number="skill.dice" type="number" min="0" step="1" />
                    </label>
                    <label class="wizard-field">
                      <span>Pips</span>
                      <input
                        v-model.number="skill.pips"
                        type="number"
                        min="0"
                        max="2"
                        step="1"
                        @change="normalizePips(skill)"
                      />
                    </label>
                    <div class="wizard-skill-total">
                      <span>Total</span>
                      <strong>{{ formatPips(skillTotalPips(attributeName, skill)) }}</strong>
                    </div>
                    <button class="sheet-delete-button" type="button" @click="removeSkill(attributeName, index)">Delete</button>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </article>

        <article class="wizard-accordion">
          <button
            class="wizard-accordion-header"
            type="button"
            :aria-expanded="isEquipmentOpen"
            @click="isEquipmentOpen = !isEquipmentOpen"
          >
            <span>Credits & Starting Equipment</span>
            <svg
              class="wizard-accordion-cue"
              :class="{ 'wizard-accordion-cue-closed': !isEquipmentOpen }"
              aria-hidden="true"
              viewBox="0 0 24 24"
            >
              <path :d="isEquipmentOpen ? 'M6 9l6 6 6-6' : 'M6 12h12'" />
            </svg>
            <span
              class="wizard-check"
              :class="{ 'wizard-check-complete': equipmentComplete }"
              aria-label="Section complete"
            >
              {{ equipmentComplete ? '✓' : '×' }}
            </span>
          </button>

          <div v-if="isEquipmentOpen" class="wizard-accordion-body">
            <section class="wizard-step">
              <p>
                Choose starting gear that fits your character's backstory and role. Starting equipment will be reviewed by the GM,
                and may be edited if too much gear is taken or if an item is too powerful for a beginning character.
              </p>
              <p>
                Rancorpit has useful reference collections for
                <a href="https://www.rancorpit.com/forums/downloads/Rancor%20Pit%20Stat%20Compilations/Weapons_Stats.pdf" target="_blank" rel="noreferrer">weapons</a>
                and
                <a href="https://www.rancorpit.com/forums/downloads/Rancor%20Pit%20Stat%20Compilations/Equipment_Stats.pdf" target="_blank" rel="noreferrer">general equipment</a>.
              </p>

              <label class="wizard-field wizard-field-short">
                <span>Credits</span>
                <input v-model="template.credits" type="text" disabled />
              </label>
              <p class="wizard-muted">For this campaign all players will start with 250 credits.</p>

              <section class="wizard-equipment-section">
                <div class="wizard-skill-group-header">
                  <h2>Weapons</h2>
                  <button class="sheet-add-button" type="button" @click="addWeapon">Add</button>
                </div>

                <p v-if="template.weapons.length === 0" class="wizard-muted">No starting weapons selected yet.</p>

                <div v-for="(weapon, index) in template.weapons" :key="`weapon-${index}`" class="wizard-equipment-row wizard-equipment-row-with-action">
                  <label class="wizard-field">
                    <span>Weapon</span>
                    <input v-model="weapon.name" type="text" />
                  </label>
                  <label class="wizard-field">
                    <span>Range</span>
                    <input v-model="weapon.range" type="text" />
                  </label>
                  <label class="wizard-field">
                    <span>Damage</span>
                    <input v-model="weapon.damage" type="text" />
                  </label>
                  <button class="sheet-delete-button" type="button" @click="removeWeapon(index)">Delete</button>
                </div>
              </section>

              <section class="wizard-equipment-section">
                <div class="wizard-skill-group-header">
                  <h2>Armor</h2>
                  <button class="sheet-add-button" type="button" @click="addArmor">Add</button>
                </div>

                <p v-if="template.armor.length === 0" class="wizard-muted">No starting armor selected yet.</p>

                <div v-for="(armorItem, index) in template.armor" :key="`armor-${index}`" class="wizard-equipment-row wizard-equipment-row-with-action">
                  <label class="wizard-field">
                    <span>Armor</span>
                    <input v-model="armorItem.name" type="text" />
                  </label>
                  <label class="wizard-field">
                    <span>Str Bonus</span>
                    <input v-model="armorItem.strengthBonus" type="text" />
                  </label>
                  <label class="wizard-field">
                    <span>Dex Penalty</span>
                    <input v-model="armorItem.dexPenalty" type="text" />
                  </label>
                  <button class="sheet-delete-button" type="button" @click="removeArmor(index)">Delete</button>
                </div>
              </section>

              <section class="wizard-equipment-section">
                <div class="wizard-skill-group-header">
                  <h2>Equipment</h2>
                  <button class="sheet-add-button" type="button" @click="addEquipment">Add</button>
                </div>

                <p v-if="template.equipment.length === 0" class="wizard-muted">No starting equipment selected yet.</p>

                <div v-for="(_item, index) in template.equipment" :key="`equipment-${index}`" class="wizard-equipment-row wizard-equipment-line-row">
                  <label class="wizard-field">
                    <span>Equipment</span>
                    <input v-model="template.equipment[index]" type="text" />
                  </label>
                  <button class="sheet-delete-button" type="button" @click="removeEquipment(index)">Delete</button>
                </div>
              </section>
            </section>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
