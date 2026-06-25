<script setup>
defineProps({
  references: {
    type: Array,
    required: true,
  },
})

const bulletLead = (bullet) => {
  const colonIndex = bullet.indexOf(':')
  return colonIndex === -1 ? '' : bullet.slice(0, colonIndex + 1)
}

const bulletRest = (bullet) => {
  const colonIndex = bullet.indexOf(':')
  return colonIndex === -1 ? bullet : bullet.slice(colonIndex + 1)
}
</script>

<template>
  <section
    v-for="reference in references"
    :key="reference.title"
    class="reference-card"
    :class="{ 'reference-card-alert': reference.alert }"
  >
    <h3>{{ reference.title }}</h3>
    <p :class="{ 'reference-summary-alert': reference.summaryAlert }">{{ reference.summary }}</p>
    <p v-if="reference.goldNote" class="reference-gold-note">{{ reference.goldNote }}</p>

    <div v-if="reference.links" class="reference-links">
      <RouterLink v-for="link in reference.links" :key="link.to" :to="link.to">
        {{ link.label }}
      </RouterLink>
    </div>

    <ul v-if="reference.bullets" class="reference-bullets">
      <li v-for="bullet in reference.bullets" :key="bullet">
        <template v-if="bulletLead(bullet)">
          <strong>{{ bulletLead(bullet) }}</strong>{{ bulletRest(bullet) }}
        </template>
        <template v-else>{{ bullet }}</template>
      </li>
    </ul>

    <div v-if="reference.sections" class="reference-subsections">
      <section v-for="section in reference.sections" :key="section.title">
        <h4>{{ section.title }}</h4>
        <p>{{ section.body }}</p>
        <div v-if="section.table" class="reference-two-column-table">
          <div v-for="column in section.table.columns" :key="column" class="reference-two-column-cell">
            <h5>{{ column }}</h5>
            <ul v-if="section.table.items?.[column]?.length">
              <li v-for="item in section.table.items[column]" :key="item">{{ item }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>

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
