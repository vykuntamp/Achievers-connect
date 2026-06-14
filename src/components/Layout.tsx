import { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/quick', label: 'Quick Entry', icon: '⚡' },
  { to: '/students', label: 'Students', icon: '👩‍🎓' },
  { to: '/batches', label: 'Batches', icon: '🗂️' },
  { to: '/updates', label: 'Class Updates', icon: '📝' },
  { to: '/announcements', label: 'Announcements', icon: '📣' }
]

export default function Layout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-navy text-white p-5">
        <Brand />
        <nav className="mt-8 flex-1 space-y-1">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'}`}>
              <span>{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn-ghost text-slate-700 mt-4" onClick={() => { signOut(); navigate('/login') }}>
          Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-20 bg-navy text-white px-4 py-3 flex items-center justify-between">
        <Brand small />
        <button className="text-white/80 text-sm" onClick={() => { signOut(); navigate('/login') }}>Sign out</button>
      </header>

      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-5xl mx-auto w-full">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 grid grid-cols-6">
        {nav.map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 text-[10px] ${isActive ? 'text-navy' : 'text-slate-400'}`}>
            <span className="text-lg">{n.icon}</span>{n.label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold text-navy font-display font-semibold">A</div>
      {!small && <div>
        <p className="font-display text-lg leading-tight">Achievers</p>
        <p className="text-xs text-white/60 -mt-0.5">Connect</p>
      </div>}
    </div>
  )
}
