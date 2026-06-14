import { AttendanceStatus } from '../types'

const map: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-50 text-emerald-700',
  absent:  'bg-rose-50 text-rose-700',
  leave:   'bg-amber-50 text-amber-700'
}
export default function StatusBadge({ status }: { status: AttendanceStatus }) {
  return <span className={`chip ${map[status]}`}>{status[0].toUpperCase() + status.slice(1)}</span>
}
