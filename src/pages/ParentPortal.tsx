import { useEffect, useState } from 'react'
import { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'

interface Portal {
  student: { student_name: string; class_grade: string; tuition_type: string; subjects: string[] }
  attendance: { date: string; status: string }[]
  class_updates: { date: string; subject: string; topic: string; homework: string; remarks: string }[]
  announcements: { title: string; body: string; date: string }[]
}

const statusStyle: Record<string, string> = {
  present: 'bg-emerald-50 text-emerald-700',
  absent:  'bg-rose-50 text-rose-700',
  leave:   'bg-amber-50 text-amber-700'
}

export default function ParentPortal() {
  const { token } = useParams()
  const [data, setData] = useState<Portal | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase.rpc('get_parent_portal', { p_token: token }).then(({ data, error }) => {
      if (error || !data) { setNotFound(true); return }
      setData(data as Portal)
    })
  }, [token])

  if (notFound) return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="font-display text-2xl text-navy">Link not found</p>
        <p className="text-slate-500 mt-2">This portal link is invalid or has been disabled. Please contact your teacher.</p>
      </div>
    </div>
  )
  if (!data) return <Spinner />

  const present = data.attendance.filter(a => a.status === 'present').length
  const total = data.attendance.length
  const pct = total ? Math.round((present / total) * 100) : 0

  return (
    <div className="min-h-screen bg-navy-50">
      <header className="bg-navy text-white px-5 py-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-white/60 text-sm">Achievers Connect · Parent View</p>
          <h1 className="font-display text-2xl mt-1">{data.student.student_name}</h1>
          <p className="text-white/70 text-sm">{data.student.class_grade} · {data.student.subjects.join(', ')}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5 pb-12">
        <section className="grid grid-cols-3 gap-3">
          <Stat label="Attendance" value={`${pct}%`} />
          <Stat label="Present" value={present} />
          <Stat label="Classes" value={total} />
        </section>

        {data.announcements.length > 0 && (
          <Section title="Announcements">
            {data.announcements.map((a, i) => (
              <div key={i} className="card">
                <p className="font-semibold text-navy">{a.title}</p>
                <p className="text-sm text-slate-600 mt-1">{a.body}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(a.date).toLocaleDateString()}</p>
              </div>
            ))}
          </Section>
        )}

        <Section title="Recent classes">
          {data.class_updates.length === 0 ? <Empty /> : data.class_updates.map((c, i) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-navy">{c.subject || 'Class'}{c.topic ? ` · ${c.topic}` : ''}</p>
                <span className="text-xs text-slate-400">{c.date}</span>
              </div>
              {c.homework && <p className="text-sm mt-2"><b className="text-slate-600">Homework:</b> {c.homework}</p>}
              {c.remarks && <p className="text-sm mt-1"><b className="text-slate-600">Remarks:</b> {c.remarks}</p>}
            </div>
          ))}
        </Section>

        <Section title="Attendance history">
          {data.attendance.length === 0 ? <Empty /> : (
            <div className="card grid grid-cols-2 sm:grid-cols-3 gap-2">
              {data.attendance.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-xs text-slate-500">{a.date}</span>
                  <span className={`chip ${statusStyle[a.status] || ''}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <p className="text-center text-xs text-slate-400 pt-2">This is a private link. Please do not share it.</p>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <p className="font-display text-2xl text-navy">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg text-navy">{title}</h2>
      {children}
    </section>
  )
}
function Empty() { return <p className="text-slate-400 text-sm">Nothing here yet.</p> }
