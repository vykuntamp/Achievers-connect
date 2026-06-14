import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { sendClassEmail } from '../lib/email'
import { Batch, Student, AttendanceStatus } from '../types'
import Spinner from '../components/Spinner'

const cycle: AttendanceStatus[] = ['present', 'absent', 'leave']
const statusStyle: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-500 text-white',
  absent:  'bg-rose-500 text-white',
  leave:   'bg-amber-500 text-white'
}

export default function QuickEntry() {
  const [batches, setBatches] = useState<Batch[] | null>(null)
  const [batchId, setBatchId] = useState('')
  const [roster, setRoster] = useState<Student[]>([])
  const [att, setAtt] = useState<Record<string, AttendanceStatus>>({})
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [homework, setHomework] = useState('')
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    supabase.from('batches').select('*').order('name').then(({ data }) => {
      setBatches(data as Batch[])
      if (data?.length) setBatchId(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!batchId) return
    supabase.from('batch_students').select('students(*)').eq('batch_id', batchId)
      .then(({ data }) => {
        const r = (data || []).map((row: any) => row.students) as Student[]
        setRoster(r)
        const init: Record<string, AttendanceStatus> = {}
        r.forEach(s => { init[s.id] = 'present' })   // default present = fewer taps
        setAtt(init)
      })
  }, [batchId])

  function flip(id: string) {
    setAtt(a => {
      const next = cycle[(cycle.indexOf(a[id]) + 1) % cycle.length]
      return { ...a, [id]: next }
    })
  }

  async function saveAll() {
    setBusy(true)
    const { data: u } = await supabase.auth.getUser()
    const teacher_id = u.user!.id

    // 1. Class update
    const { data: cu } = await supabase.from('class_updates').insert({
      teacher_id, batch_id: batchId, subject: subject || null, topic_covered: topic || null,
      homework: homework || null, teacher_remarks: remarks || null, class_date: date
    }).select('id').single()

    // 2. Attendance for every student in one insert
    const rows = roster.map(s => ({
      teacher_id, class_update_id: cu!.id, student_id: s.id,
      batch_id: batchId, status: att[s.id], attendance_date: date
    }))
    if (rows.length) await supabase.from('attendance').insert(rows)

    // 3. Fire email notification (non-blocking)
    sendClassEmail({ batchId, subject, topic, homework, remarks, date })

    setBusy(false); setDone(true)
    setTimeout(() => setDone(false), 2500)
    setSubject(''); setTopic(''); setHomework(''); setRemarks('')
  }

  if (!batches) return <Spinner />

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl text-navy">Quick Class Entry</h1>
        <p className="text-sm text-slate-500">Mark attendance and log the lesson in one save.</p>
      </div>

      {batches.length === 0 ? (
        <div className="card text-slate-500">Create a batch and add students first.</div>
      ) : (
        <>
          <div className="card space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Batch</label>
                <select className="field" value={batchId} onChange={e => setBatchId(e.target.value)}>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg text-navy">Attendance</h2>
              <p className="text-xs text-slate-400">Tap a name to change status</p>
            </div>
            <div className="space-y-2">
              {roster.map(s => (
                <button key={s.id} onClick={() => flip(s.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 active:scale-[.99]">
                  <span className="text-sm font-medium text-slate-700">{s.student_name}</span>
                  <span className={`chip ${statusStyle[att[s.id]]}`}>{att[s.id]}</span>
                </button>
              ))}
              {roster.length === 0 && <p className="text-slate-400 text-sm">No students assigned to this batch.</p>}
            </div>
          </div>

          <div className="card grid gap-3">
            <h2 className="font-display text-lg text-navy">Lesson details</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="field" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
              <input className="field" placeholder="Topic covered" value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
            <textarea className="field" rows={2} placeholder="Homework" value={homework} onChange={e => setHomework(e.target.value)} />
            <textarea className="field" rows={2} placeholder="Teacher remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
          </div>

          <button className="btn-gold w-full text-base py-3" disabled={busy || !batchId} onClick={saveAll}>
            {busy ? 'Saving…' : done ? '✓ Saved & parents notified' : 'Save everything'}
          </button>
        </>
      )}
    </div>
  )
}
