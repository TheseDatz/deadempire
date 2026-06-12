<script setup>
import SiteHeader from './components/SiteHeader.vue'
import FooterNav from './components/FooterNav.vue'
import DiceRoller from './components/DiceRoller.vue'
</script>

<template>
  <div class="min-h-screen bg-[#0c0c0b] text-stone-100">
    <SiteHeader />
    <RouterView />
    <FooterNav />
    <DiceRoller />
  </div>
</template>
