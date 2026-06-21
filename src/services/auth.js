import { isSupabaseConfigured, supabase } from './supabaseClient'

export { isSupabaseConfigured }

export async function getSession() {
  if (!supabase) {
    return { session: null, error: null }
  }

  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export function isAdminSession(session) {
  return session?.user?.app_metadata?.role === 'admin'
}

export function onAuthStateChange(callback) {
  if (!supabase) {
    return null
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}

function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@dead-empire.local`
}

export async function signInWithUsername(username, password) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  if (!/^[a-z0-9_-]+$/i.test(username.trim())) {
    return { error: new Error('Use only letters, numbers, underscores, or hyphens for username.') }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  })

  return { session: data.session, error }
}

export async function updatePassword(password) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  if (password.length < 6) {
    return { error: new Error('Password must be at least 6 characters.') }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return { error: sessionError }
  }

  const userMetadata = sessionData.session?.user?.user_metadata || {}
  const { data, error } = await supabase.auth.updateUser({
    password,
    data: {
      ...userMetadata,
      password_changed_at: new Date().toISOString(),
    },
  })

  return { user: data.user, error }
}

export async function signOut() {
  if (!supabase) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}
