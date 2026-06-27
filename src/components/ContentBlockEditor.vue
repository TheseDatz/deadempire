<script setup>
import {
  createAccordionBlock,
  createAccordionItem,
  createGmNoteBlock,
  createImageBlock,
  createReferenceBlock,
  createReferenceSection,
  createTextBlock,
  textSizeOptions,
} from '../services/contentBlocks'

const blocks = defineModel({ type: Array, required: true })

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  enableAccordion: {
    type: Boolean,
    default: false,
  },
  enableReference: {
    type: Boolean,
    default: false,
  },
})

function addTextBlock() {
  blocks.value.push(createTextBlock())
}

function addImageBlock() {
  blocks.value.push(createImageBlock())
}

function addGmNoteBlock() {
  blocks.value.push(createGmNoteBlock())
}

function addAccordionBlock() {
  blocks.value.push(createAccordionBlock())
}

function addReferenceBlock() {
  blocks.value.push(createReferenceBlock())
}

function addAccordionItem(block) {
  block.items.push(createAccordionItem())
}

function addReferenceSection(block) {
  block.sections.push(createReferenceSection())
}

function removeAccordionItem(block, index) {
  block.items.splice(index, 1)

  if (!block.items.length) {
    block.items.push(createAccordionItem())
  }
}

function removeReferenceSection(block, index) {
  block.sections.splice(index, 1)

  if (!block.sections.length) {
    block.sections.push(createReferenceSection())
  }
}

function removeBlock(index) {
  blocks.value.splice(index, 1)

  if (!blocks.value.length) {
    addTextBlock()
  }
}

function moveBlock(index, direction) {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= blocks.value.length) {
    return
  }

  const [block] = blocks.value.splice(index, 1)
  blocks.value.splice(targetIndex, 0, block)
}

function blockLabel(block) {
  if (block.type === 'image') return 'Image Block'
  if (block.type === 'gm-note') return 'GM Note'
  if (block.type === 'accordion') return 'Accordion Block'
  if (block.type === 'reference') return 'Reference Block'
  return 'Text Block'
}
</script>

<template>
  <section class="game-log-block-tools">
    <button class="profile-button profile-button-secondary" type="button" :disabled="disabled" @click="addTextBlock">
      Add Text
    </button>
    <button class="profile-button profile-button-secondary" type="button" :disabled="disabled" @click="addImageBlock">
      Add Image
    </button>
    <button class="profile-button profile-button-secondary" type="button" :disabled="disabled" @click="addGmNoteBlock">
      Add GM Note
    </button>
    <button
      v-if="enableAccordion"
      class="profile-button profile-button-secondary"
      type="button"
      :disabled="disabled"
      @click="addAccordionBlock"
    >
      Add Accordion
    </button>
    <button
      v-if="enableReference"
      class="profile-button profile-button-secondary"
      type="button"
      :disabled="disabled"
      @click="addReferenceBlock"
    >
      Add Reference
    </button>
  </section>

  <section class="game-log-block-list" aria-label="Post blocks">
    <article v-for="(block, index) in blocks" :key="block.id" class="game-log-editor-block">
      <div class="game-log-editor-block-header">
        <strong>{{ blockLabel(block) }}</strong>
        <div>
          <button class="admin-icon-button" type="button" :disabled="disabled || index === 0" @click="moveBlock(index, -1)">
            Up
          </button>
          <button
            class="admin-icon-button"
            type="button"
            :disabled="disabled || index === blocks.length - 1"
            @click="moveBlock(index, 1)"
          >
            Down
          </button>
          <button class="admin-icon-button" type="button" :disabled="disabled" @click="removeBlock(index)">x</button>
        </div>
      </div>

      <template v-if="block.type === 'text'">
        <label>
          <span>Text Size</span>
          <select v-model="block.size" :disabled="disabled">
            <option v-for="option in textSizeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label>
          <span>Copy</span>
          <textarea v-model="block.content" rows="4" :disabled="disabled"></textarea>
        </label>

        <label v-if="block.size === 'signal'">
          <span>Signal Color</span>
          <input v-model="block.signalColor" type="color" :disabled="disabled" />
        </label>
      </template>

      <template v-else-if="block.type === 'image'">
        <label>
          <span>Image URL</span>
          <input v-model="block.url" type="url" placeholder="https://..." :disabled="disabled" />
        </label>

        <label>
          <span>Alt Text</span>
          <input v-model="block.alt" type="text" :disabled="disabled" />
        </label>
      </template>

      <template v-else-if="block.type === 'accordion'">
        <section class="game-log-accordion-editor">
          <div class="admin-list-editor-header">
            <span>Items</span>
            <button class="profile-button profile-button-secondary" type="button" :disabled="disabled" @click="addAccordionItem(block)">
              Add Item
            </button>
          </div>

          <div v-for="(_item, itemIndex) in block.items" :key="block.items[itemIndex].id" class="game-log-accordion-editor-item">
            <label>
              <span>Heading</span>
              <input v-model="block.items[itemIndex].title" type="text" :disabled="disabled" />
            </label>

            <label>
              <span>Content</span>
              <textarea v-model="block.items[itemIndex].content" rows="3" :disabled="disabled"></textarea>
            </label>

            <button
              class="profile-button profile-button-secondary"
              type="button"
              :disabled="disabled || (block.items.length === 1 && !block.items[0].title && !block.items[0].content)"
              @click="removeAccordionItem(block, itemIndex)"
            >
              Remove
            </button>
          </div>
        </section>
      </template>

      <template v-else-if="block.type === 'reference'">
        <div class="admin-form-grid admin-form-grid-two">
          <label>
            <span>Header</span>
            <input v-model="block.title" type="text" :disabled="disabled" />
          </label>

          <label>
            <span>Border Color</span>
            <input v-model="block.borderColor" type="color" :disabled="disabled" />
          </label>
        </div>

        <label>
          <span>Text</span>
          <textarea v-model="block.content" rows="3" :disabled="disabled"></textarea>
        </label>

        <section class="game-log-reference-editor">
          <div class="admin-list-editor-header">
            <span>Text Boxes</span>
            <button class="profile-button profile-button-secondary" type="button" :disabled="disabled" @click="addReferenceSection(block)">
              Add Text Box
            </button>
          </div>

          <div v-for="(_section, sectionIndex) in block.sections" :key="block.sections[sectionIndex].id" class="game-log-reference-editor-section">
            <label>
              <span>Subheader</span>
              <input v-model="block.sections[sectionIndex].title" type="text" :disabled="disabled" />
            </label>

            <label>
              <span>Text</span>
              <textarea v-model="block.sections[sectionIndex].content" rows="3" :disabled="disabled"></textarea>
            </label>

            <button
              class="profile-button profile-button-secondary"
              type="button"
              :disabled="
                disabled ||
                (block.sections.length === 1 && !block.sections[0].title && !block.sections[0].content)
              "
              @click="removeReferenceSection(block, sectionIndex)"
            >
              Remove
            </button>
          </div>
        </section>
      </template>

      <template v-else>
        <label>
          <span>GM Note</span>
          <textarea v-model="block.content" rows="4" :disabled="disabled"></textarea>
        </label>
      </template>
    </article>
  </section>
</template>
