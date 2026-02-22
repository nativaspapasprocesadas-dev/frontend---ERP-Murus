import { createPortal } from 'react-dom'
import { useEffect } from 'react'

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true
}) => {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-xs sm:max-w-md',
    md: 'max-w-lg sm:max-w-xl md:max-w-2xl',
    lg: 'max-w-xl sm:max-w-2xl md:max-w-3xl lg:max-w-4xl',
    xl: 'max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl',
    full: 'max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)]'
  }

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop - cubre toda la pantalla incluyendo el header */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del modal */}
      <div className="flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Modal */}
        <div
          className={`relative bg-white rounded-t-2xl sm:rounded-lg shadow-xl ${sizes[size]} w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              {title && <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4">{title}</h3>}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  aria-label="Cerrar modal"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        </div>
      </div>
    </div>
  )

  // Usar createPortal para renderizar el modal directamente en el body
  // Esto evita cualquier problema de z-index con contextos de apilamiento
  return createPortal(modalContent, document.body)
}

export default Modal
