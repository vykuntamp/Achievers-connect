import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sendClassEmail } from '../lib/email'
import { Batch } from '../types'
import Spinner from '../components/Spinner'
import { Modal, Field } from './Students'

interface Row {
  id: string; class_date: string; subject: string | null; topic_covered: string | null
  homework: string | null; teacher_remarks: string | null; batch_id: string | null
  batches: { name: string } | null
}

export default function ClassUpdates() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [batches, setBatches] = useState<Batch[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    batch_id: '', subject: '', topic_covered: '', homework: '', teacher_remarks: '',
    class_date: new Date().toISOString().slice(0, 10)
  })

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('class_updates')
      .select('*, batches(name)').order('class_date', { ascending: false }).limit(50)
    const { data: b } = await supabase.from('batches').select('*').order('name')
    setRows(data as Row[]); setBatches(b as Batch[])
    if (b?.length && !form.batch_id) setForm(f => ({ ...f, batch_id: b[0].id }))
  }

  async function save() {
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('class_updates').insert({
      teacher_id: u.user!.id, batch_id: form.batch_id || null,
      subject: form.subject || null, topic_covered: form.topic_covered || null,
      homework: form.homework || null, teacher_remarks: form.teacher_remarks || null,
      class_date: form.class_date
    })
    if (form.batch_id) sendClassEmail({
      batchId: form.batch_id, subject: form.subject, topic: form.topic_covered,
      homework: form.homework, remarks: form.teacher_remarks, date: form.class_date
    })
    setOpen(false); load()
  }
  async function remove(id: string) {
    if (!confirm('Delete this update?')) return
    await supabase.from('class_updates').delete().eq('id', id); load()
  }

  if (!rows) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl text-navy">Class Updates</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ New Update</button>
      </div>

      <div className="space-y-3">
        {rows.map(r => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-navy">{r.subject || 'Class'} · {r.topic_covered}</p>
                <p className="text-sm text-slate-500">{r.batches?.name} · {r.class_date}</p>
              </div>
              <button className="text-rose-600 text-xs" onClick={() => remove(r.id)}>Delete</button>
            </div>
            {r.homework && <p className="text-sm mt-2"><b className="text-slate-600">Homework:</b> {r.homework}</p>}
            {r.teacher_remarks && <p className="text-sm mt-1"><b className="text-slate-600">Remarks:</b> {r.teacher_remarks}</p>}
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400">No class updates yet.</p>}
      </div>

      {open && (
        <Modal title="New class update" onClose={() => setOpen(false)}>
          <div className="grid gap-3">
            <Field label="Batch">
              <select className="field" value={form.batch_id} onChange={e => setForm({ ...form, batch_id: e.target.value })}>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject"><input className="field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></Field>
              <Field label="Date"><input className="field" type="date" value={form.class_date} onChange={e => setForm({ ...form, class_date: e.target.value })} /></Field>
            </div>
            <Field label="Topic covered"><input className="field" value={form.topic_covered} onChange={e => setForm({ ...form, topic_covered: e.target.value })} /></Field>
            <Field label="Homework"><textarea className="field" rows={2} value={form.homework} onChange={e => setForm({ ...form, homework: e.target.value })} /></Field>
            <Field label="Teacher remarks"><textarea className="field" rows={2} value={form.teacher_remarks} onChange={e => setForm({ ...form, teacher_remarks: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" onClick={save}>Save & notify parents</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
