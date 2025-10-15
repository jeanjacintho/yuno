import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate()

  // Login instantâneo ao carregar a página
  useEffect(() => {
    const handleInstantLogin = async () => {
      try {
        // Capturar nome do usuário do sistema
        const usernameResult = await window.api.getSystemUsername()
        if (usernameResult.success && usernameResult.username) {
          // Criar usuário automaticamente no banco
          const createResult = await window.api.createSystemUser(usernameResult.username)
          if (createResult.success) {
            console.log('Usuário do sistema inicializado:', createResult.user)

            // Toast de login instantâneo
            toast.success('Você está logado!', {
              description: `Bem-vindo, ${usernameResult.username}!`
            })

            // Navegar imediatamente para dashboard
            navigate('/dashboard')
          } else {
            console.error('Erro ao criar usuário do sistema:', createResult.message)
            toast.error('Erro ao fazer login', {
              description: createResult.message || 'Não foi possível fazer login automaticamente.'
            })
          }
        } else {
          console.error('Erro ao capturar nome do usuário:', usernameResult.error)
          toast.error('Erro de sistema', {
            description: 'Não foi possível detectar o usuário do sistema.'
          })
        }
      } catch (error) {
        console.error('Erro no login:', error)
        toast.error('Erro no login', {
          description: 'Ocorreu um erro ao fazer login.'
        })
      }
    }

    handleInstantLogin()
  }, [navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao início
          </Link>

          <div className="flex items-center justify-center">
            <div className="flex items-center md:gap-x-12">
              <a aria-label="logo" className="flex items-center gap-3" href="/">
                <img src="/src/assets/yuno-icon.svg" className="w-auto" />
              </a>
            </div>
          </div>
        </div>

        {/* Loading Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fazendo Login</CardTitle>
            <CardDescription>Aguarde enquanto configuramos seu acesso...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
