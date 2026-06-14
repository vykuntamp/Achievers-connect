import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Batch, Student } from '../types'
import Spinner from '../components/Spinner'
import { Modal, Field } from './Students'

export default function Batches() {
  const [batches, setBatches] = useState<Batch[] | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [members, setMembers] = useState<Record<string, string[]>>({})
  const [open, setOpen] = useState(false)
  const [assignFor, setAssignFor] = useState<Batch | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { load() }, [])
  async function load() {
    const { data: b } = await supabase.from('batches').select('*').order('created_at', { ascending: false })
    const { data: s } = await supabase.from('students').select('*').eq('is_active', true)
    const { data: bs } = await supabase.from('batch_students').select('*')
    const m: Record<string, string[]> = {}
    bs?.forEach(r => { (m[r.batch_id] ||= []).push(r.student_id) })
    setBatches(b as Batch[]); setStudents(s as Student[]); setMembers(m)
  }

  async function create() {
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('batches').insert({ teacher_id: u.user!.id, name: form.name, description: form.description || null })
    setOpen(false); setForm({ name: '', description: '' }); load()
  }
  async function remove(id: string) {
    if (!confirm('Delete batch?')) return
    await supabase.from('batches').delete().eq('id', id); load()
  }
  async function toggle(batchId: string, studentId: string, on: boolean) {
    if (on) await supabase.from('batch_students').insert({ batch_id: batchId, student_id: studentId })
    else await supabase.from('batch_students').delete().eq('batch_id', batchId).eq('student_id', studentId)
    load()
  }

  if (!batches) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl text-navy">Batches</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>+ Create Batch</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {batches.map(b => (
          <div key={b.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-navy">{b.name}</p>
                {b.description && <p className="text-sm text-slate-500">{b.description}</p>}
              </div>
              <span className="chip bg-gold-50 text-gold-600">{members[b.id]?.length || 0} students</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button className="btn-ghost text-xs py-1.5" onClick={() => setAssignFor(b)}>Manage students</button>
              <button className="btn-ghost text-xs py-1.5 text-rose-600" onClick={() => remove(b.id)}>Delete</button>
            </div>
          </div>
        ))}
        {batches.length === 0 && <p className="text-slate-400">No batches yet.</p>}
      </div>

      {open && (
        <Modal title="Create batch" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Batch name *"><input className="field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Description / schedule"><input className="field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" disabled={!form.name} onClick={create}>Create</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}

      {assignFor && (
        <Modal title={`Students in ${assignFor.name}`} onClose={() => setAssignFor(null)}>
          <div className="space-y-2 max-h-80 overflow-auto">
            {students.map(s => {
              const on = members[assignFor.id]?.includes(s.id)
              return (
                <label key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                  <span className="text-sm">{s.student_name} <span className="text-slate-400">· {s.class_grade}</span></span>
                  <input type="checkbox" checked={!!on} onChange={e => toggle(assignFor.id, s.id, e.target.checked)} className="h-5 w-5 accent-navy" />
                </label>
              )
            })}
            {students.length === 0 && <p className="text-slate-400 text-sm">Add students first.</p>}
          </div>
          <button className="btn-primary w-full mt-4" onClick={() => setAssignFor(null)}>Done</button>
        </Modal>
      )}
    </div>
  )
}
