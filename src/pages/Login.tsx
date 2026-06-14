import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setErr(null); setBusy(true)
    const fn = mode === 'in' ? signIn : signUp
    const message = await fn(email, password)
    setBusy(false)
    if (message) { setErr(message); return }
    if (mode === 'up') { setErr('Account created. You can sign in now.'); setMode('in'); return }
    navigate('/')
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-navy">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 text-white">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold text-navy font-display text-2xl font-semibold">A</div>
          <h1 className="font-display text-3xl mt-3">Achievers Connect</h1>
          <p className="text-white/60 text-sm">Teacher admin sign in</p>
        </div>
        <div className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="field" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="field" type="password" value={password}
              onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <p className="text-sm text-rose-600">{err}</p>}
          <button className="btn-primary w-full" disabled={busy} onClick={submit}>
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-500">
            {mode === 'in' ? 'No account yet?' : 'Already registered?'}{' '}
            <button className="text-navy font-medium" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(null) }}>
              {mode === 'in' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
