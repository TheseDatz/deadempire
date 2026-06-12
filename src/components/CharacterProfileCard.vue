<script setup>
defineProps({
  character: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <RouterLink
    class="character-card"
    :to="`/playercharacter/${character.id}`"
  >
    <img class="character-card-photo" :src="character.photo" :alt="character.name" />

    <div class="min-w-0">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="truncate font-serif text-2xl font-bold text-white">
            {{ character.name }}
          </h3>
          <p class="mt-1 text-sm uppercase tracking-[0.18em] text-cyan-200/80">
            {{ character.playerName }}
          </p>
        </div>

        <span class="character-level">Pts. {{ character.characterPoints }}</span>
      </div>

      <p class="mt-4 line-clamp-2 text-base leading-6 text-slate-300">
        {{ character.tagline }}
      </p>
    </div>
  </RouterLink>
</template>
