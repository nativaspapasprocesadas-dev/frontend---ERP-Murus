import { useState, useEffect, useRef } from 'react'
import useAuthStore from '@features/auth/useAuthStore'
import { CustomersService } from '@services/CustomersService'
import { ROLES } from '@utils/constants'

/**
 * Hook para obtener el cliente asociado al usuario actualmente logueado
 *
 * INTEGRADO CON API REAL: GET /api/v1/customers/me
 *
 * Responsabilidad única: Proporcionar la información del cliente actual
 * Reutilizable: Se usa en todos los componentes que necesitan el cliente del usuario logueado
 *
 * @returns {Object|null} Cliente expandido con toda su información o null si no es un cliente
 *
 * @example
 * const cliente = useClienteActual()
 * if (cliente) {
 *   console.log(cliente.nombre, cliente.totalDeuda, cliente.diasCredito)
 * }
 */
export const useClienteActual = () => {
  const { user } = useAuthStore()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(false)
  // Ref para evitar llamadas duplicadas
  const loadedForUserId = useRef(null)

  // Verificar rol directamente desde el usuario para evitar re-renders
  // El campo es user.rol (no roleName) y ya viene normalizado a minúsculas
  const esCliente = user?.rol === ROLES.CLIENTE

  useEffect(() => {
    const cargarCliente = async () => {
      // Solo cargar si el usuario tiene rol CLIENTE
      if (!user || !esCliente) {
        setCliente(null)
        loadedForUserId.current = null
        return
      }

      // Evitar llamadas duplicadas para el mismo usuario
      if (loadedForUserId.current === user.id) {
        return
      }

      loadedForUserId.current = user.id
      setLoading(true)

      try {
        const response = await CustomersService.getMyCustomer()

        if (response.success && response.data) {
          // Mapear datos de API a formato frontend
          const clienteData = response.data
          setCliente({
            id: clienteData.id,
            usuarioId: clienteData.userId,
            nombre: clienteData.name,
            email: clienteData.email,
            telefono: clienteData.phone,
            direccion: clienteData.address,
            ruta: clienteData.routeId,
            rutaLabel: clienteData.routeName,
            diasCredito: clienteData.creditDays || 0,
            saldoActual: clienteData.currentBalance || 0,
            totalDeuda: clienteData.currentBalance || 0,
            nombreContacto: clienteData.contactName,
            cargoContacto: clienteData.contactPosition,
            telefonoContacto: clienteData.contactPhone,
            tipoCliente: clienteData.customerType,
            esRecurrente: clienteData.isRecurring,
            branchId: clienteData.branchId
          })
        } else {
          console.error('Error cargando cliente actual:', response.error)
          setCliente(null)
        }
      } catch (error) {
        console.error('Error en useClienteActual:', error)
        setCliente(null)
      } finally {
        setLoading(false)
      }
    }

    cargarCliente()
  }, [user?.id, esCliente])

  return cliente
}

