import { useState, useEffect, useMemo } from 'react'
import { useRoutes } from '@hooks/useRoutes'
import { ROLES } from '@utils/constants'

/**
 * Hook para validación de ruta y horario
 * Integrado con API-040 (GET /api/v1/routes/config)
 *
 * NOTA CRÍTICA: Este hook requiere el campo horaLimiteRecepcion en rutas_config
 * que actualmente NO EXISTE en la base de datos. Se necesita agregar este campo.
 *
 * @param {Object} cliente - Cliente seleccionado
 * @param {Function} isRole - Función para verificar rol
 * @returns {Object} Estado de validación de ruta
 */
export const useRutaValidation = ({ cliente, isRole } = {}) => {
  const { rutasConfig } = useRoutes()

  const getRutaByNumero = (numero) => {
    return rutasConfig.find(r => r.numero === numero)
  }

  // Estado para mensaje de WhatsApp
  const [whatsappMensajeRutaSalida, setWhatsappMensajeRutaSalida] = useState(
    'Hola, mi ruta ya salió y necesito hacer un pedido'
  )

  // Cargar configuración de WhatsApp
  useEffect(() => {
    const loadConfig = () => {
      const storedConfig = localStorage.getItem('whatsapp_config')
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig)
          setWhatsappMensajeRutaSalida(
            parsedConfig.whatsappMensajeRutaSalida ||
            'Hola, mi ruta ya salió y necesito hacer un pedido'
          )
        } catch (error) {
          console.error('Error al cargar configuración de WhatsApp:', error)
        }
      }
    }

    loadConfig()

    const handleUpdate = (event) => {
      setWhatsappMensajeRutaSalida(
        event.detail.whatsappMensajeRutaSalida ||
        'Hola, mi ruta ya salió y necesito hacer un pedido'
      )
    }

    window.addEventListener('whatsappConfigUpdate', handleUpdate)
    return () => window.removeEventListener('whatsappConfigUpdate', handleUpdate)
  }, [])

  // Verificar si la ruta del cliente ya salió (solo para clientes)
  const rutaYaSalio = useMemo(() => {
    if (!isRole(ROLES.CLIENTE) || !cliente) return false

    const rutaCliente = cliente.ruta || 1
    const rutaConfig = getRutaByNumero(rutaCliente)

    if (!rutaConfig || !rutaConfig.horaLimiteRecepcion) return false

    // Obtener la hora actual
    const ahora = new Date()
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`

    // La ruta ya salió si la hora actual es mayor o igual a la hora límite de recepción
    return horaActual >= rutaConfig.horaLimiteRecepcion
  }, [isRole, cliente, getRutaByNumero])

  return {
    rutaYaSalio,
    whatsappMensajeRutaSalida
  }
}
