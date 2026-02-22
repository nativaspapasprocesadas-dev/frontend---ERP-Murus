import { useEffect } from 'react'

/**
 * Toast - Componente de notificación temporal
 *
 * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * @param {string} message - Mensaje a mostrar
 * @param {function} onClose - Callback al cerrar
 * @param {number} duration - Duración en ms (default: 3000)
 */
const Toast = ({ type = 'info', message, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: '✓',
      iconBg: 'bg-green-500',
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: '✕',
      iconBg: 'bg-red-500',
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: '⚠',
      iconBg: 'bg-yellow-500',
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'ℹ',
      iconBg: 'bg-blue-500',
      text: 'text-blue-800'
    }
  }

  const style = typeStyles[type] || typeStyles.info

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-slide-in-right">
      <div className={`flex items-start gap-3 p-4 border rounded-lg shadow-lg max-w-md ${style.bg}`}>
        <div className={`flex-shrink-0 w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center text-white text-sm font-bold`}>
          {style.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${style.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${style.text} hover:opacity-70 transition-opacity`}
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default Toast
