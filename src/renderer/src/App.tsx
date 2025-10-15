import { useNavigate } from 'react-router-dom'
import { Button } from './components/ui/button'

function App(): React.JSX.Element {
  const navigate = useNavigate()

  function handleLogin(): void {
    navigate('/auth/login')
  }

  return (
    <main className="flex flex-col h-full py-10 z-10">
      <header>
        <div className="mx-auto max-w-7xl px-10">
          <nav className="relative z-50 flex justify-between">
            <div className="flex items-center md:gap-x-12">
              <a aria-label="home" className="flex items-center gap-3" href="/">
                <img src="/src/assets/yuno-icon.svg" />
              </a>
            </div>
            <div className="flex items-center gap-x-5">
              <Button onClick={handleLogin} className="bg-primary text-sidebar-primary-foreground">
                Entrar
              </Button>
            </div>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 w-full flex flex-col items-center pt-12 pb-8">
        <div className="max-w-2xl flex flex-col items-center text-center">
          <h1 className=" leading-none font-bold tracking-tighter text-balance text-7xl">
            A solução
            <span className="whitespace-nowrap italic text-primary">
              <span className="font bold"> definitiva </span>
            </span>
            para sua educação
          </h1>
          <p className="mt-4 text-base sm:text-xl text-zinc-400 leading-relaxed">
            Seu conteúdo, seu PC: LMS que lê e reproduz vídeos locais com fluidez e simplicidade.
          </p>
          <div className="mt-8 flex justify-center gap-x-6">
            <Button onClick={handleLogin} className="bg-primary text-sidebar-primary-foreground">
              Entrar
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
