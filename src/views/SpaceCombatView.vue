<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSession, isAdminSession, onAuthStateChange } from '../services/auth'
import { createStarship, deleteStarship, loadStarships } from '../services/starships'

const showInstructions = ref(false)
const showAddShip = ref(false)
const showImportShip = ref(false)
const editingShipId = ref('')
const session = ref(null)
const savedStarships = ref([])
const savedStarshipSearch = ref('')
const isLoadingSavedStarships = ref(false)
const savedStarshipError = ref('')
const turnNumber = ref(1)
let unsubscribe = null

const isAdmin = computed(() => isAdminSession(session.value))
const filteredSavedStarships = computed(() => {
  const query = savedStarshipSearch.value.trim().toLowerCase()

  return savedStarships.value.filter((starship) => {
    const haystack = [starship.craft, starship.scale, starship.designation].join(' ').toLowerCase()

    return !query || haystack.includes(query)
  })
})

const borderColorOptions = [
  { name: 'Red', value: '#ff3b24' },
  { name: 'Blue', value: '#4fc3ff' },
  { name: 'Green', value: '#31d07b' },
  { name: 'Yellow', value: '#fff25f' },
  { name: 'Purple', value: '#b26bff' },
  { name: 'White', value: '#f8fdff' },
]

const damageStatusOptions = [
  'Ionized',
  'Light: -1D Maneuv.',
  'Light: Weapon destroyed',
  'Light: Weapon damaged/inoperative',
  'Light: hyperdrive damaged',
  'Light: -1D shields',
  'Light: -3 Space',
  'Moderate',
  'Severely Damaged',
  'Destroyed',
]

const movementDirections = [
  { name: 'North', shortName: 'N', x: 0, y: 1 },
  { name: 'Northeast', shortName: 'NE', x: Math.SQRT1_2, y: Math.SQRT1_2 },
  { name: 'East', shortName: 'E', x: 1, y: 0 },
  { name: 'Southeast', shortName: 'SE', x: Math.SQRT1_2, y: -Math.SQRT1_2 },
  { name: 'South', shortName: 'S', x: 0, y: -1 },
  { name: 'Southwest', shortName: 'SW', x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
  { name: 'West', shortName: 'W', x: -1, y: 0 },
  { name: 'Northwest', shortName: 'NW', x: -Math.SQRT1_2, y: Math.SQRT1_2 },
]

const designationPrefixes = ['Alpha', 'Bravo', 'Delta', 'Echo', 'Nova', 'Rogue']
const randomDesignation = () => {
  const prefix = designationPrefixes[Math.floor(Math.random() * designationPrefixes.length)]
  const number = Math.floor(Math.random() * 9) + 1

  return `${prefix}-${number}`
}

const createEmptyShipForm = () => ({
  craft: '',
  scale: 'Starfighter',
  designation: randomDesignation(),
  crewCurrent: 1,
  crewMaximum: 1,
  crewMembers: 'Pilot',
  space: '',
  maneuverability: '',
  hull: '',
  shields: '',
  weapons: [
    {
      name: '',
      skill: '',
      fireControl: '',
      spaceRange: '',
      damage: '',
    },
  ],
})

const newShip = ref(createEmptyShipForm())

const statValue = (ship, label) => ship.stats.find((stat) => stat.label === label)?.value || ''

const shipToForm = (ship) => ({
  craft: ship.craft || '',
  scale: ship.scale || '',
  designation: ship.designation || '',
  crewCurrent: ship.crew.current,
  crewMaximum: ship.crew.maximum,
  crewMembers: ship.crew.members.join('\n'),
  space: statValue(ship, 'Space'),
  maneuverability: statValue(ship, 'Maneuverability'),
  hull: statValue(ship, 'Hull'),
  shields: statValue(ship, 'Shields'),
  weapons: ship.weapons.length
    ? ship.weapons.map((weapon) => ({
        name: weapon.name || '',
        skill: weapon.skill || '',
        fireControl: weapon.fireControl || '',
        spaceRange: weapon.spaceRange || '',
        damage: weapon.damage || '',
      }))
    : createEmptyShipForm().weapons,
})

const distanceFromContact = (ship) => {
  const distance = Math.sqrt(ship.position.x ** 2 + ship.position.y ** 2)

  return Number.isInteger(distance) ? String(distance) : distance.toFixed(1)
}

const formatCoordinate = (coordinate) =>
  Number.isInteger(coordinate) ? String(coordinate) : coordinate.toFixed(1)

const distanceBetweenShips = (ship, otherShip) => {
  const xDifference = ship.position.x - otherShip.position.x
  const yDifference = ship.position.y - otherShip.position.y

  return Math.sqrt(xDifference ** 2 + yDifference ** 2)
}

const relativeDirectionTo = (ship, otherShip) => {
  const xDifference = otherShip.position.x - ship.position.x
  const yDifference = otherShip.position.y - ship.position.y

  if (xDifference === 0 && yDifference === 0) {
    return 'Contact'
  }

  const angle = (Math.atan2(yDifference, xDifference) * 180) / Math.PI
  const normalizedAngle = (angle + 360) % 360
  const directionIndex = Math.round(normalizedAngle / 45) % movementDirections.length
  const directionOrder = ['East', 'Northeast', 'North', 'Northwest', 'West', 'Southwest', 'South', 'Southeast']

  return directionOrder[directionIndex]
}

const relativeContactsFor = (ship) =>
  placeholderShips.value
    .filter((otherShip) => otherShip.id !== ship.id)
    .map((otherShip) => ({
      id: otherShip.id,
      designation: otherShip.designation,
      borderColor: otherShip.borderColor,
      distance: distanceBetweenShips(ship, otherShip),
      direction: relativeDirectionTo(ship, otherShip),
    }))
    .sort((firstContact, secondContact) => firstContact.distance - secondContact.distance)

const deleteShip = (ship) => {
  const confirmed = window.confirm(`Delete ${ship.designation}?`)

  if (!confirmed) {
    return
  }

  placeholderShips.value = placeholderShips.value.filter((existingShip) => existingShip.id !== ship.id)
}

const sortShipsByOrder = () => {
  placeholderShips.value = [...placeholderShips.value].sort((firstShip, secondShip) => {
    const firstOrder = Number(firstShip.order) || 0
    const secondOrder = Number(secondShip.order) || 0

    return firstOrder - secondOrder
  })
}

const advanceTurnOrder = () => {
  if (placeholderShips.value.length < 2) {
    return
  }

  const [activeShip, ...remainingShips] = placeholderShips.value
  placeholderShips.value = [...remainingShips, activeShip]
}

const saveStarship = async (ship) => {
  ship.saveMessage = ''
  ship.saveErrorMessage = ''
  ship.isSaving = true

  const { starship, error } = await createStarship(ship)

  if (error) {
    ship.saveErrorMessage = error.message
  } else {
    ship.saveMessage = `Saved ${starship.designation}.`
  }

  ship.isSaving = false
}

const addWeaponToNewShip = () => {
  newShip.value.weapons.push({
    name: '',
    skill: '',
    fireControl: '',
    spaceRange: '',
    damage: '',
  })
}

const removeWeaponFromNewShip = (weaponIndex) => {
  if (newShip.value.weapons.length === 1) {
    return
  }

  newShip.value.weapons.splice(weaponIndex, 1)
}

const formToShipData = () => {
  const form = newShip.value
  const crewMembers = form.crewMembers
    .split('\n')
    .map((member) => member.trim())
    .filter(Boolean)
  const weapons = form.weapons
    .filter((weapon) => weapon.name.trim())
    .map((weapon) => ({
      name: weapon.name.trim(),
      skill: weapon.skill.trim(),
      fireControl: weapon.fireControl.trim(),
      spaceRange: weapon.spaceRange.trim(),
      damage: weapon.damage.trim(),
    }))

  return {
    craft: form.craft.trim() || 'Unnamed Ship',
    scale: form.scale.trim() || 'Starfighter',
    designation: form.designation.trim() || randomDesignation(),
    crew: {
      current: Number(form.crewCurrent) || 0,
      maximum: Number(form.crewMaximum) || 0,
      members: crewMembers.length ? crewMembers : ['Pilot'],
    },
    stats: [
      { label: 'Space', value: form.space.trim() || '0' },
      { label: 'Maneuverability', value: form.maneuverability.trim() || '0D' },
      { label: 'Hull', value: form.hull.trim() || '0D' },
      { label: 'Shields', value: form.shields.trim() || '0D' },
    ],
    weapons: weapons.length
      ? weapons
      : [
          {
            name: 'Unarmed',
            skill: '',
            fireControl: '',
            spaceRange: '',
            damage: '',
          },
        ],
  }
}

const resetShipForm = () => {
  newShip.value = createEmptyShipForm()
  editingShipId.value = ''
  showAddShip.value = false
}

const openAddShip = () => {
  newShip.value = createEmptyShipForm()
  editingShipId.value = ''
  showAddShip.value = true
}

const openEditShip = (ship) => {
  newShip.value = shipToForm(ship)
  editingShipId.value = ship.id
  showAddShip.value = true
}

const openImportShip = async () => {
  showImportShip.value = true
  savedStarshipSearch.value = ''
  savedStarshipError.value = ''
  isLoadingSavedStarships.value = true

  const { starships, error } = await loadStarships()

  if (error) {
    savedStarshipError.value = error.message
  } else {
    savedStarships.value = starships
  }

  isLoadingSavedStarships.value = false
}

const closeImportShip = () => {
  showImportShip.value = false
  savedStarshipSearch.value = ''
}

const importStarship = (starship) => {
  const savedData = starship.data || {}

  placeholderShips.value.push({
    id: `ship-${Date.now()}`,
    craft: savedData.craft || starship.craft || 'Unnamed Ship',
    scale: savedData.scale || starship.scale || 'Starfighter',
    designation: savedData.designation || starship.designation || randomDesignation(),
    borderColor: savedData.borderColor || '#4fc3ff',
    order: placeholderShips.value.length + 1,
    damageStatuses: {},
    moderateDamageNote: '',
    isSaving: false,
    saveMessage: '',
    saveErrorMessage: '',
    position: {
      x: 0,
      y: 0,
      isLogging: false,
      pendingDirection: 'North',
      pendingValue: 1,
    },
    crew: savedData.crew || {
      current: 1,
      maximum: 1,
      members: ['Pilot'],
    },
    stats: savedData.stats || [
      { label: 'Space', value: '0' },
      { label: 'Maneuverability', value: '0D' },
      { label: 'Hull', value: '0D' },
      { label: 'Shields', value: '0D' },
    ],
    weapons: savedData.weapons?.length
      ? savedData.weapons
      : [
          {
            name: 'Unarmed',
            skill: '',
            fireControl: '',
            spaceRange: '',
            damage: '',
          },
        ],
  })

  closeImportShip()
}

const deleteSavedStarship = async (starship) => {
  const confirmed = window.confirm(`Delete saved ship ${starship.craft}?`)

  if (!confirmed) {
    return
  }

  savedStarshipError.value = ''
  const { error } = await deleteStarship(starship.id)

  if (error) {
    savedStarshipError.value = error.message
  } else {
    savedStarships.value = savedStarships.value.filter((savedStarship) => savedStarship.id !== starship.id)
  }
}

const submitShipForm = () => {
  const shipData = formToShipData()

  if (editingShipId.value) {
    const ship = placeholderShips.value.find((existingShip) => existingShip.id === editingShipId.value)

    if (ship) {
      Object.assign(ship, {
        ...shipData,
        saveMessage: '',
        saveErrorMessage: '',
      })
    }
  } else {
    placeholderShips.value.push({
      id: `ship-${Date.now()}`,
      ...shipData,
      borderColor: '#4fc3ff',
      order: placeholderShips.value.length + 1,
      damageStatuses: {},
      moderateDamageNote: '',
      isSaving: false,
      saveMessage: '',
      saveErrorMessage: '',
      position: {
        x: 0,
        y: 0,
        isLogging: false,
        pendingDirection: 'North',
        pendingValue: 1,
      },
    })
  }

  resetShipForm()
}

const logPosition = (ship) => {
  const direction = movementDirections.find((option) => option.name === ship.position.pendingDirection)
  const value = Number(ship.position.pendingValue)

  if (!direction || !Number.isFinite(value) || value <= 0) {
    return
  }

  ship.position.x += direction.x * value
  ship.position.y += direction.y * value
  ship.position.pendingValue = 1
  ship.position.isLogging = false
}

onMounted(async () => {
  const { session: activeSession } = await getSession()

  session.value = activeSession
  unsubscribe = onAuthStateChange((activeSession) => {
    session.value = activeSession
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

const placeholderShips = ref(Array.from({ length: 1 }, (_, index) => ({
  id: `x-wing-${index + 1}`,
  craft: 'Incom T-65B X-wing',
  scale: 'Starfighter',
  designation: 'Tie Leader',
  borderColor: '#4fc3ff',
  order: index + 1,
  damageStatuses: {},
  moderateDamageNote: '',
  isSaving: false,
  saveMessage: '',
  saveErrorMessage: '',
  position: {
    x: 0,
    y: 0,
    isLogging: false,
    pendingDirection: 'North',
    pendingValue: 1,
  },
  crew: {
    current: 1,
    maximum: 1,
    members: ['Pilot'],
  },
  stats: [
    { label: 'Space', value: '9' },
    { label: 'Maneuverability', value: '3D+1' },
    { label: 'Hull', value: '4D' },
    { label: 'Shields', value: '1D' },
  ],
  weapons: [
    {
      name: '4 Laser Cannons (fire-linked)',
      skill: 'Starship gunnery',
      fireControl: '3D',
      spaceRange: '1-3/12/25',
      damage: '6D',
    },
  ],
})))

const speedRows = [
  {
    speed: 'Cautious',
    relativeSpeed: '0.5x Space',
    difficulty: '-1 difficulty level',
    notes: 'Careful movement. Best for hazards, tight terrain, docking, or lining up safely.',
  },
  {
    speed: 'Cruising',
    relativeSpeed: '1x Space',
    difficulty: 'No modifier',
    notes: 'Normal combat movement. The default speed for most rounds.',
  },
  {
    speed: 'High Speed',
    relativeSpeed: '2x Space',
    difficulty: '+1 difficulty level',
    notes: 'Fast movement for chasing, fleeing, or rapidly changing range.',
  },
  {
    speed: 'All-Out',
    relativeSpeed: '4x Space',
    difficulty: '+2 difficulty levels',
    notes: 'Desperate speed. The pilot focuses on movement and cannot attack or dodge.',
  },
]

const terrainRows = [
  {
    difficulty: 'Very Easy',
    number: '1-5',
    examples: 'Clear space with no meaningful hazards.',
  },
  {
    difficulty: 'Easy',
    number: '6-10',
    examples: 'A few nearby ships, light traffic, or minor obstacles.',
  },
  {
    difficulty: 'Moderate',
    number: '11-15',
    examples: 'Crowded space, docking lanes, scattered debris, or a busy approach.',
  },
  {
    difficulty: 'Difficult',
    number: '16-20',
    examples: 'Dogfighting near multiple ships, asteroids, wreckage, or heavy debris.',
  },
  {
    difficulty: 'Very Difficult',
    number: '21-30',
    examples: 'Dense asteroid fields, dangerous traffic, or tightly packed hazards.',
  },
  {
    difficulty: 'Heroic',
    number: '31+',
    examples: 'Nearly impossible flying, extreme hazards, or Death Star trench-style terrain.',
  },
]

const rangeRows = [
  {
    range: 'Close',
    weaponRange: 'First number/listed band',
    difficulty: 'Easy',
    notes: 'The target is inside the weapon short range. For a weapon listed 1-3/5/12, this means 1-3 Space units.',
  },
  {
    range: 'Medium',
    weaponRange: 'Second number/listed band',
    difficulty: 'Moderate',
    notes: 'The target is inside the weapon medium range. For a weapon listed 1-3/5/12, this means 4-5 Space units.',
  },
  {
    range: 'Far',
    weaponRange: 'Third number/listed band',
    difficulty: 'Difficult',
    notes: 'The target is inside the weapon long range. For a weapon listed 1-3/5/12, this means 6-12 Space units.',
  },
  {
    range: 'Out of Range',
    weaponRange: 'Beyond listed range',
    difficulty: 'Cannot attack',
    notes: 'The target is beyond the weapon maximum range. Move closer or use a longer-ranged weapon.',
  },
]

const defenseRows = [
  {
    defense: 'Starship Dodge',
    roll: 'Piloting + Maneuverability',
    use: 'Use when the pilot is actively evading incoming fire.',
    result: 'Replace the range difficulty with the dodge result if the dodge is higher.',
  },
  {
    defense: 'Angle Shields',
    roll: 'Starship Shields',
    use: 'Use when the ship has shields assigned to the arc being attacked.',
    result: 'Replace the range difficulty with the shield roll if the shield roll is higher.',
  },
]

const damageRows = [
  {
    difference: 'Damage lower than Hull',
    result: 'No damage',
    effect: 'The shot glances off, misses anything vital, or is absorbed by defenses.',
  },
  {
    difference: '0-3',
    result: 'Ionized / Shields Reduced',
    effect: 'Temporary disruption. Reduce shields or apply a short-lived controls penalty.',
  },
  {
    difference: '4-8',
    result: 'Light Damage',
    effect: 'Minor system penalty. Reduce Space, Maneuverability, shields, or disable a minor system.',
  },
  {
    difference: '9-12',
    result: 'Heavy Damage',
    effect: 'Major system penalty. Disable a weapon, badly damage engines, or impose a serious control problem.',
  },
  {
    difference: '13-15',
    result: 'Severe Damage',
    effect: 'The ship is disabled, dead in space, crashing, venting atmosphere, or about to fail catastrophically.',
  },
  {
    difference: '16+',
    result: 'Destroyed',
    effect: 'The ship is destroyed unless the gamemaster allows ejection, escape pods, or cinematic survival.',
  },
]

const scaleValues = [
  { name: 'Character', dice: 0 },
  { name: 'Speeder', dice: 2 },
  { name: 'Walker', dice: 4 },
  { name: 'Starfighter', dice: 6 },
  { name: 'Capital', dice: 12 },
  { name: 'Death Star', dice: 24 },
]

const formatScaleDice = (difference) => `${difference}D`

const scaleRows = scaleValues.flatMap((attacker) =>
  scaleValues.map((target) => {
    const difference = Math.abs(attacker.dice - target.dice)

    if (difference === 0) {
      return {
        attacker: attacker.name,
        target: target.name,
        attack: 'No modifier',
        damage: 'No modifier',
        notes: 'Same scale.',
      }
    }

    if (attacker.dice < target.dice) {
      return {
        attacker: attacker.name,
        target: target.name,
        attack: `Attacker +${formatScaleDice(difference)} to hit`,
        damage: `Target +${formatScaleDice(difference)} to Hull/resist`,
        notes: 'Smaller attacker vs larger target.',
      }
    }

    return {
      attacker: attacker.name,
      target: target.name,
      attack: `Target +${formatScaleDice(difference)} to dodge`,
      damage: `Attacker +${formatScaleDice(difference)} damage`,
      notes: 'Larger attacker vs smaller target.',
    }
  }),
)
</script>

<template>
  <main class="space-combat-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">
        Homebrew Rules
      </p>
      <div class="space-combat-header mt-2">
        <h1 class="font-serif text-5xl font-bold text-[#4fc3ff]">Space Combat</h1>
        <button type="button" class="space-instructions-button" @click="showInstructions = true">
          Instructions
        </button>
      </div>

      <div class="space-encounter-toolbar mt-6">
        <div class="space-turn-controls">
          <div class="space-turn-buttons">
            <button type="button" @click="sortShipsByOrder">Sort</button>
            <button type="button" @click="advanceTurnOrder">Advance</button>
          </div>
          <label class="space-turn-number-control">
            <span>Turn Number</span>
            <div>
              <button
                type="button"
                aria-label="Decrease turn number"
                @click="turnNumber = Math.max(1, turnNumber - 1)"
              >
                -
              </button>
              <input v-model.number="turnNumber" type="number" min="1" />
              <button type="button" aria-label="Increase turn number" @click="turnNumber += 1">
                +
              </button>
            </div>
          </label>
        </div>

        <div class="space-encounter-actions">
          <button type="button" @click="openAddShip">Add Ship</button>
          <button type="button" @click="openImportShip">Import Ship</button>
        </div>
      </div>

      <section class="space-encounter-grid mt-8" aria-label="Space combat encounter tracker">
        <article
          v-for="ship in placeholderShips"
          :key="ship.id"
          class="space-ship-card"
          :style="{ '--ship-border-color': ship.borderColor }"
        >
          <header class="space-ship-card-header">
            <div>
              <h2>{{ ship.craft }}</h2>
              <p>{{ ship.scale }} - {{ ship.designation }}</p>
            </div>
            <div class="space-card-controls">
              <div class="space-border-swatches" aria-label="Card border color">
                <button
                  v-for="color in borderColorOptions"
                  :key="color.name"
                  type="button"
                  class="space-border-swatch"
                  :class="{ 'space-border-swatch-active': ship.borderColor === color.value }"
                  :style="{ '--swatch-color': color.value }"
                  :aria-label="`Set ${ship.craft} border ${color.name}`"
                  :title="color.name"
                  @click="ship.borderColor = color.value"
                ></button>
              </div>
              <label class="space-order-control">
                <span>Order</span>
                <div>
                  <button
                    type="button"
                    :aria-label="`Decrease ${ship.craft} order`"
                    @click="ship.order = Math.max(1, ship.order - 1)"
                  >
                    -
                  </button>
                  <input v-model.number="ship.order" type="number" min="1" />
                  <button
                    type="button"
                    :aria-label="`Increase ${ship.craft} order`"
                    @click="ship.order += 1"
                  >
                    +
                  </button>
                </div>
              </label>
            </div>
          </header>

          <div class="space-card-row-actions">
            <button type="button" class="space-delete-card-button" @click="deleteShip(ship)">
              Delete
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="space-save-card-button"
              @click="openEditShip(ship)"
            >
              Edit
            </button>
            <button
              v-if="isAdmin"
              type="button"
              class="space-save-card-button"
              :disabled="ship.isSaving"
              @click="saveStarship(ship)"
            >
              {{ ship.isSaving ? 'Saving' : 'Save' }}
            </button>
          </div>
          <p v-if="ship.saveMessage" class="space-card-save-message">{{ ship.saveMessage }}</p>
          <p v-if="ship.saveErrorMessage" class="space-card-save-message space-card-save-error">
            {{ ship.saveErrorMessage }}
          </p>

          <section class="space-ship-section">
            <h3>Crew - {{ ship.crew.current }}/{{ ship.crew.maximum }}</h3>
            <ul class="space-crew-list">
              <li v-for="member in ship.crew.members" :key="member">{{ member }}</li>
            </ul>
          </section>

          <section class="space-ship-section">
            <h3>Stat Block</h3>
            <dl class="space-stat-grid">
              <div v-for="stat in ship.stats" :key="stat.label">
                <dt>{{ stat.label }}</dt>
                <dd>{{ stat.value }}</dd>
              </div>
            </dl>
            <div class="space-damage-status-grid" aria-label="Damage status toggles">
              <div
                v-for="status in damageStatusOptions"
                :key="status"
                class="space-damage-status"
                :class="{ 'space-damage-status-with-note': status === 'Moderate' }"
              >
                <button
                  type="button"
                  class="space-damage-status-toggle"
                  :class="{ 'space-damage-status-active': ship.damageStatuses[status] }"
                  :aria-pressed="ship.damageStatuses[status] ? 'true' : 'false'"
                  @click="ship.damageStatuses[status] = !ship.damageStatuses[status]"
                >
                  <span></span>
                  {{ status === 'Moderate' ? 'Moderate:' : status }}
                </button>
                <input
                  v-if="status === 'Moderate'"
                  v-model="ship.moderateDamageNote"
                  type="text"
                  aria-label="Moderate damage note"
                />
              </div>
            </div>
          </section>

          <section class="space-ship-section">
            <h3>Weapons</h3>
            <article v-for="weapon in ship.weapons" :key="weapon.name" class="space-weapon-card">
              <h4>{{ weapon.name }}</h4>
              <dl class="space-weapon-stats">
                <div>
                  <dt>Skill</dt>
                  <dd>{{ weapon.skill }}</dd>
                </div>
                <div>
                  <dt>Fire Control</dt>
                  <dd>{{ weapon.fireControl }}</dd>
                </div>
                <div>
                  <dt>Space Range</dt>
                  <dd>{{ weapon.spaceRange }}</dd>
                </div>
                <div>
                  <dt>Damage</dt>
                  <dd>{{ weapon.damage }}</dd>
                </div>
              </dl>
            </article>
          </section>

          <section class="space-ship-section">
            <div class="space-positioning-header">
              <h3>Positioning</h3>
              <button type="button" @click="ship.position.isLogging = !ship.position.isLogging">
                Log
              </button>
            </div>

            <form
              v-if="ship.position.isLogging"
              class="space-position-log"
              @submit.prevent="logPosition(ship)"
            >
              <label>
                <span>Direction</span>
                <select v-model="ship.position.pendingDirection">
                  <option
                    v-for="direction in movementDirections"
                    :key="direction.name"
                    :value="direction.name"
                  >
                    {{ direction.name }}
                  </option>
                </select>
              </label>
              <label>
                <span>Value</span>
                <input v-model.number="ship.position.pendingValue" type="number" min="1" />
              </label>
              <button type="submit">Apply</button>
            </form>

            <dl class="space-distance-block">
              <div>
                <dt>Distance from contact</dt>
                <dd>{{ distanceFromContact(ship) }}</dd>
              </div>
              <div>
                <dt>Coordinates</dt>
                <dd>X {{ formatCoordinate(ship.position.x) }}, Y {{ formatCoordinate(ship.position.y) }}</dd>
              </div>
            </dl>

            <div class="space-relative-contacts">
              <h4>Relative Contacts</h4>
              <ol>
                <li v-for="contact in relativeContactsFor(ship)" :key="contact.id">
                  <span :style="{ color: contact.borderColor }">{{ contact.designation }}</span>
                  <em>{{ contact.direction }}</em>
                  <strong>{{ formatCoordinate(contact.distance) }}</strong>
                </li>
              </ol>
            </div>
          </section>
        </article>
      </section>
    </section>

    <Teleport to="body">
      <div
        v-if="showInstructions"
        class="space-instructions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-instructions-title"
        @click.self="showInstructions = false"
      >
        <section class="space-instructions-panel">
          <div class="space-instructions-header">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">
                Homebrew Rules
              </p>
              <h2 id="space-instructions-title">Space Combat Instructions</h2>
            </div>
            <button type="button" aria-label="Close instructions" @click="showInstructions = false">
              Close
            </button>
          </div>

          <section class="space-combat-panel mt-6">
            <div class="rules-section-heading">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Step 1</p>
                <h2>Choose Speed</h2>
              </div>
            </div>

            <p class="space-combat-intro mt-5">
              Keep the ship's Space rating as its base speed. At the start of a round, the pilot
              chooses a speed. That speed determines relative movement and modifies the piloting +
              maneuverability roll for the round.
            </p>

            <div class="space-speed-table mt-6">
              <div class="space-speed-row space-speed-head">
                <span>Speed</span>
                <span>Relative Speed</span>
                <span>Piloting Difficulty</span>
                <span>Use</span>
              </div>
              <div v-for="row in speedRows" :key="row.speed" class="space-speed-row">
                <span>{{ row.speed }}</span>
                <span>{{ row.relativeSpeed }}</span>
                <span>{{ row.difficulty }}</span>
                <span>{{ row.notes }}</span>
              </div>
            </div>
          </section>

          <section class="space-combat-panel mt-6">
            <div class="rules-section-heading">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Step 2</p>
                <h2>Set Terrain Difficulty</h2>
              </div>
            </div>

            <p class="space-combat-intro mt-5">
              Terrain difficulty is the base piloting difficulty for the round. Pick the difficulty
              that best matches the current environment, then adjust it based on the speed the pilot
              chose.
            </p>

            <div class="space-terrain-table mt-6">
              <div class="space-terrain-row space-speed-head">
                <span>Difficulty</span>
                <span>Number</span>
                <span>Examples</span>
              </div>
              <div v-for="row in terrainRows" :key="row.difficulty" class="space-terrain-row">
                <span>{{ row.difficulty }}</span>
                <span>{{ row.number }}</span>
                <span>{{ row.examples }}</span>
              </div>
            </div>
          </section>

          <section class="space-combat-panel mt-6">
            <div class="rules-section-heading">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Step 3</p>
                <h2>Determine Weapon Range</h2>
              </div>
            </div>

            <p class="space-combat-intro mt-5">
              Compare the distance between ships in Space units to the attacking weapon's Space
              Range. That range band sets the base difficulty for the attack roll.
            </p>

            <div class="space-range-table mt-6">
              <div class="space-range-row space-speed-head">
                <span>Range</span>
                <span>Weapon Range</span>
                <span>Attack Difficulty</span>
                <span>Notes</span>
              </div>
              <div v-for="row in rangeRows" :key="row.range" class="space-range-row">
                <span>{{ row.range }}</span>
                <span>{{ row.weaponRange }}</span>
                <span>{{ row.difficulty }}</span>
                <span>{{ row.notes }}</span>
              </div>
            </div>
          </section>

          <section class="space-combat-panel mt-6">
            <div class="rules-section-heading">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Step 4</p>
                <h2>Defend Against Attacks</h2>
              </div>
            </div>

            <p class="space-combat-intro mt-5">
              The weapon range difficulty is the starting attack difficulty. If the defender reacts,
              they can replace that difficulty with a defensive roll. Use whichever difficulty is
              higher.
            </p>

            <div class="space-defense-table mt-6">
              <div class="space-defense-row space-speed-head">
                <span>Defense</span>
                <span>Roll</span>
                <span>When To Use</span>
                <span>Result</span>
              </div>
              <div v-for="row in defenseRows" :key="row.defense" class="space-defense-row">
                <span>{{ row.defense }}</span>
                <span>{{ row.roll }}</span>
                <span>{{ row.use }}</span>
                <span>{{ row.result }}</span>
              </div>
            </div>
          </section>

          <section class="space-combat-panel mt-6">
            <div class="rules-section-heading">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Step 5</p>
                <h2>Roll Damage</h2>
              </div>
            </div>

            <p class="space-combat-intro mt-5">
              If an attack hits, roll the weapon's damage. The defender rolls Hull and adds shields
              if shields apply to the attacked arc. Compare the totals and use the difference to
              choose a damage result.
            </p>

            <div class="space-damage-table mt-6">
              <div class="space-damage-row space-speed-head">
                <span>Difference</span>
                <span>Result</span>
                <span>Simplified Effect</span>
              </div>
              <div v-for="row in damageRows" :key="row.result" class="space-damage-row">
                <span>{{ row.difference }}</span>
                <span>{{ row.result }}</span>
                <span>{{ row.effect }}</span>
              </div>
            </div>
          </section>

          <section class="space-combat-panel mt-6">
            <div class="rules-section-heading">
              <div>
                <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Reference</p>
                <h2>Scale Modifiers</h2>
              </div>
            </div>

            <p class="space-combat-intro mt-5">
              Use this REUP scale chart when ships or targets of different scales attack each
              other. Smaller attackers are more accurate against larger targets, but larger targets
              resist damage better. Larger attackers hit smaller targets less easily, but add scale
              dice to damage when they connect.
            </p>

            <div class="space-scale-table mt-6">
              <div class="space-scale-row space-speed-head">
                <span>Attacker</span>
                <span>Target</span>
                <span>Attack / Dodge</span>
                <span>Damage / Resistance</span>
                <span>Notes</span>
              </div>
              <div v-for="row in scaleRows" :key="`${row.attacker}-${row.target}`" class="space-scale-row">
                <span>{{ row.attacker }}</span>
                <span>{{ row.target }}</span>
                <span>{{ row.attack }}</span>
                <span>{{ row.damage }}</span>
                <span>{{ row.notes }}</span>
              </div>
            </div>
          </section>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showImportShip"
        class="space-instructions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-import-ship-title"
        @click.self="closeImportShip"
      >
        <section class="space-add-ship-panel">
          <div class="space-instructions-header">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">
                Saved Craft
              </p>
              <h2 id="space-import-ship-title">Import Ship</h2>
            </div>
            <button type="button" aria-label="Close import ship" @click="closeImportShip">
              Close
            </button>
          </div>

          <label class="space-import-search mt-6">
            <span>Search Saved Craft</span>
            <input
              v-model="savedStarshipSearch"
              type="search"
              placeholder="Search by craft, scale, or designation..."
            />
          </label>

          <p v-if="isLoadingSavedStarships" class="space-import-message mt-4">
            Loading saved craft...
          </p>
          <p v-else-if="savedStarshipError" class="space-import-message space-import-error mt-4">
            {{ savedStarshipError }}
          </p>
          <p v-else-if="!filteredSavedStarships.length" class="space-import-message mt-4">
            No saved craft found.
          </p>

          <div v-else class="space-import-list mt-4">
            <div
              v-for="starship in filteredSavedStarships"
              :key="starship.id"
              class="space-import-row"
            >
              <button type="button" class="space-import-ship-button" @click="importStarship(starship)">
                <span>{{ starship.craft }}</span>
                <em>{{ starship.scale }} - {{ starship.designation }}</em>
              </button>
              <button
                v-if="isAdmin"
                type="button"
                class="space-import-delete-button"
                @click="deleteSavedStarship(starship)"
              >
                Delete
              </button>
            </div>
          </div>
        </section>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showAddShip"
        class="space-instructions-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-add-ship-title"
        @click.self="resetShipForm"
      >
        <form class="space-add-ship-panel" @submit.prevent="submitShipForm">
          <div class="space-instructions-header">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">
                Encounter Tracker
              </p>
              <h2 id="space-add-ship-title">{{ editingShipId ? 'Edit Ship' : 'Add Ship' }}</h2>
            </div>
            <button type="button" aria-label="Close add ship" @click="resetShipForm">
              Close
            </button>
          </div>

          <section class="space-add-ship-grid mt-6">
            <label>
              <span>Craft</span>
              <input v-model="newShip.craft" type="text" placeholder="Incom T-65B X-wing" />
            </label>
            <label>
              <span>Scale</span>
              <input v-model="newShip.scale" type="text" placeholder="Starfighter" />
            </label>
            <label>
              <span>Designation</span>
              <input v-model="newShip.designation" type="text" placeholder="Alpha-5" />
            </label>
            <label>
              <span>Crew Current</span>
              <input v-model.number="newShip.crewCurrent" type="number" min="0" />
            </label>
            <label>
              <span>Crew Max</span>
              <input v-model.number="newShip.crewMaximum" type="number" min="0" />
            </label>
            <label class="space-add-ship-wide">
              <span>Crew Members</span>
              <textarea v-model="newShip.crewMembers" rows="3" placeholder="One crew member per line"></textarea>
            </label>
          </section>

          <section class="space-add-ship-section">
            <h3>Stat Block</h3>
            <div class="space-add-ship-grid">
              <label>
                <span>Space</span>
                <input v-model="newShip.space" type="text" placeholder="9" />
              </label>
              <label>
                <span>Maneuverability</span>
                <input v-model="newShip.maneuverability" type="text" placeholder="3D+1" />
              </label>
              <label>
                <span>Hull</span>
                <input v-model="newShip.hull" type="text" placeholder="4D" />
              </label>
              <label>
                <span>Shields</span>
                <input v-model="newShip.shields" type="text" placeholder="1D" />
              </label>
            </div>
          </section>

          <section class="space-add-ship-section">
            <div class="space-add-ship-section-header">
              <h3>Weapons</h3>
              <button type="button" @click="addWeaponToNewShip">Add Weapon</button>
            </div>
            <article
              v-for="(weapon, weaponIndex) in newShip.weapons"
              :key="weaponIndex"
              class="space-add-weapon-row"
            >
              <div class="space-add-ship-grid">
                <label class="space-add-ship-wide">
                  <span>Name</span>
                  <input v-model="weapon.name" type="text" placeholder="4 Laser Cannons (fire-linked)" />
                </label>
                <label>
                  <span>Skill</span>
                  <input v-model="weapon.skill" type="text" placeholder="Starship gunnery" />
                </label>
                <label>
                  <span>Fire Control</span>
                  <input v-model="weapon.fireControl" type="text" placeholder="3D" />
                </label>
                <label>
                  <span>Space Range</span>
                  <input v-model="weapon.spaceRange" type="text" placeholder="1-3/12/25" />
                </label>
                <label>
                  <span>Damage</span>
                  <input v-model="weapon.damage" type="text" placeholder="6D" />
                </label>
              </div>
              <button type="button" class="space-add-remove-weapon" @click="removeWeaponFromNewShip(weaponIndex)">
                Remove Weapon
              </button>
            </article>
          </section>

          <div class="space-add-ship-footer">
            <button type="button" @click="resetShipForm">Cancel</button>
            <button type="submit">{{ editingShipId ? 'Update Ship' : 'Add Ship' }}</button>
          </div>
        </form>
      </div>
    </Teleport>
  </main>
</template>
