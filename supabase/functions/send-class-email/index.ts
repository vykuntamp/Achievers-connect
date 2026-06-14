// Supabase Edge Function: send-class-email
// Sends a class-update email to all parents in a batch via Resend.
// Deploy:  supabase functions deploy send-class-email
// Secrets: supabase secrets set RESEND_API_KEY=... FROM_EMAIL="Achievers <updates@yourdomain.com>"

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { batchId, subject, topic, homework, remarks, date } = await req.json()

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!   // auto-injected on deploy
    )

    // Parents of students in this batch
    const { data: rows } = await admin
      .from('batch_students')
      .select('students(student_name, parent_name, parent_email, portal_token)')
      .eq('batch_id', batchId)

    const recipients = (rows || [])
      .map((r: any) => r.students)
      .filter((s: any) => s?.parent_email)

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM = Deno.env.get('FROM_EMAIL') || 'Achievers Connect <onboarding@resend.dev>'
    if (!RESEND_API_KEY) return new Response(JSON.stringify({ skipped: 'no RESEND_API_KEY' }), { headers: cors })

    const origin = req.headers.get('origin') || ''
    let sent = 0
    for (const s of recipients) {
      const portalUrl = `${origin}/portal/${s.portal_token}`
      const html = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto">
          <div style="background:#0f2350;color:#fff;padding:20px;border-radius:12px 12px 0 0">
            <h2 style="margin:0;font-family:Georgia,serif">Achievers Connect</h2>
            <p style="margin:4px 0 0;opacity:.7">Class update for ${s.student_name}</p>
          </div>
          <div style="border:1px solid #eee;border-top:0;padding:20px;border-radius:0 0 12px 12px">
            <p><b>Date:</b> ${date}</p>
            ${subject ? `<p><b>Subject:</b> ${subject}</p>` : ''}
            ${topic ? `<p><b>Topic covered:</b> ${topic}</p>` : ''}
            ${homework ? `<p><b>Homework:</b> ${homework}</p>` : ''}
            ${remarks ? `<p><b>Teacher remarks:</b> ${remarks}</p>` : ''}
            <a href="${portalUrl}" style="display:inline-block;margin-top:12px;background:#c9a227;color:#0f2350;
               padding:10px 18px;border-radius:10px;text-decoration:none;font-weight:600">View full portal</a>
          </div>
        </div>`

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: s.parent_email,
          subject: `Class update — ${s.student_name} (${date})`, html
        })
      })
      if (res.ok) sent++
    }

    return new Response(JSON.stringify({ sent }), { headers: { ...cors, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors })
  }
})
