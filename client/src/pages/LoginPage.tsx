export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-2xl font-semibold">Yuno</h1>
        <p className="text-sm text-slate-400">
          Conecte sua conta do Telegram para acessar seus cursos.
        </p>
        {/* telefone → código → senha 2FA */}
      </div>
    </div>
  )
}
