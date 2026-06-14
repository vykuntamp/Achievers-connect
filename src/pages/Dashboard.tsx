import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TUITION_LABELS } from '../types'
import Spinner from '../components/Spinner'
import StatusBadge from '../components/StatusBadge'

interface Stats {
  total: number
  byType: Record<string, number>
  present: number; absent: number; leave: number
  recent: { date: string; status: string; name: string }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: students } = await supabase.from('students')
      .select('id, student_name, tuition_type').eq('is_active', true)
    const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)
    const { data: att } = await supabase.from('attendance')
      .select('status, attendance_date, students(student_name)')
      .gte('attendance_date', since).order('attendance_date', { ascending: false }).limit(200)

    const byType: Record<string, number> = { home: 0, online: 0, home_visit: 0 }
    students?.forEach(s => { byType[s.tuition_type] = (byType[s.tuition_type] || 0) + 1 })

    const present = att?.filter(a => a.status === 'present').length || 0
    const absent = att?.filter(a => a.status === 'absent').length || 0
    const leave = att?.filter(a => a.status === 'leave').length || 0

    const recent = (att || []).slice(0, 8).map((a: any) => ({
      date: a.attendance_date, status: a.status, name: a.students?.student_name ?? 'Student'
    }))

    setStats({ total: students?.length || 0, byType, present, absent, leave, recent })
  }

  if (!stats) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-navy">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your tuition business</p>
        </div>
        <Link to="/quick" className="btn-gold">⚡ Quick Entry</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total Students" value={stats.total} />
        <Stat label="Home" value={stats.byType.home} />
        <Stat label="Online" value={stats.byType.online} />
        <Stat label="Home Visit" value={stats.byType.home_visit} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-display text-lg text-navy mb-3">Attendance (30 days)</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Mini label="Present" value={stats.present} cls="text-emerald-600" />
            <Mini label="Absent" value={stats.absent} cls="text-rose-600" />
            <Mini label="Leave" value={stats.leave} cls="text-amber-600" />
          </div>
        </div>
        <div className="card">
          <h2 className="font-display text-lg text-navy mb-3">Recent activity</h2>
          {stats.recent.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recent.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{r.name}</span>
                  <span className="flex items-center gap-2 text-slate-400">
                    {r.date}<StatusBadge status={r.status as any} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="font-display text-3xl text-navy mt-1">{value}</p>
    </div>
  )
}
function Mini({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className="rounded-xl bg-slate-50 py-3">
      <p className={`font-display text-2xl ${cls}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
