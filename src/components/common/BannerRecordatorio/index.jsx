import { useState, useEffect } from 'react'
import WhatsAppButton from '../WhatsAppButton'

const BannerRecordatorio = ({ titulo, mensaje, variant = 'warning', showWhatsApp = false }) => {
  const [whatsappMensaje, setWhatsappMensaje] = useState('Hola, necesito ayuda con el horario de pedidos')

  useEffect(() => {
    if (showWhatsApp) {
      const loadConfig = () => {
        const storedConfig = localStorage.getItem('whatsapp_config')
        if (storedConfig) {
          try {
            const parsedConfig = JSON.parse(storedConfig)
            setWhatsappMensaje(parsedConfig.whatsappMensajeHeader || 'Hola, necesito ayuda con el horario de pedidos')
          } catch (error) {
            console.error('Error al cargar configuración de WhatsApp:', error)
          }
        }
      }

      loadConfig()

      const handleUpdate = (event) => {
        setWhatsappMensaje(event.detail.whatsappMensajeHeader || 'Hola, necesito ayuda con el horario de pedidos')
      }

      window.addEventListener('whatsappConfigUpdate', handleUpdate)
      return () => window.removeEventListener('whatsappConfigUpdate', handleUpdate)
    }
  }, [showWhatsApp])

  const variantStyles = {
    warning: 'bg-gradient-to-r from-amber-50 to-orange-50 border-l-8 border-amber-500 shadow-lg hover:shadow-xl transition-shadow',
    danger: 'bg-gradient-to-r from-red-100 to-red-200 border-l-8 border-red-600 shadow-lg hover:shadow-xl transition-shadow',
    info: 'bg-gradient-to-r from-cyan-50 to-blue-50 border-l-8 border-cyan-500 shadow-lg hover:shadow-xl transition-shadow',
    success: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-8 border-emerald-500 shadow-lg hover:shadow-xl transition-shadow'
  }

  const iconStyles = {
    warning: 'text-amber-600',
    danger: 'text-red-700',
    info: 'text-cyan-600',
    success: 'text-emerald-600'
  }

  const textStyles = {
    warning: 'text-amber-900',
    danger: 'text-red-900',
    info: 'text-cyan-900',
    success: 'text-emerald-900'
  }

  const icons = {
    warning: '⏰',
    danger: '🔔',
    info: '🔔',
    success: '✅'
  }

  return (
    <div className={`p-4 sm:p-6 rounded-xl ${variantStyles[variant]}`}>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex items-start flex-1 w-full">
          <div className="flex-shrink-0">
            <span className={`text-3xl sm:text-4xl ${iconStyles[variant]}`}>
              {icons[variant]}
            </span>
          </div>
          <div className="ml-4 sm:ml-6 flex-1 min-w-0">
            <h3 className={`text-base sm:text-lg font-bold ${textStyles[variant]} mb-1 sm:mb-2`}>
              {titulo}
            </h3>
            <p className={`text-sm sm:text-base ${textStyles[variant]} leading-relaxed`}>
              {mensaje}
            </p>
          </div>
        </div>
        {showWhatsApp && (
          <div className="flex-shrink-0 w-full sm:w-auto">
            <WhatsAppButton mensaje={whatsappMensaje} variant="inline" className="w-full sm:w-auto" />
          </div>
        )}
      </div>
    </div>
  )
}

export default BannerRecordatorio
