import { useState } from 'react'
import { api, type AuthUser } from '../lib/api'

type LoginStep = 'phone' | 'code' | 'password'

type LoginPageProps = {
  onAuthenticated: (user: AuthUser) => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [step, setStep] = useState<LoginStep>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [isCodeViaApp, setIsCodeViaApp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await api.auth.start(phone)
      setIsCodeViaApp(result.isCodeViaApp)
      setStep('code')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await api.auth.verify({ phone, code })

      if (result.requiresPassword) {
        setStep('password')
        return
      }

      if (result.user) {
        onAuthenticated(result.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyPassword(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = await api.auth.verify({ phone, password })

      if (result.user) {
        onAuthenticated(result.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-slate-800 bg-slate-900 p-8">
        <div>
          <h1 className="text-2xl font-semibold">Yuno</h1>
          <p className="mt-2 text-sm text-slate-400">
            Connect your Telegram account to turn your groups into courses.
          </p>
        </div>

        {step === 'phone' && (
          <form className="space-y-4" onSubmit={handleStart}>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Phone number</span>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-violet-500 focus:ring-2"
                placeholder="+5511999999999"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </label>
            <button
              className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium transition hover:bg-violet-500 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Sending code...' : 'Send verification code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form className="space-y-4" onSubmit={handleVerifyCode}>
            <p className="text-sm text-slate-400">
              {isCodeViaApp
                ? 'Enter the code sent to your Telegram app.'
                : 'Enter the SMS code sent to your phone.'}
            </p>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Verification code</span>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-violet-500 focus:ring-2"
                inputMode="numeric"
                placeholder="12345"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
            </label>
            <button
              className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium transition hover:bg-violet-500 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
            <button
              className="w-full text-sm text-slate-400 hover:text-slate-200"
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
              }}
            >
              Use a different phone number
            </button>
          </form>
        )}

        {step === 'password' && (
          <form className="space-y-4" onSubmit={handleVerifyPassword}>
            <p className="text-sm text-slate-400">
              Two-factor authentication is enabled on this account.
            </p>
            <label className="block space-y-2 text-sm">
              <span className="text-slate-300">Password</span>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none ring-violet-500 focus:ring-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <button
              className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium transition hover:bg-violet-500 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
