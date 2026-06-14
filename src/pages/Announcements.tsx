import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Announcement, Audience } from '../types'
import Spinner from '../components/Spinner'
import { Modal, Field } from './Students'

const audLabel: Record<Audience, string> = {
  all: 'All students', home: 'Home tuition', online: 'Online', home_visit: 'Home visit'
}

export default function Announcements() {
  const [list, setList] = useState<Announcement[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', audience: 'all' as Audience })

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setList(data as Announcement[])
  }
  async function save() {
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('announcements').insert({ teacher_id: u.user!.id, ...form })
    setOpen(false); setForm({ title: '', body: '', audience: 'all' }); load()
  }
  async function remove(id: string) {
    if (!confirm('Delete announcement?')) return
    await supabase.from('announcements').delete().eq('id', id); load()
  }

  if (!list) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl text-navy">Announcements</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ New</button>
      </div>
      <div className="space-y-3">
        {list.map(a => (
          <div key={a.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-navy">{a.title}</p>
                <span className="chip bg-navy-50 text-navy mt-1">{audLabel[a.audience]}</span>
              </div>
              <button className="text-rose-600 text-xs" onClick={() => remove(a.id)}>Delete</button>
            </div>
            <p className="text-sm text-slate-600 mt-2">{a.body}</p>
          </div>
        ))}
        {list.length === 0 && <p className="text-slate-400">No announcements yet.</p>}
      </div>

      {open && (
        <Modal title="New announcement" onClose={() => setOpen(false)}>
          <div className="grid gap-3">
            <Field label="Title"><input className="field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Audience">
              <select className="field" value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as Audience })}>
                <option value="all">All students</option><option value="home">Home tuition</option>
                <option value="online">Online</option><option value="home_visit">Home visit</option>
              </select>
            </Field>
            <Field label="Message"><textarea className="field" rows={4} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" disabled={!form.title || !form.body} onClick={save}>Publish</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
