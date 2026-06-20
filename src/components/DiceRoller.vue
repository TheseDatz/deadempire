<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { isDiceRollLoggingConfigured, logDiceRoll } from '../services/diceRollLog'

const route = useRoute()
const isOpen = ref(false)
const diceCount = ref(3)
const modifier = ref(0)
const result = ref(null)
const breakdown = ref([])
const wildBreakdown = ref([])
const errorMessage = ref('')
const isMuted = ref(false)
const isLoggingEnabled = ref(false)
const campaignCode = ref(null)

const shouldShow = computed(() => route.path !== '/')
const total = computed(() => {
  if (!result.value) {
    return ''
  }

  return `${result.value.total}`
})

function playDiceSound() {
  if (isMuted.value) {
    return
  }

  const AudioContext = window.AudioContext || window.webkitAudioContext

  if (!AudioContext) {
    return
  }

  const audioContext = new AudioContext()
  const masterGain = audioContext.createGain()
  masterGain.gain.setValueAtTime(0.5, audioContext.currentTime)
  masterGain.connect(audioContext.destination)

  for (let index = 0; index < 16; index += 1) {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const start = audioContext.currentTime + index * 0.03
    const duration = 0.04 + Math.random() * 0.04

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(140 + Math.random() * 520, start)
    gain.gain.setValueAtTime(0.001, start)
    gain.gain.exponentialRampToValueAtTime(0.34, start + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

    oscillator.connect(gain)
    gain.connect(masterGain)
    oscillator.start(start)
    oscillator.stop(start + duration)
  }

  window.setTimeout(() => audioContext.close(), 800)
}

function setLoggingEnabled(value) {
  if (!value) {
    isLoggingEnabled.value = false
    campaignCode.value = null
    return
  }

  const enteredCode = window.prompt('Enter roll logging code')

  if (!/^\d+$/.test(enteredCode || '')) {
    window.alert('Roll logging code must contain digits only.')
    return
  }

  campaignCode.value = Number(enteredCode)
  isLoggingEnabled.value = value
}

function captureRoll(source, dice, mod) {
  if (!isLoggingEnabled.value || !campaignCode.value || !result.value) {
    return
  }

  logDiceRoll({
    campaignCode: campaignCode.value,
    sourceCode: source === 'sheet' ? 1 : 0,
    diceCount: dice,
    modifier: mod,
    subtotal: result.value.subtotal,
    total: result.value.total,
    wildTotal: result.value.wildTotal,
    wildStatusCode: result.value.wildStatus === 'critical' ? 1 : result.value.wildStatus === 'exploded' ? 2 : 0,
  })
}

function rollDice(source = 'manual') {
  const rollSource = source === 'sheet' ? 'sheet' : 'manual'
  const dice = Number(diceCount.value)
  const mod = Number(modifier.value)

  if (!Number.isInteger(dice) || dice < 1 || dice > 30) {
    errorMessage.value = 'Enter 1 to 30 dice.'
    result.value = null
    return
  }

  if (!Number.isInteger(mod) || mod < -99 || mod > 99) {
    errorMessage.value = 'Modifier must be between -99 and 99.'
    result.value = null
    return
  }

  playDiceSound()
  errorMessage.value = ''
  wildBreakdown.value = [Math.floor(Math.random() * 6) + 1]

  while (wildBreakdown.value.at(-1) === 6) {
    wildBreakdown.value.push(Math.floor(Math.random() * 6) + 1)
  }

  breakdown.value = Array.from({ length: Math.max(dice - 1, 0) }, () => Math.floor(Math.random() * 6) + 1)
  const wildTotal = wildBreakdown.value.reduce((sum, value) => sum + value, 0)
  const subtotal = wildTotal + breakdown.value.reduce((sum, value) => sum + value, 0)
  const wildStatus = wildBreakdown.value[0] === 1 ? 'critical' : wildBreakdown.value.length > 1 ? 'exploded' : 'normal'
  result.value = {
    subtotal,
    modifier: mod,
    total: subtotal + mod,
    wildTotal,
    wildStatus,
  }

  captureRoll(rollSource, dice, mod)
}

function rollRequestedDice(event) {
  const nextDiceCount = Number(event.detail?.diceCount)
  const nextModifier = Number(event.detail?.modifier ?? 0)

  if (
    !Number.isInteger(nextDiceCount) ||
    nextDiceCount < 1 ||
    nextDiceCount > 30 ||
    !Number.isInteger(nextModifier) ||
    nextModifier < -99 ||
    nextModifier > 99
  ) {
    return
  }

  diceCount.value = nextDiceCount
  modifier.value = nextModifier
  isOpen.value = true
  rollDice('sheet')
}

onMounted(() => {
  window.addEventListener('sw6d-roll-dice', rollRequestedDice)
})

onUnmounted(() => {
  window.removeEventListener('sw6d-roll-dice', rollRequestedDice)
})
</script>

<template>
  <div v-if="shouldShow" class="dice-roller">
    <button
      class="dice-fab"
      type="button"
      aria-label="Open dice roller"
      @click="isOpen = true"
    >
      <span class="dice-face">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </span>
    </button>

    <div v-if="isOpen" class="dice-overlay" role="dialog" aria-modal="true" aria-label="Dice roller">
      <button class="dice-overlay-backdrop" type="button" aria-label="Close dice roller" @click="isOpen = false" />

      <section class="dice-panel">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.26em] text-cyan-100/70">Dead Empire</p>
            <h2 class="mt-1 font-serif text-3xl font-bold text-[#4fc3ff]">Dice Roller</h2>
          </div>
          <div class="dice-panel-actions">
            <button
              class="dice-sound-button"
              type="button"
              :aria-label="isMuted ? 'Unmute dice sound' : 'Mute dice sound'"
              @click="isMuted = !isMuted"
            >
              {{ isMuted ? 'Sound Off' : 'Sound On' }}
            </button>
            <button
              class="dice-sound-button"
              type="button"
              :disabled="!isDiceRollLoggingConfigured"
              :aria-label="isLoggingEnabled ? 'Disable dice roll logging' : 'Enable dice roll logging'"
              @click="setLoggingEnabled(!isLoggingEnabled)"
            >
              Log {{ isLoggingEnabled ? 'On' : 'Off' }}
            </button>
            <button class="dice-close-button" type="button" aria-label="Close dice roller" @click="isOpen = false">
              X
            </button>
          </div>
        </div>

        <div class="dice-form mt-6">
          <label>
            <span>Dice</span>
            <input v-model.number="diceCount" type="number" min="1" max="30" />
          </label>
          <strong>d+</strong>
          <label>
            <span>Modifier</span>
            <input v-model.number="modifier" type="number" min="-99" max="99" />
          </label>
        </div>

        <button class="dice-roll-button mt-6" type="button" @click="rollDice()">Roll</button>

        <p v-if="errorMessage" class="mt-4 text-sm font-semibold text-red-200">{{ errorMessage }}</p>

        <div v-if="result" class="dice-result mt-6" :class="`dice-result-${result.wildStatus}`">
          <p class="text-sm uppercase tracking-[0.18em] text-cyan-100/70">Result</p>
          <p v-if="result.wildStatus === 'exploded'" class="dice-result-callout">Crit!</p>
          <p v-else-if="result.wildStatus === 'critical'" class="dice-result-callout">Complication!</p>
          <p class="mt-2 text-5xl font-black text-white">{{ total }}</p>
          <p class="mt-3 text-sm text-cyan-100/80">
            Wild: {{ wildBreakdown.join(' + ') }} |
            Dice: {{ breakdown.length ? breakdown.join(', ') : 'None' }} |
            Modifier: {{ result.modifier >= 0 ? '+' : '' }}{{ result.modifier }}
          </p>
        </div>
      </section>
    </div>
  </div>
</template>
