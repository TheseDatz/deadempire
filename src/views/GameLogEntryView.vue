<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSession, isAdminSession } from '../services/auth'
import { deleteGameLog, loadGameLog, updateGameLog } from '../services/gameLogs'

const route = useRoute()
const router = useRouter()
const log = ref(null)
const isLoading = ref(true)
const isAdmin = ref(false)
const isEditorOpen = ref(false)
const isSavingPost = ref(false)
const isDeletingPost = ref(false)
const errorMessage = ref('')
const editorErrorMessage = ref('')
const postForm = ref(createBlankPostForm())

const textSizeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' },
  { label: 'Heading', value: 'heading' },
  { label: 'Signal', value: 'signal' },
]

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function createTextBlock(content = '', size = 'normal') {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    size,
    content,
  }
}

function createImageBlock(url = '', alt = '') {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    url,
    alt,
  }
}

function createGmNoteBlock(content = '') {
  return {
    id: crypto.randomUUID(),
    type: 'gm-note',
    content,
  }
}

function createBlankPostForm() {
  return {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    participatingCharacters: '',
    blocks: [createTextBlock()],
  }
}

function slugify(value) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'game-log'
}

function normalizeCharacters(value) {
  return value
    .split(',')
    .map((character) => character.trim())
    .filter(Boolean)
}

function normalizeEditorBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === 'image') {
        return {
          type: 'image',
          url: block.url.trim(),
          alt: block.alt.trim(),
        }
      }

      if (block.type === 'gm-note') {
        return {
          type: 'gm-note',
          content: block.content.trim(),
        }
      }

      return {
        type: 'text',
        size: block.size,
        content: block.content.trim(),
      }
    })
    .filter((block) => (block.type === 'image' ? block.url : block.content))
}

function formBlocksFromLog(gameLog) {
  if (gameLog.contentBlocks.length) {
    return gameLog.contentBlocks.map((block) => {
      if (block.type === 'image') {
        return createImageBlock(block.url, block.alt)
      }

      if (block.type === 'gm-note') {
        return createGmNoteBlock(block.content)
      }

      return createTextBlock(block.content, block.size)
    })
  }

  return gameLog.body.length
    ? gameLog.body.map((paragraph) => createTextBlock(paragraph))
    : [createTextBlock()]
}

function openEditor() {
  if (!log.value) {
    return
  }

  postForm.value = {
    title: log.value.title,
    date: log.value.date,
    participatingCharacters: log.value.participatingCharacters.join(', '),
    blocks: formBlocksFromLog(log.value),
  }
  editorErrorMessage.value = ''
  isEditorOpen.value = true
}

function closeEditor() {
  if (isSavingPost.value) {
    return
  }

  isEditorOpen.value = false
}

function addTextBlock() {
  postForm.value.blocks.push(createTextBlock())
}

function addImageBlock() {
  postForm.value.blocks.push(createImageBlock())
}

function addGmNoteBlock() {
  postForm.value.blocks.push(createGmNoteBlock())
}

function removeBlock(index) {
  postForm.value.blocks.splice(index, 1)

  if (!postForm.value.blocks.length) {
    addTextBlock()
  }
}

function moveBlock(index, direction) {
  const targetIndex = index + direction

  if (targetIndex < 0 || targetIndex >= postForm.value.blocks.length) {
    return
  }

  const [block] = postForm.value.blocks.splice(index, 1)
  postForm.value.blocks.splice(targetIndex, 0, block)
}

async function saveEdit() {
  editorErrorMessage.value = ''

  const title = postForm.value.title.trim()
  const blocks = normalizeEditorBlocks(postForm.value.blocks)
  const invalidImage = blocks.find(
    (block) => block.type === 'image' && !/^https?:\/\//i.test(block.url),
  )

  if (!title) {
    editorErrorMessage.value = 'Title is required.'
    return
  }

  if (!postForm.value.date) {
    editorErrorMessage.value = 'Date is required.'
    return
  }

  if (!blocks.length) {
    editorErrorMessage.value = 'Add at least one text or image block.'
    return
  }

  if (invalidImage) {
    editorErrorMessage.value = 'Image URLs must start with http:// or https://.'
    return
  }

  isSavingPost.value = true

  const slug = `${slugify(title)}-${postForm.value.date}`
  const { log: updatedLog, error } = await updateGameLog(log.value.slug, {
    slug,
    title,
    date: postForm.value.date,
    participatingCharacters: normalizeCharacters(postForm.value.participatingCharacters),
    contentBlocks: blocks,
  })

  if (error) {
    editorErrorMessage.value = error.message
  } else {
    log.value = updatedLog
    isEditorOpen.value = false

    if (route.params.logSlug !== updatedLog.slug) {
      router.replace(`/log/${updatedLog.slug}`)
    }
  }

  isSavingPost.value = false
}

async function deletePost() {
  if (!log.value || isDeletingPost.value) {
    return
  }

  const confirmed = window.confirm(`Delete "${log.value.title}"? This cannot be undone.`)

  if (!confirmed) {
    return
  }

  isDeletingPost.value = true
  errorMessage.value = ''

  const { error } = await deleteGameLog(log.value.slug)

  if (error) {
    errorMessage.value = error.message
    isDeletingPost.value = false
  } else {
    router.push('/log')
  }
}

async function loadLog(slug) {
  isLoading.value = true
  errorMessage.value = ''
  log.value = null

  const { log: loadedLog, error } = await loadGameLog(slug)

  if (error) {
    errorMessage.value = error.message
  } else {
    log.value = loadedLog
  }

  isLoading.value = false
}

async function loadAdminState() {
  const { session } = await getSession()
  isAdmin.value = isAdminSession(session)
}

onMounted(() => {
  loadLog(route.params.logSlug)
  loadAdminState()
})
watch(() => route.params.logSlug, loadLog)
</script>

<template>
  <main class="game-log-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section v-if="isLoading" class="mx-auto max-w-4xl border-t border-[#4fc3ff] py-12">
      <p class="text-cyan-100/70">Loading log...</p>
    </section>

    <section v-else-if="errorMessage" class="mx-auto max-w-4xl border-t border-[#4fc3ff] py-12">
      <h1 class="font-serif text-4xl font-bold text-[#4fc3ff]">Log Unavailable</h1>
      <p class="mt-4 text-red-200">{{ errorMessage }}</p>
      <RouterLink class="game-log-back-link mt-6" to="/log">Back to logs</RouterLink>
    </section>

    <article v-else-if="log" class="game-log-entry mx-auto max-w-4xl">
      <div class="game-log-entry-actions">
        <RouterLink class="game-log-back-link" to="/log">Back to logs</RouterLink>

        <div v-if="isAdmin" class="game-log-admin-actions">
          <button class="profile-button profile-button-secondary" type="button" :disabled="isDeletingPost" @click="openEditor">
            Edit Log
          </button>
          <button class="profile-button profile-button-danger" type="button" :disabled="isDeletingPost" @click="deletePost">
            {{ isDeletingPost ? 'Deleting...' : 'Delete Log' }}
          </button>
        </div>
      </div>

      <header class="mt-8 border-b border-[#4fc3ff]/35 pb-8">
        <time :datetime="log.date">{{ formatDate(log.date) }}</time>
        <h1 class="mt-3 font-serif text-5xl font-bold text-[#4fc3ff]">{{ log.title }}</h1>
        <p class="mt-4">{{ log.participatingCharacters.join(', ') }}</p>
      </header>

      <div v-if="log.contentBlocks.length" class="game-log-body mt-8">
        <template v-for="(block, index) in log.contentBlocks" :key="`${block.type}-${index}-${block.content || block.url}`">
          <p v-if="block.type === 'text'" :class="`game-log-body-text-${block.size}`">
            {{ block.content }}
          </p>
          <figure v-else-if="block.type === 'image'" class="game-log-body-image">
            <img :src="block.url" :alt="block.alt" />
            <figcaption v-if="block.alt">{{ block.alt }}</figcaption>
          </figure>
          <p v-else-if="isAdmin" class="game-log-body-text-gm-note">
            {{ block.content }}
          </p>
        </template>
      </div>

      <div v-else class="game-log-body mt-8">
        <p v-for="paragraph in log.body" :key="paragraph">{{ paragraph }}</p>
      </div>

      <div v-if="isEditorOpen" class="admin-modal-backdrop game-log-editor-backdrop" role="presentation" @click.self="closeEditor">
        <section class="admin-modal game-log-editor-modal" role="dialog" aria-modal="true" aria-labelledby="edit-log-title">
          <div class="admin-modal-header">
            <div>
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Draft Console</p>
              <h2 id="edit-log-title">Edit Log</h2>
            </div>
            <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingPost" @click="closeEditor">x</button>
          </div>

          <div class="game-log-editor-layout mt-6">
            <form class="admin-import-form game-log-editor-form" @submit.prevent="saveEdit">
              <div class="admin-form-grid admin-form-grid-two">
                <label>
                  <span>Title</span>
                  <input v-model="postForm.title" type="text" required />
                </label>

                <label>
                  <span>Date</span>
                  <input v-model="postForm.date" type="date" required />
                </label>
              </div>

              <label>
                <span>Characters</span>
                <input v-model="postForm.participatingCharacters" type="text" />
              </label>

              <section class="game-log-block-tools">
                <button class="profile-button profile-button-secondary" type="button" @click="addTextBlock">
                  Add Text
                </button>
                <button class="profile-button profile-button-secondary" type="button" @click="addImageBlock">
                  Add Image
                </button>
                <button class="profile-button profile-button-secondary" type="button" @click="addGmNoteBlock">
                  Add GM Note
                </button>
              </section>

              <section class="game-log-block-list" aria-label="Post blocks">
                <article v-for="(block, index) in postForm.blocks" :key="block.id" class="game-log-editor-block">
                  <div class="game-log-editor-block-header">
                    <strong>{{ block.type === 'image' ? 'Image Block' : block.type === 'gm-note' ? 'GM Note' : 'Text Block' }}</strong>
                    <div>
                      <button class="admin-icon-button" type="button" :disabled="isSavingPost || index === 0" @click="moveBlock(index, -1)">
                        Up
                      </button>
                      <button
                        class="admin-icon-button"
                        type="button"
                        :disabled="isSavingPost || index === postForm.blocks.length - 1"
                        @click="moveBlock(index, 1)"
                      >
                        Down
                      </button>
                      <button class="admin-icon-button" type="button" :disabled="isSavingPost" @click="removeBlock(index)">x</button>
                    </div>
                  </div>

                  <template v-if="block.type === 'text'">
                    <label>
                      <span>Text Size</span>
                      <select v-model="block.size">
                        <option v-for="option in textSizeOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </option>
                      </select>
                    </label>

                    <label>
                      <span>Copy</span>
                      <textarea v-model="block.content" rows="4"></textarea>
                    </label>
                  </template>

                  <template v-else-if="block.type === 'image'">
                    <label>
                      <span>Image URL</span>
                      <input v-model="block.url" type="url" placeholder="https://..." />
                    </label>

                    <label>
                      <span>Alt Text</span>
                      <input v-model="block.alt" type="text" />
                    </label>
                  </template>

                  <template v-else>
                    <label>
                      <span>GM Note</span>
                      <textarea v-model="block.content" rows="4"></textarea>
                    </label>
                  </template>
                </article>
              </section>

              <p v-if="editorErrorMessage" class="profile-message profile-message-error">{{ editorErrorMessage }}</p>

              <div class="admin-actions">
                <button class="profile-button" type="submit" :disabled="isSavingPost">
                  {{ isSavingPost ? 'Saving...' : 'Save Changes' }}
                </button>
                <button class="profile-button profile-button-secondary" type="button" :disabled="isSavingPost" @click="closeEditor">
                  Cancel
                </button>
              </div>
            </form>

            <aside class="game-log-editor-preview" aria-label="Draft preview">
              <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Preview</p>
              <h3>{{ postForm.title || 'Untitled Post' }}</h3>
              <p class="game-log-editor-preview-meta">
                {{ postForm.date }} / {{ postForm.participatingCharacters || 'No characters listed' }}
              </p>

              <div class="game-log-editor-preview-body">
                <template v-for="block in postForm.blocks" :key="`preview-${block.id}`">
                  <p v-if="block.type === 'text'" :class="`game-log-preview-text-${block.size}`">
                    {{ block.content || 'Draft text...' }}
                  </p>
                  <figure v-else-if="block.type === 'image'" class="game-log-preview-image">
                    <img v-if="block.url" :src="block.url" :alt="block.alt" />
                    <div v-else class="game-log-preview-image-empty">Image URL preview</div>
                    <figcaption v-if="block.alt">{{ block.alt }}</figcaption>
                  </figure>
                  <p v-else class="game-log-preview-text-gm-note">
                    {{ block.content || 'GM note...' }}
                  </p>
                </template>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </article>

    <section v-else class="mx-auto max-w-4xl border-t border-[#4fc3ff] py-12">
      <h1 class="font-serif text-4xl font-bold text-[#4fc3ff]">Log Not Found</h1>
      <RouterLink class="game-log-back-link mt-6" to="/log">Back to logs</RouterLink>
    </section>
  </main>
</template>
