import { toast as sonnerToast } from 'sonner'

export function useToast() {
  const toast = (
    message: string,
    options?: {
      description?: string
      action?: {
        label: string
        onClick: () => void
      }
      duration?: number
    }
  ) => {
    return sonnerToast(message, {
      description: options?.description,
      action: options?.action
        ? {
            label: options.action.label,
            onClick: options.action.onClick
          }
        : undefined,
      duration: options?.duration || 5000
    })
  }

  const success = (message: string, description?: string) => {
    return sonnerToast.success(message, { description })
  }

  const error = (message: string, description?: string) => {
    return sonnerToast.error(message, { description })
  }

  const warning = (message: string, description?: string) => {
    return sonnerToast.warning(message, { description })
  }

  const info = (message: string, description?: string) => {
    return sonnerToast.info(message, { description })
  }

  return {
    toast,
    success,
    error,
    warning,
    info
  }
}
