<script setup>
import { ref } from 'vue'
import {
  exportCharacterSheetBackup,
  importCharacterSheets,
  isSupabaseConfigured,
} from '../services/characterSheets'

const importCategory = ref('player')
const importFile = ref(null)
const isWorking = ref(false)
const message = ref('')
const errorMessage = ref('')

function clearFeedback() {
  message.value = ''
  errorMessage.value = ''
}

function downloadJson(filename, data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function downloadCharacterBackup() {
  clearFeedback()
  isWorking.value = true

  const { data, error } = await exportCharacterSheetBackup()

  if (error) {
    errorMessage.value = error.message
  } else {
    downloadJson('dead-empire-character-sheets-backup.json', {
      exportedAt: new Date().toISOString(),
      character_sheets: data,
    })
    message.value = `Downloaded ${data.length} character sheet backup ${data.length === 1 ? 'row' : 'rows'}.`
  }

  isWorking.value = false
}

async function importCharacterJson() {
  clearFeedback()

  const file = importFile.value?.files?.[0]

  if (!file) {
    errorMessage.value = 'Choose a JSON file to import.'
    return
  }

  isWorking.value = true

  try {
    const payload = JSON.parse(await file.text())
    const { count, error } = await importCharacterSheets(payload, importCategory.value)

    if (error) {
      errorMessage.value = error.message
    } else {
      message.value = `Imported ${count} character ${count === 1 ? 'sheet' : 'sheets'}.`
      importFile.value.value = ''
    }
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isWorking.value = false
  }
}
</script>

<template>
  <main class="admin-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-5xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Command Access</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Admin</h1>

      <section class="admin-panel mt-10">
        <h2>Character Sheet Database</h2>

        <p v-if="!isSupabaseConfigured" class="profile-message profile-message-error mt-5">
          Supabase environment variables are not configured for this build.
        </p>

        <template v-else>
          <p class="admin-copy mt-3">
            Character sheets are stored in Supabase as JSON. Download a backup before large edits or import existing sheet JSON here.
          </p>

          <div class="admin-actions mt-6">
            <button class="profile-button" type="button" :disabled="isWorking" @click="downloadCharacterBackup">
              Download Backup
            </button>
          </div>

          <form class="admin-import-form mt-8" @submit.prevent="importCharacterJson">
            <label>
              <span>Import Category</span>
              <select v-model="importCategory">
                <option value="player">Player Character</option>
                <option value="npc">Important NPC</option>
              </select>
            </label>

            <label>
              <span>Character JSON</span>
              <input ref="importFile" type="file" accept="application/json,.json" />
            </label>

            <button class="profile-button" type="submit" :disabled="isWorking">
              Import JSON
            </button>
          </form>
        </template>

        <p v-if="message" class="profile-message mt-5">{{ message }}</p>
        <p v-if="errorMessage" class="profile-message profile-message-error mt-5">{{ errorMessage }}</p>
      </section>
    </section>
  </main>
</template>
