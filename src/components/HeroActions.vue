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
      :key="action.id || `${action.label}-${action.to}`"
      :to="action.to"
      :aria-label="action.ariaLabel || action.label"
      class="hero-action"
      :class="[{ 'hero-action-primary': action.primary }, action.class]"
    >
      <span class="hero-action-label">{{ action.label }}</span>
    </RouterLink>
  </div>
</template>
