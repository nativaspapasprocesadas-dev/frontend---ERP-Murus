import { useState, useCallback, useMemo } from 'react'

/**
 * Hook personalizado para manejar notificaciones Toast
 *
 * Uso:
 * const toast = useToast()
 * toast.success('Operación exitosa')
 * toast.error('Algo salió mal')
 * toast.warning('Advertencia')
 * toast.info('Información')
 *
 * @returns {Object} { success, error, warning, info, toast, showToast, hideToast }
 */
export const useToast = () => {
  const [toastState, setToastState] = useState(null)

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToastState({ message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToastState(null)
  }, [])

  // API con métodos success, error, warning, info
  // Los errores tienen mayor duración (8s) para mensajes largos de validación
  const toastApi = useMemo(() => ({
    success: (message, duration = 3000) => showToast(message, 'success', duration),
    error: (message, duration = 8000) => showToast(message, 'error', duration),
    warning: (message, duration = 5000) => showToast(message, 'warning', duration),
    info: (message, duration = 3000) => showToast(message, 'info', duration),
    // Mantener compatibilidad con el uso anterior
    toast: toastState,
    showToast,
    hideToast
  }), [showToast, hideToast, toastState])

  return toastApi
}

