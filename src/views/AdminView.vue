<script setup>
import { ref } from 'vue'
import {
  exportCharacterSheetBackup,
  isSupabaseConfigured,
} from '../services/characterSheets'

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
            Character sheets are stored in Supabase as JSON. Download a backup before large edits.
          </p>

          <div class="admin-actions mt-6">
            <button class="profile-button" type="button" :disabled="isWorking" @click="downloadCharacterBackup">
              Download Backup
            </button>
          </div>

        </template>

        <p v-if="message" class="profile-message mt-5">{{ message }}</p>
        <p v-if="errorMessage" class="profile-message profile-message-error mt-5">{{ errorMessage }}</p>
      </section>
    </section>
  </main>
</template>
