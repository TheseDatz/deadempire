<script setup>
const tools = [
  { label: 'Combat', to: '/combat' },
  { label: 'Space Combat', to: '/space-combat' },
  { label: 'Bazaar', to: '/bazaar' },
  { label: 'Canvas', to: '/canvas' },
  { label: 'Inspiration', to: '/Inspiration' },
  { label: 'Bestiary', to: '/bestiary' },
  { label: 'Character Wizard', to: '/character-wizard' },
  { label: 'Roll Log', to: '/roll-log' },
]
</script>

<template>
  <main class="tools-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-6xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Campaign Utilities</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Tools</h1>

      <div class="tools-grid mt-10">
        <RouterLink
          v-for="tool in tools"
          :key="tool.to"
          class="tool-card"
          :class="{ 'tool-card-small': tool.label.length > 12 }"
          :to="tool.to"
        >
          {{ tool.label }}
        </RouterLink>
      </div>
    </section>
  </main>
</template>
