import { supabase } from './supabase'

export async function sendClassEmail(payload: {
  batchId: string
  subject: string | null
  topic: string | null
  homework: string | null
  remarks: string | null
  date: string
}) {
  try {
    const { error } = await supabase.functions.invoke('send-class-email', { body: payload })
    if (error) console.error('Email send failed:', error.message)
  } catch (e) {
    console.error('Email send error:', e)
  }
}
