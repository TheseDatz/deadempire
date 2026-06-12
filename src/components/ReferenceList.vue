<script setup>
defineProps({
  references: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <section v-for="reference in references" :key="reference.title" class="reference-card">
    <h3>{{ reference.title }}</h3>
    <p>{{ reference.summary }}</p>

    <ul v-if="reference.bullets" class="reference-bullets">
      <li v-for="bullet in reference.bullets" :key="bullet">{{ bullet }}</li>
    </ul>

    <div v-if="reference.rows" class="damage-chart-table">
      <div
        class="damage-chart-head"
        :style="{ gridTemplateColumns: `repeat(${reference.columns.length}, minmax(0, 1fr))` }"
      >
        <span v-for="column in reference.columns" :key="column">{{ column }}</span>
      </div>
      <div
        v-for="row in reference.rows"
        :key="row.join('-')"
        class="damage-chart-row"
        :style="{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }"
      >
        <span v-for="cell in row" :key="cell">{{ cell }}</span>
      </div>
    </div>
  </section>
</template>
