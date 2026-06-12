<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <main class="min-h-screen bg-[#11110f] px-6 pt-32 text-stone-100">
    <section class="mx-auto max-w-5xl border-t border-[#4fc3ff] py-12">
      <h1 class="font-serif text-4xl font-bold text-[#4fc3ff]">{{ title }}</h1>
    </section>
  </main>
</template>
