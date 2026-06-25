<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import HeroActions from '../components/HeroActions.vue'

const backgroundUrl = `${import.meta.env.BASE_URL}bg.png`
const aurebeshGlyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const randomizedLabelLength = 'Information'.length
const primerLabelIntervalMs = 520
const primerLabel = ref('INFORMATION')
let primerLabelInterval

const randomAurebeshLabel = () => {
  return Array.from(
    { length: randomizedLabelLength },
    () => aurebeshGlyphs[Math.floor(Math.random() * aurebeshGlyphs.length)],
  ).join('')
}

const heroActions = computed(() => [
  { id: 'characters', label: 'Characters', to: '/Characters' },
  { id: 'primer', label: primerLabel.value, to: '/Primer', ariaLabel: 'Primer', class: 'hero-action-aurebesh' },
  { id: 'tools', label: 'Tools', to: '/tools' },
])

onMounted(() => {
  primerLabel.value = randomAurebeshLabel()
  primerLabelInterval = window.setInterval(() => {
    primerLabel.value = randomAurebeshLabel()
  }, primerLabelIntervalMs)
})

onBeforeUnmount(() => {
  window.clearInterval(primerLabelInterval)
})
</script>

<template>
  <main
    class="relative min-h-[820px] overflow-hidden bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `url(${backgroundUrl})` }"
  >
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,8,10,0.08),rgba(3,3,4,0.72)_78%)]" />
    <div class="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#11110f] to-transparent" />

    <section class="relative z-10 flex min-h-[760px] flex-col items-center justify-center px-5 pt-28 text-center">
      <div class="mt-24 max-w-5xl">
        <p class="font-serif text-4xl leading-none text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.9)] sm:text-5xl md:text-6xl">
          DEAD EMPIRE
        </p>
        <p class="mt-4 text-2xl font-light text-[#d9f5ff] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] md:text-3xl">
          Your choices will determine the fate of the galaxy....
        </p>

        <div class="mt-10">
          <HeroActions :actions="heroActions" />
        </div>
      </div>
    </section>

    <section class="relative z-10 overflow-hidden border-y border-cyan-300/20 bg-transparent py-4 mt-8" id="scroller">
      <div class="news-scroller" aria-label="Campaign news headlines">
        <div class="news-scroller-track">
          <span aria-label="Breaking news: the emperor has been confirmed dead">
            SYSTEM NEWS // THE EMPEROR HAS BEEN CONFIRMED DEAD
          </span>
          <span aria-label="High command fractures after the citadel disaster">
            SIGNAL ALERT // HIGH COMMAND FRACTURES AFTER THE CITADEL DISASTER
          </span>
          <span aria-label="Council loyalists call for emergency restoration talks">
            COUNCIL SIGNAL // LOYALISTS CALL FOR EMERGENCY RESTORATION TALKS
          </span>
          <span aria-label="Frontier systems report celebrations and scattered reprisals">
            FRONTIER FEED // SYSTEMS REPORT CELEBRATIONS AND SCATTERED REPRISALS
          </span>
          <span aria-hidden="true">
            SYSTEM NEWS // THE EMPEROR HAS BEEN CONFIRMED DEAD
          </span>
          <span aria-hidden="true">
            SIGNAL ALERT // HIGH COMMAND FRACTURES AFTER THE CITADEL DISASTER
          </span>
          <span aria-hidden="true">
            COUNCIL SIGNAL // LOYALISTS CALL FOR EMERGENCY RESTORATION TALKS
          </span>
          <span aria-hidden="true">
            FRONTIER FEED // SYSTEMS REPORT CELEBRATIONS AND SCATTERED REPRISALS
          </span>
        </div>
      </div>
    </section>

  </main>
</template>
