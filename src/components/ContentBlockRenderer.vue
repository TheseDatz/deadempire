<script setup>
defineProps({
  blocks: {
    type: Array,
    default: () => [],
  },
  fallbackBody: {
    type: Array,
    default: () => [],
  },
  showGmNotes: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div v-if="blocks.length" class="game-log-body mt-8">
    <template v-for="(block, index) in blocks" :key="`${block.type}-${index}-${block.content || block.url || block.items?.length}`">
      <p
        v-if="block.type === 'text'"
        :class="`game-log-body-text-${block.size}`"
        :style="block.size === 'signal' ? { '--signal-color': block.signalColor || '#4fc3ff' } : null"
      >
        {{ block.content }}
      </p>
      <figure v-else-if="block.type === 'image'" class="game-log-body-image">
        <img :src="block.url" :alt="block.alt" />
        <figcaption v-if="block.alt">{{ block.alt }}</figcaption>
      </figure>
      <p v-else-if="block.type === 'gm-note' && showGmNotes" class="game-log-body-text-gm-note">
        {{ block.content }}
      </p>
      <div v-else-if="block.type === 'accordion'" class="game-log-body-accordion">
        <details v-for="(item, itemIndex) in block.items" :key="`${item.title}-${itemIndex}`">
          <summary>{{ item.title }}</summary>
          <p>{{ item.content }}</p>
        </details>
      </div>
      <section
        v-else-if="block.type === 'reference'"
        class="game-log-body-reference"
        :style="{ '--reference-border-color': block.borderColor || '#4fc3ff' }"
      >
        <h3>{{ block.title }}</h3>
        <p v-if="block.content">{{ block.content }}</p>

        <div v-if="block.sections.length" class="game-log-body-reference-sections">
          <section v-for="(section, sectionIndex) in block.sections" :key="`${section.title}-${sectionIndex}`">
            <h4>{{ section.title }}</h4>
            <p>{{ section.content }}</p>
          </section>
        </div>
      </section>
    </template>
  </div>

  <div v-else class="game-log-body mt-8">
    <p v-for="paragraph in fallbackBody" :key="paragraph">{{ paragraph }}</p>
  </div>
</template>
