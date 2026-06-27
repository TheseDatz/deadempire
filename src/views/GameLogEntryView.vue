<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContentBlockEditor from '../components/ContentBlockEditor.vue'
import ContentBlockPreview from '../components/ContentBlockPreview.vue'
import ContentBlockRenderer from '../components/ContentBlockRenderer.vue'
import { getSession, isAdminSession } from '../services/auth'
import {
  createBlankBlockList,
  findInvalidImageBlock,
  formBlocksFromContent,
  normalizeDelimitedList,
  normalizeEditorBlocks,
  slugify,
} from '../services/contentBlocks'
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

function formatDate(date) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function createBlankPostForm() {
  return {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    participatingCharacters: '',
    blocks: createBlankBlockList(),
  }
}

function formBlocksFromLog(gameLog) {
  return formBlocksFromContent(gameLog.contentBlocks, gameLog.body)
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

async function saveEdit() {
  editorErrorMessage.value = ''

  const title = postForm.value.title.trim()
  const blocks = normalizeEditorBlocks(postForm.value.blocks)
  const invalidImage = findInvalidImageBlock(blocks)

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

  const slug = `${slugify(title, 'game-log')}-${postForm.value.date}`
  const { log: updatedLog, error } = await updateGameLog(log.value.slug, {
    slug,
    title,
    date: postForm.value.date,
    participatingCharacters: normalizeDelimitedList(postForm.value.participatingCharacters),
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

      <ContentBlockRenderer :blocks="log.contentBlocks" :fallback-body="log.body" :show-gm-notes="isAdmin" />

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

              <ContentBlockEditor v-model="postForm.blocks" :disabled="isSavingPost" />

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

            <ContentBlockPreview
              :title="postForm.title"
              :date="postForm.date"
              :meta="postForm.participatingCharacters"
              empty-meta="No characters listed"
              :blocks="postForm.blocks"
            />
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
