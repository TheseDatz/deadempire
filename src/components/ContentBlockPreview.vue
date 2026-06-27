<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  date: {
    type: String,
    default: '',
  },
  meta: {
    type: String,
    default: '',
  },
  emptyMeta: {
    type: String,
    default: 'No metadata listed',
  },
  blocks: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <aside class="game-log-editor-preview" aria-label="Draft preview">
    <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Preview</p>
    <h3>{{ title || 'Untitled Post' }}</h3>
    <p class="game-log-editor-preview-meta">{{ date }} / {{ meta || emptyMeta }}</p>

    <div class="game-log-editor-preview-body">
      <template v-for="block in blocks" :key="`preview-${block.id}`">
        <p
          v-if="block.type === 'text'"
          :class="`game-log-preview-text-${block.size}`"
          :style="block.size === 'signal' ? { '--signal-color': block.signalColor || '#4fc3ff' } : null"
        >
          {{ block.content || 'Draft text...' }}
        </p>
        <figure v-else-if="block.type === 'image'" class="game-log-preview-image">
          <img v-if="block.url" :src="block.url" :alt="block.alt" />
          <div v-else class="game-log-preview-image-empty">Image URL preview</div>
          <figcaption v-if="block.alt">{{ block.alt }}</figcaption>
        </figure>
        <p v-else-if="block.type === 'gm-note'" class="game-log-preview-text-gm-note">
          {{ block.content || 'GM note...' }}
        </p>
        <div v-else-if="block.type === 'accordion'" class="game-log-preview-accordion">
          <details v-for="(item, index) in block.items" :key="item.id || index" open>
            <summary>{{ item.title || 'Accordion item' }}</summary>
            <p>{{ item.content || 'Accordion content...' }}</p>
          </details>
        </div>
        <section
          v-else-if="block.type === 'reference'"
          class="game-log-preview-reference"
          :style="{ '--reference-border-color': block.borderColor || '#4fc3ff' }"
        >
          <h4>{{ block.title || 'Reference header' }}</h4>
          <p>{{ block.content || 'Reference text...' }}</p>

          <div v-if="block.sections?.length" class="game-log-preview-reference-sections">
            <section v-for="(section, index) in block.sections" :key="section.id || index">
              <h5>{{ section.title || 'Subheader' }}</h5>
              <p>{{ section.content || 'Text box content...' }}</p>
            </section>
          </div>
        </section>
      </template>
    </div>
  </aside>
</template>
