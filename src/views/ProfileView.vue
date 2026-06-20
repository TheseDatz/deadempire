<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getSession,
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithUsername,
  signOut,
} from '../services/auth'

const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const session = ref(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const message = ref('')
const errorMessage = ref('')
let unsubscribe = null

const userEmail = computed(() => session.value?.user?.email || '')
const displayName = computed(() => userEmail.value.replace(/@dead-empire\.local$/, ''))
const redirectPath = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : ''
})

function clearFeedback() {
  message.value = ''
  errorMessage.value = ''
}

async function handleSignIn() {
  clearFeedback()
  isSubmitting.value = true

  const { error } = await signInWithUsername(username.value, password.value)

  if (error) {
    errorMessage.value = error.message
  } else {
    message.value = 'Signed in.'
    password.value = ''

    if (redirectPath.value) {
      router.replace(redirectPath.value)
    }
  }

  isSubmitting.value = false
}

async function handleSignOut() {
  clearFeedback()
  isSubmitting.value = true

  const { error } = await signOut()

  if (error) {
    errorMessage.value = error.message
  } else {
    message.value = 'Signed out.'
  }

  isSubmitting.value = false
}

onMounted(async () => {
  const { session: activeSession, error } = await getSession()

  if (error) {
    errorMessage.value = error.message
  }

  session.value = activeSession
  isLoading.value = false

  unsubscribe = onAuthStateChange((activeSession) => {
    session.value = activeSession
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<template>
  <main class="profile-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-3xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Crew Access</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Profile</h1>

      <section class="profile-panel mt-10">
        <p v-if="!isSupabaseConfigured" class="profile-message profile-message-error">
          Supabase environment variables are not configured for this build.
        </p>
        <p v-else-if="isLoading" class="profile-message">Checking session...</p>

        <template v-else-if="session">
          <p class="profile-kicker">Signed in as</p>
          <h2>{{ displayName }}</h2>
          <p class="mt-3 text-cyan-100/80">You can now use authenticated campaign features as they are added.</p>

          <button class="profile-button mt-6" type="button" :disabled="isSubmitting" @click="handleSignOut">
            Sign Out
          </button>
        </template>

        <form v-else class="profile-form" @submit.prevent="handleSignIn">
          <p v-if="redirectPath" class="profile-message">
            Sign in to access that page.
          </p>

          <p class="text-cyan-100/80">
            Sign in with the account credentials provided by the GM.
          </p>

          <label>
            <span>Username</span>
            <input
              v-model="username"
              type="text"
              autocomplete="username"
              pattern="[A-Za-z0-9_-]+"
              title="Use only letters, numbers, underscores, or hyphens."
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input v-model="password" type="password" autocomplete="current-password" minlength="6" required />
          </label>

          <div class="profile-actions">
            <button class="profile-button" type="submit" :disabled="isSubmitting">Sign In</button>
          </div>
        </form>

        <p v-if="message" class="profile-message mt-5">{{ message }}</p>
        <p v-if="errorMessage" class="profile-message profile-message-error mt-5">{{ errorMessage }}</p>
      </section>
    </section>
  </main>
</template>
