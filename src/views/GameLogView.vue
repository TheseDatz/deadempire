<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSession, isAdminSession } from '../services/auth'
import { createGameLog, loadGameLogs } from '../services/gameLogs'

const router = useRouter()
const searchTerm = ref('')
const selectedPlayer = ref('All')
const logs = ref([])
const isLoading = ref(true)
const isAdmin = ref(false)
const isEditorOpen = ref(false)
const isSavingPost = ref(false)
const errorMessage = ref('')
const editorErrorMessage = ref('')
const postForm = ref(createBlankPostForm())

const players = computed(() => [
  'All',
  ...new Set(logs.value.flatMap((log) => log.participatingCharacters)),
].sort((first, second) => {
  if (first === 'All') return -1
  if (second === 'All') return 1
  return first.localeCompare(second)
}))

const filteredLogs = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  return logs.value.filter((log) => {
    const matchesPlayer =
      selectedPlayer.value === 'All' || log.participatingCharacters.includes(selectedPlayer.value)
    const blockText = log.contentBlocks.flatMap((block) =>
      block.type === 'image' ? [block.url, block.alt] : [block.content],
    )
    const haystack = [log.date, log.title, ...log.participatingCharacters, ...log.body, ...blockText]
      .join(' ')
      .toLowerCase()

    return matchesPlayer && (!query || haystack.includes(query))
  })
})

const textSizeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Large', value: 'large' },
  { label: 'Heading', value: 'heading' },
  { label: 'Signal', value: 'signal' },
]

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
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

function openEditor() {
  postForm.value = createBlankPostForm()
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

async function savePost() {
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
  const { log, error } = await createGameLog({
    slug,
    title,
    date: postForm.value.date,
    participatingCharacters: normalizeCharacters(postForm.value.participatingCharacters),
    contentBlocks: blocks,
  })

  if (error) {
    editorErrorMessage.value = error.message
  } else {
    logs.value = [log, ...logs.value]
      .filter((item, index, list) => list.findIndex((candidate) => candidate.slug === item.slug) === index)
      .sort((first, second) => new Date(second.date) - new Date(first.date))
    isEditorOpen.value = false
    postForm.value = createBlankPostForm()
    router.push(`/log/${log.slug}`)
  }

  isSavingPost.value = false
}

async function loadLogs() {
  isLoading.value = true
  errorMessage.value = ''

  const { logs: loadedLogs, error } = await loadGameLogs()

  if (error) {
    errorMessage.value = error.message
    logs.value = []
  } else {
    logs.value = loadedLogs
  }

  isLoading.value = false
}

async function loadAdminState() {
  const { session } = await getSession()
  isAdmin.value = isAdminSession(session)
}

onMounted(() => {
  loadLogs()
  loadAdminState()
})
</script>

<template>
  <main class="game-log-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-5xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Session Archive</p>
      <div class="game-log-title-row mt-2">
        <h1 class="font-serif text-5xl font-bold text-[#4fc3ff]">Game Log</h1>
        <button v-if="isAdmin" class="profile-button" type="button" @click="openEditor">New Post</button>
      </div>

      <section class="game-log-tools mt-10">
        <label>
          <span>Search Logs</span>
          <input v-model="searchTerm" type="search" placeholder="Search title, session text, player..." />
        </label>

        <label>
          <span>Filter Player</span>
          <select v-model="selectedPlayer">
            <option v-for="player in players" :key="player">{{ player }}</option>
          </select>
        </label>
      </section>

      <p v-if="errorMessage" class="mt-8 text-red-200">{{ errorMessage }}</p>
      <p v-else-if="isLoading" class="mt-8 text-cyan-100/70">Loading logs...</p>

      <section v-else class="game-log-list mt-8">
        <RouterLink v-for="log in filteredLogs" :key="log.slug" class="game-log-card" :to="`/log/${log.slug}`">
          <time :datetime="log.date">{{ formatDate(log.date) }}</time>
          <h2>{{ log.title }}</h2>
          <p>{{ log.participatingCharacters.join(', ') }}</p>
        </RouterLink>
      </section>

      <p v-if="!isLoading && !errorMessage && filteredLogs.length === 0" class="mt-8 text-cyan-100/70">
        No matching logs found.
      </p>
    </section>

    <div v-if="isEditorOpen" class="admin-modal-backdrop game-log-editor-backdrop" role="presentation" @click.self="closeEditor">
      <section class="admin-modal game-log-editor-modal" role="dialog" aria-modal="true" aria-labelledby="new-log-title">
        <div class="admin-modal-header">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Draft Console</p>
            <h2 id="new-log-title">New Post</h2>
          </div>
          <button class="admin-icon-button" type="button" aria-label="Close" :disabled="isSavingPost" @click="closeEditor">x</button>
        </div>

        <div class="game-log-editor-layout mt-6">
          <form class="admin-import-form game-log-editor-form" @submit.prevent="savePost">
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
                {{ isSavingPost ? 'Saving...' : 'Save Post' }}
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
  </main>
</template>
