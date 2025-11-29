import { useFolder } from '../context/folder-context'
import { ReactNode, useState, useEffect } from 'react'
import SettingsDialog from '../pages/settings/settings'
import Dashboard from '../pages/dashboard/dashboard'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@renderer/components/ui/alert-dialog'

interface ProtectedCourseRouteProps {
  children: ReactNode
}

const ProtectedCourseRoute = ({ children }: ProtectedCourseRouteProps): React.JSX.Element => {
  const { folderPath, isValid, isValidating } = useFolder()
  const [showAlert, setShowAlert] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    if (isValidating) {
      return
    }

    if (!folderPath || !isValid) {
      if (!folderPath) {
        setAlertMessage(
          'Você precisa selecionar uma pasta antes de acessar os cursos. Por favor, vá para as configurações e selecione uma pasta.'
        )
      } else {
        setAlertMessage(
          'A pasta selecionada não foi encontrada. Ela pode ter sido movida, renomeada ou o dispositivo pode estar desconectado. Por favor, selecione uma nova pasta nas configurações.'
        )
      }
      setShowAlert(true)
    }
  }, [folderPath, isValid, isValidating])

  const handleAlertAction = (): void => {
    setShowAlert(false)
    setShowSettings(true)
  }

  const handleAlertClose = (): void => {
    setShowAlert(false)
    setShowSettings(true)
  }

  if (isValidating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Verificando pasta...</p>
        </div>
      </div>
    )
  }

  if (!folderPath || !isValid) {
    return (
      <>
        <Dashboard />
        <AlertDialog open={showAlert} onOpenChange={handleAlertClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {!folderPath ? 'Pasta não selecionada' : 'Pasta não encontrada'}
              </AlertDialogTitle>
              <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleAlertAction}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      </>
    )
  }

  return <>{children}</>
}

export default ProtectedCourseRoute
