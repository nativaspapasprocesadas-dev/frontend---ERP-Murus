/**
 * ConfiguracionWhatsApp Component
 * Configuración de WhatsApp integrada con API real
 * Reemplaza localStorage por API /api/v1/configurations
 */
import { useState, useEffect } from 'react'
import { Card, Button } from '@components/common'
import { useWhatsAppConfiguration } from '@hooks/useConfiguration'

const ConfiguracionWhatsApp = () => {
  const { config, loading, saving, saveConfig } = useWhatsAppConfiguration()

  const [formData, setFormData] = useState({
    whatsappNumero: '',
    whatsappMensajeHeader: '',
    whatsappMensajeModificaciones: '',
    whatsappMensajeRutaSalida: ''
  })

  // Formatear número: agregar espacios cada 3 dígitos
  const formatWhatsAppNumber = (value) => {
    // Eliminar todo excepto números
    let digits = value.replace(/\D/g, '')

    // Forzar que empiece con 9
    if (digits.length > 0 && digits[0] !== '9') {
      digits = '9' + digits.slice(1)
    }

    // Limitar a 9 dígitos
    digits = digits.slice(0, 9)

    // Agregar espacios cada 3 dígitos
    let formatted = ''
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 3 === 0) {
        formatted += ' '
      }
      formatted += digits[i]
    }

    return formatted
  }

  // Extraer número formateado del valor almacenado (puede venir con +51)
  const extractNumber = (value) => {
    if (!value) return ''
    // Si viene con +51, quitarlo
    const cleaned = value.replace('+51', '').replace(/\D/g, '')
    return formatWhatsAppNumber(cleaned)
  }

  // Sincronizar formData cuando config cambia
  useEffect(() => {
    if (config) {
      setFormData({
        whatsappNumero: extractNumber(config.whatsappNumero),
        whatsappMensajeHeader: config.whatsappMensajeHeader || '',
        whatsappMensajeModificaciones: config.whatsappMensajeModificaciones || '',
        whatsappMensajeRutaSalida: config.whatsappMensajeRutaSalida || ''
      })
    }
  }, [config])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleWhatsAppChange = (e) => {
    const formatted = formatWhatsAppNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      whatsappNumero: formatted
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar que tenga 9 dígitos
    const digits = formData.whatsappNumero.replace(/\D/g, '')
    if (digits.length !== 9) {
      alert('El número de WhatsApp debe tener 9 dígitos')
      return
    }

    // Guardar con el prefijo +51
    const dataToSave = {
      whatsappNumero: '+51' + digits,
      whatsappMensajeHeader: formData.whatsappMensajeHeader,
      whatsappMensajeModificaciones: formData.whatsappMensajeModificaciones,
      whatsappMensajeRutaSalida: formData.whatsappMensajeRutaSalida
    }

    await saveConfig(dataToSave)
  }

  if (loading) {
    return (
      <Card title="Configuración de WhatsApp">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Cargando configuración...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card title="Configuración de WhatsApp">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de WhatsApp
            </label>
            <div className="flex items-center max-w-xs">
              <span className="inline-flex items-center px-3 py-2 text-gray-600 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg font-medium">
                +51
              </span>
              <input
                type="text"
                name="whatsappNumero"
                value={formData.whatsappNumero}
                onChange={handleWhatsAppChange}
                placeholder="987 654 321"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Ingresa los 9 dígitos del número. Debe empezar con 9.
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Mensajes Predefinidos</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje del Botón Header (Navbar)
                </label>
                <textarea
                  name="whatsappMensajeHeader"
                  value={formData.whatsappMensajeHeader}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mensaje que se enviará al hacer clic en el botón de WhatsApp del navbar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje para Modificaciones de Pedido
                </label>
                <textarea
                  name="whatsappMensajeModificaciones"
                  value={formData.whatsappMensajeModificaciones}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mensaje del modal "Cualquier modificación, comunicarse con administración"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje cuando Ruta ya Salió
                </label>
                <textarea
                  name="whatsappMensajeRutaSalida"
                  value={formData.whatsappMensajeRutaSalida}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mensaje cuando el cliente intenta hacer pedido y su ruta ya salió
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar Configuración de WhatsApp'}
        </Button>
      </form>
    </Card>
  )
}

export default ConfiguracionWhatsApp
