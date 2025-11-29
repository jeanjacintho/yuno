import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { waitForApi } from '@renderer/lib/wait-for-api'

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Aguarde enquanto configuramos seu acesso...')
  const hasAttemptedLogin = useRef(false)

  useEffect(() => {
    const handleInstantLogin = async (): Promise<void> => {
      if (hasAttemptedLogin.current) {
        return
      }

      hasAttemptedLogin.current = true
      setIsLoading(true)
      setError(null)
      setStatusMessage('Aguarde enquanto configuramos seu acesso...')

      try {
        setStatusMessage('Aguardando API estar disponível...')
        const apiAvailable = await waitForApi(50, 200)

        if (!apiAvailable || !window.api) {
          console.error('[Login] API não disponível após espera')
          console.error('[Login] window:', typeof window)
          console.error('[Login] window.api:', typeof window?.api)
          console.error('[Login] window keys:', typeof window !== 'undefined' ? Object.keys(window) : 'window undefined')
          
          setError(
            'API não disponível. Por favor, recarregue a página ou reinicie o aplicativo.'
          )
          setIsLoading(false)
          setStatusMessage('Erro ao conectar com o sistema')
          return
        }

        console.log('[Login] API encontrada, métodos disponíveis:', Object.keys(window.api))

        setStatusMessage('Obtendo informações do usuário...')

        const usernameResult = await window.api.getSystemUsername()

        if (!usernameResult.success || !usernameResult.username) {
          const errorMessage =
            usernameResult.error || 'Não foi possível detectar o usuário do sistema.'
          setError(errorMessage)
          setIsLoading(false)
          setStatusMessage('Erro ao obter informações do usuário')
          toast.error('Erro de sistema', {
            description: errorMessage
          })
          return
        }

        setStatusMessage('Criando sua conta...')
        const createResult = await window.api.createSystemUser(usernameResult.username)

        if (!createResult.success) {
          const errorMessage =
            createResult.message || 'Não foi possível fazer login automaticamente.'
          setError(errorMessage)
          setIsLoading(false)
          setStatusMessage('Erro ao criar conta')
          toast.error('Erro ao fazer login', {
            description: errorMessage
          })
          return
        }

        if (createResult.user) {
          console.log('Usuário do sistema inicializado:', createResult.user)

          try {
            localStorage.setItem('currentUserId', String(createResult.user.id))
          } catch (localStorageError) {
            console.warn('Erro ao salvar userId no localStorage:', localStorageError)
          }
        }

        setStatusMessage('Login realizado com sucesso!')
        toast.success('Você está logado!', {
          description: `Bem-vindo, ${usernameResult.username}!`
        })

        await new Promise((resolve) => setTimeout(resolve, 500))

        setStatusMessage('Redirecionando para o dashboard...')
        try {
          navigate('/dashboard', { replace: true })

          setTimeout(() => {
            if (window.location.pathname === '/auth/login') {
              console.warn('Navegação falhou, tentando redirecionamento forçado')
              window.location.href = '/dashboard'
            }
          }, 1000)
        } catch (navigationError) {
          console.error('Erro na navegação:', navigationError)
          window.location.href = '/dashboard'
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Ocorreu um erro ao fazer login.'
        console.error('Erro no login:', error)
        setError(errorMessage)
        setIsLoading(false)
        toast.error('Erro no login', {
          description: errorMessage
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
            <CardDescription>{statusMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {isLoading ? (
                <>
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{statusMessage}</p>
                </>
              ) : error ? (
                <>
                  <p className="text-sm text-destructive font-medium">{error}</p>
                  <button
                    onClick={() => {
                      hasAttemptedLogin.current = false
                      setIsLoading(true)
                      setError(null)
                      window.location.reload()
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Tentar novamente
                  </button>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
