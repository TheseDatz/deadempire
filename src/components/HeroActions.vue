<script setup>
defineProps({
  actions: {
    type: Array,
    default: () => [
      { label: 'Learn More', to: '/' },
      { label: 'Play Now', to: '/', primary: true },
      { label: 'Watch Cinematic', to: '/' },
    ],
  },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 px-6 sm:flex-row">
    <RouterLink
      v-for="action in actions"
      :key="`${action.label}-${action.to}`"
      :to="action.to"
      class="hero-action"
      :class="{ 'hero-action-primary': action.primary }"
    >
      {{ action.label }}
    </RouterLink>
  </div>
</template>
