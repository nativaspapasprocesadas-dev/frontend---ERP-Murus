import { useState, useEffect } from 'react'

/**
 * Hook para gestión de configuración de WhatsApp
 */
export const useWhatsAppConfig = () => {
  const [whatsappMensajeModificaciones, setWhatsappMensajeModificaciones] = useState(
    'Hola, necesito modificar un pedido'
  )

  useEffect(() => {
    const loadConfig = () => {
      const storedConfig = localStorage.getItem('whatsapp_config')
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig)
          setWhatsappMensajeModificaciones(
            parsedConfig.whatsappMensajeModificaciones || 'Hola, necesito modificar un pedido'
          )
        } catch (error) {
          console.error('Error al cargar configuración de WhatsApp:', error)
        }
      }
    }

    loadConfig()

    const handleUpdate = (event) => {
      setWhatsappMensajeModificaciones(
        event.detail.whatsappMensajeModificaciones || 'Hola, necesito modificar un pedido'
      )
    }

    window.addEventListener('whatsappConfigUpdate', handleUpdate)
    return () => window.removeEventListener('whatsappConfigUpdate', handleUpdate)
  }, [])

  return { whatsappMensajeModificaciones }
}
