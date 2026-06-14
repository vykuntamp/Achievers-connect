import { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Student, TuitionType, TUITION_LABELS } from '../types'
import Spinner from '../components/Spinner'

const empty = {
  student_name: '', parent_name: '', parent_email: '', parent_mobile: '',
  class_grade: '', tuition_type: 'home' as TuitionType, subjects: '',
  joining_date: new Date().toISOString().slice(0, 10), monthly_fee: ''
}

export default function Students() {
  const [list, setList] = useState<Student[] | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [editId, setEditId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [])
  async function load() {
    const { data } = await supabase.from('students').select('*')
      .order('created_at', { ascending: false })
    setList(data as Student[])
  }

  function edit(s: Student) {
    setEditId(s.id)
    setForm({
      student_name: s.student_name, parent_name: s.parent_name ?? '',
      parent_email: s.parent_email ?? '', parent_mobile: s.parent_mobile ?? '',
      class_grade: s.class_grade ?? '', tuition_type: s.tuition_type,
      subjects: s.subjects.join(', '), joining_date: s.joining_date,
      monthly_fee: s.monthly_fee?.toString() ?? ''
    })
    setOpen(true)
  }

  async function save() {
    setBusy(true)
    const { data: u } = await supabase.auth.getUser()
    const payload = {
      teacher_id: u.user!.id,
      student_name: form.student_name,
      parent_name: form.parent_name || null,
      parent_email: form.parent_email || null,
      parent_mobile: form.parent_mobile || null,
      class_grade: form.class_grade || null,
      tuition_type: form.tuition_type,
      subjects: form.subjects.split(',').map(s => s.trim()).filter(Boolean),
      joining_date: form.joining_date,
      monthly_fee: form.monthly_fee ? Number(form.monthly_fee) : null
    }
    if (editId) await supabase.from('students').update(payload).eq('id', editId)
    else await supabase.from('students').insert(payload)
    setBusy(false); setOpen(false); setForm({ ...empty }); setEditId(null); load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this student?')) return
    await supabase.from('students').delete().eq('id', id); load()
  }

  function copyPortal(token: string) {
    const url = `${location.origin}/portal/${token}`
    navigator.clipboard.writeText(url)
    alert('Parent portal link copied:\n' + url)
  }

  if (!list) return <Spinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl text-navy">Students</h1>
        <button className="btn-primary" onClick={() => { setForm({ ...empty }); setEditId(null); setOpen(true) }}>
          + Add Student
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {list.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-navy">{s.student_name}</p>
                <p className="text-sm text-slate-500">{s.class_grade} · {TUITION_LABELS[s.tuition_type]}</p>
              </div>
              <span className="chip bg-navy-50 text-navy">{s.subjects.length} subj</span>
            </div>
            {s.parent_name && <p className="text-sm text-slate-500 mt-2">Parent: {s.parent_name}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              <button className="btn-ghost text-xs py-1.5" onClick={() => copyPortal(s.portal_token)}>🔗 Portal link</button>
              <button className="btn-ghost text-xs py-1.5" onClick={() => edit(s)}>Edit</button>
              <button className="btn-ghost text-xs py-1.5 text-rose-600" onClick={() => remove(s.id)}>Delete</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-slate-400">No students yet. Add your first one.</p>}
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)} title={editId ? 'Edit student' : 'Add student'}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Student name *"><input className="field" value={form.student_name} onChange={e => setForm({ ...form, student_name: e.target.value })} /></Field>
            <Field label="Class / Grade"><input className="field" value={form.class_grade} onChange={e => setForm({ ...form, class_grade: e.target.value })} /></Field>
            <Field label="Parent name"><input className="field" value={form.parent_name} onChange={e => setForm({ ...form, parent_name: e.target.value })} /></Field>
            <Field label="Parent mobile"><input className="field" value={form.parent_mobile} onChange={e => setForm({ ...form, parent_mobile: e.target.value })} /></Field>
            <Field label="Parent email"><input className="field" type="email" value={form.parent_email} onChange={e => setForm({ ...form, parent_email: e.target.value })} /></Field>
            <Field label="Tuition type">
              <select className="field" value={form.tuition_type} onChange={e => setForm({ ...form, tuition_type: e.target.value as TuitionType })}>
                <option value="home">Home</option><option value="online">Online</option><option value="home_visit">Home Visit</option>
              </select>
            </Field>
            <Field label="Subjects (comma separated)"><input className="field" value={form.subjects} onChange={e => setForm({ ...form, subjects: e.target.value })} /></Field>
            <Field label="Joining date"><input className="field" type="date" value={form.joining_date} onChange={e => setForm({ ...form, joining_date: e.target.value })} /></Field>
            <Field label="Monthly fee (optional)"><input className="field" type="number" value={form.monthly_fee} onChange={e => setForm({ ...form, monthly_fee: e.target.value })} /></Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary flex-1" disabled={busy || !form.student_name} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 bg-black/40 grid place-items-end sm:place-items-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-xl text-navy mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
