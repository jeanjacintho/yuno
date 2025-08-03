// routes/protected-course-route.tsx
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
  const { folderPath } = useFolder()
  const [showAlert, setShowAlert] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!folderPath) {
      setShowAlert(true)
    }
  }, [folderPath])

  const handleAlertAction = (): void => {
    setShowAlert(false)
    setShowSettings(true)
  }

  const handleAlertClose = (): void => {
    setShowAlert(false)
    setShowSettings(true)
  }

  if (!folderPath) {
    return (
      <>
        <Dashboard />
        <AlertDialog open={showAlert} onOpenChange={handleAlertClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pasta não selecionada</AlertDialogTitle>
              <AlertDialogDescription>
                Você precisa selecionar uma pasta antes de acessar os cursos. Por favor, vá para as
                configurações e selecione uma pasta.
              </AlertDialogDescription>
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
