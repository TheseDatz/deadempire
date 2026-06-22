<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getSession, onAuthStateChange } from '../services/auth'

const session = ref(null)
let unsubscribe = null

const profileLabel = computed(() => (session.value ? 'PROF' : 'Login'))

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
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-30">
    <div class="mx-auto grid h-10 max-w-[980px] grid-cols-[1fr_auto_1fr] items-start px-3">
      <nav
        class="header-wing justify-end rounded-bl-sm border-b border-[#4fc3ff]/70 bg-gradient-to-b from-[#182533]/95 to-[#091018]/95 pr-5"
      >
        <RouterLink class="header-link header-link-red" to="/map">The Galaxy</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/Characters">CHA</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/Planets">PLA</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/Factions">FAC</RouterLink>
      </nav>

      <RouterLink to="/" class="relative -mx-5 block px-8 pt-3">
        <span class="sr-only">Dead Empire</span>
        <span class="logo-text">Dead</span>
        <span class="logo-sub">Empire</span>
      </RouterLink>

      <nav
        class="header-wing justify-start rounded-br-sm border-b border-[#4fc3ff]/70 bg-gradient-to-b from-[#182533]/95 to-[#091018]/95 pl-5"
      >
        <RouterLink class="header-link header-link-red" to="/Rules">Rules</RouterLink>
        <RouterLink class="header-link header-link-red" to="/tools">Tools</RouterLink>
        <RouterLink class="header-link header-link-red" to="/log">Game Log</RouterLink>
        <RouterLink class="header-link header-link-blue" to="/profile">{{ profileLabel }}</RouterLink>
      </nav>
    </div>
  </header>
</template>
