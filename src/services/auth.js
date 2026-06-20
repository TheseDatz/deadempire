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

export async function signInWithEmail(email, password) {
  if (!supabase) {
    return { error: new Error('Supabase is not configured.') }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { error }
}

export async function signOut() {
  if (!supabase) {
    return { error: null }
  }

  const { error } = await supabase.auth.signOut()
  return { error }
}
