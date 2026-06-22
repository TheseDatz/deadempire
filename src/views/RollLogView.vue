<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  getLatestDiceRolls,
  isDiceRollLoggingConfigured,
  subscribeToDiceRolls,
} from '../services/diceRollLog'

const rolls = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const isLive = ref(false)
const rollLogLimit = 10
let unsubscribe = null

const statusText = computed(() => {
  if (!isDiceRollLoggingConfigured) {
    return 'Not configured'
  }

  if (isLive.value) {
    return 'Live'
  }

  return 'Connecting'
})

function formatDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function formatModifier(value) {
  return value >= 0 ? `+${value}` : `${value}`
}

function formatSource(value) {
  return value === 1 ? 'sheet' : 'manual'
}

function formatWildStatus(value) {
  if (value === 1) {
    return 'critical'
  }

  if (value === 2) {
    return 'exploded'
  }

  return 'normal'
}

function addRoll(roll) {
  rolls.value = [roll, ...rolls.value.filter((existing) => existing.id !== roll.id)].slice(0, rollLogLimit)
}

onMounted(async () => {
  if (!isDiceRollLoggingConfigured) {
    isLoading.value = false
    errorMessage.value = 'Supabase environment variables are not configured for this build.'
    return
  }

  const { data, error } = await getLatestDiceRolls(rollLogLimit)

  if (error) {
    errorMessage.value = error.message
  } else {
    rolls.value = data || []
  }

  isLoading.value = false

  unsubscribe = subscribeToDiceRolls((roll) => {
    isLive.value = true
    addRoll(roll)
  })

  window.setTimeout(() => {
    if (unsubscribe) {
      isLive.value = true
    }
  }, 800)
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<template>
  <main class="roll-log-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-6xl">
      <div class="roll-log-header">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Dice Telemetry</p>
          <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Roll Log</h1>
        </div>
        <span class="roll-log-status" :class="{ 'roll-log-status-live': isLive }">{{ statusText }}</span>
      </div>

      <p v-if="errorMessage" class="roll-log-message mt-8">{{ errorMessage }}</p>
      <p v-else-if="isLoading" class="roll-log-message mt-8">Loading latest rolls...</p>
      <p v-else-if="rolls.length === 0" class="roll-log-message mt-8">No logged rolls yet.</p>

      <section v-else class="roll-log-list mt-8">
        <article v-for="roll in rolls" :key="roll.id" class="roll-log-card">
          <div class="roll-log-card-main">
            <div class="roll-log-result-block">
              <div class="roll-log-meta">
                <time :datetime="roll.created_at">{{ formatDate(roll.created_at) }}</time>
                <span>{{ roll.roller_username }}</span>
              </div>
              <h2 :class="`roll-log-total-${formatWildStatus(roll.wild_status_code)}`">{{ roll.total }}</h2>
            </div>

            <dl class="roll-log-details">
              <div>
                <dt>Dice</dt>
                <dd>{{ roll.dice_count }}D {{ formatModifier(roll.modifier) }}</dd>
              </div>
              <div>
                <dt>Subtotal</dt>
                <dd>{{ roll.subtotal }}</dd>
              </div>
              <div>
                <dt>Wild</dt>
                <dd>{{ roll.wild_total }}</dd>
              </div>
            </dl>

            <div class="roll-log-badges">
              <span>{{ formatSource(roll.source_code) }}</span>
              <span :class="`roll-log-wild-${formatWildStatus(roll.wild_status_code)}`">
                {{ formatWildStatus(roll.wild_status_code) }}
              </span>
            </div>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
