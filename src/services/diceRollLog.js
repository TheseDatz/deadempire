import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null

export const isDiceRollLoggingConfigured = Boolean(supabase)

export async function getLatestDiceRolls(limit = 25) {
  if (!supabase) {
    return { data: [], error: null }
  }

  return supabase
    .from('dice_rolls')
    .select(
      'id, created_at, page, route_name, source, dice_count, modifier, subtotal, total, wild_total, wild_status, wild_breakdown, dice_breakdown',
    )
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function logDiceRoll(roll) {
  if (!supabase) {
    return
  }

  const { error } = await supabase.from('dice_rolls').insert({
    page: roll.page,
    route_name: roll.routeName || null,
    source: roll.source,
    dice_count: roll.diceCount,
    modifier: roll.modifier,
    subtotal: roll.subtotal,
    total: roll.total,
    wild_total: roll.wildTotal,
    wild_status: roll.wildStatus,
    wild_breakdown: roll.wildBreakdown,
    dice_breakdown: roll.diceBreakdown,
  })

  if (error) {
    console.warn('Dice roll log failed:', error.message)
  }
}

export function subscribeToDiceRolls(onInsert) {
  if (!supabase) {
    return null
  }

  const channel = supabase
    .channel('dice-roll-log')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dice_rolls',
      },
      (payload) => onInsert(payload.new),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
