import { useState, useEffect, useMemo } from 'react'
import { CustomersService } from '@services/CustomersService'
import { useClienteActual } from '@hooks/useClienteActual'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

/**
 * Hook para gestión del formulario de cliente (existente o nuevo)
 *
 * INTEGRACIÓN:
 * - API-016: GET /api/v1/customers (listar clientes)
 * - API-018: POST /api/v1/customers (crear cliente)
 * Backend: customersController.js, customersModel.js
 *
 * @param {Object} user - Usuario autenticado
 * @param {Function} isRole - Función para verificar rol
 * @returns {Object} Estado y acciones del formulario de cliente
 */
export const useClienteForm = ({ user, isRole } = {}) => {
  const [clientesExpandidos, setClientesExpandidos] = useState([])
  const [loading, setLoading] = useState(false)
  const clienteActual = useClienteActual()
  const { getSedeIdParaFiltro, sedeIdActiva } = useAuthStore()

  // Cargar clientes desde API si es superadmin/admin/coordinador
  // Filtrar por sede activa (para SUPERADMIN usa sedeIdActiva, para otros usa su sedeId)
  useEffect(() => {
    if (isRole(ROLES.SUPERADMINISTRADOR) || isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR)) {
      const loadClientes = async () => {
        setLoading(true)
        try {
          // Usar getSedeIdParaFiltro para obtener la sede correcta según el rol
          // - SUPERADMIN con sedeIdActiva: filtra por esa sede
          // - SUPERADMIN sin sedeIdActiva: ve todos
          // - Admin/Coordinador: su sedeId asignado
          const sedeId = getSedeIdParaFiltro()
          const params = { pageSize: 500 }
          if (sedeId) {
            params.branchId = sedeId
          }

          const response = await CustomersService.listCustomers(params)
          if (response.success) {
            // Mapear a formato frontend
            const clientesMapeados = response.data.map(c => CustomersService.mapAPIToFrontend(c))
            setClientesExpandidos(clientesMapeados)
          }
        } catch (error) {
          console.error('Error cargando clientes:', error)
        } finally {
          setLoading(false)
        }
      }
      loadClientes()
    }
  }, [isRole, getSedeIdParaFiltro, sedeIdActiva])

  // Función para crear cliente usando API real
  const createCliente = async (clienteData) => {
    try {
      const apiData = CustomersService.mapFormDataToAPI(clienteData)
      const response = await CustomersService.createCustomer(apiData)

      if (response.success) {
        // Agregar el nuevo cliente a la lista local
        const nuevoCliente = CustomersService.mapAPIToFrontend(response.data)
        setClientesExpandidos(prev => [...prev, nuevoCliente])
      }

      return response
    } catch (error) {
      console.error('Error creando cliente:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Estado para cliente seleccionado (solo para administradores)
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState('')

  // Estados para cliente nuevo
  const [esClienteNuevo, setEsClienteNuevo] = useState(false)
  const [clienteNuevo, setClienteNuevo] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    distrito: ''
  })

  // Actualizar un campo del cliente nuevo
  const updateClienteNuevo = (campo, valor) => {
    setClienteNuevo(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  // Resetear formulario de cliente nuevo
  const resetClienteNuevo = () => {
    setClienteNuevo({
      nombre: '',
      telefono: '',
      direccion: '',
      distrito: ''
    })
  }

  // Toggle entre cliente existente y nuevo
  const toggleEsClienteNuevo = (esNuevo) => {
    setEsClienteNuevo(esNuevo)
    if (esNuevo) {
      setClienteSeleccionadoId('')
    } else {
      resetClienteNuevo()
    }
  }

  // Validar si cliente nuevo tiene todos los campos
  const clienteNuevoValido = useMemo(() => {
    return clienteNuevo.nombre &&
           clienteNuevo.telefono &&
           clienteNuevo.direccion &&
           clienteNuevo.distrito
  }, [clienteNuevo])

  // Obtener cliente según el rol y selección
  const cliente = useMemo(() => {
    // Si es CLIENTE, usar su propio cliente obtenido del hook
    if (isRole(ROLES.CLIENTE)) {
      return clienteActual
    }

    // Si es cliente nuevo, crear objeto temporal con los datos del formulario
    if (esClienteNuevo && clienteNuevoValido) {
      return {
        id: null,
        nombre: clienteNuevo.nombre,
        telefono: clienteNuevo.telefono,
        direccion: clienteNuevo.direccion,
        distrito: clienteNuevo.distrito,
        esNuevo: true
      }
    }

    // Si es SUPERADMINISTRADOR, ADMINISTRADOR o COORDINADOR, usar el cliente seleccionado
    if ((isRole(ROLES.SUPERADMINISTRADOR) || isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR)) && clienteSeleccionadoId) {
      return clientesExpandidos.find(c => c.id === parseInt(clienteSeleccionadoId))
    }

    return null
  }, [
    isRole,
    clienteActual,
    clienteSeleccionadoId,
    clientesExpandidos,
    esClienteNuevo,
    clienteNuevo,
    clienteNuevoValido
  ])

  // Opciones de clientes para el select
  const clientesOptions = useMemo(() => {
    return clientesExpandidos.map(c => ({
      value: c.id,
      label: `${c.nombre} - ${c.rutaLabel || `Ruta ${c.ruta}`}`
    }))
  }, [clientesExpandidos])

  return {
    // Estado
    cliente,
    clienteSeleccionadoId,
    esClienteNuevo,
    clienteNuevo,
    clienteNuevoValido,
    clientesOptions,
    clientesExpandidos,

    // Acciones
    setClienteSeleccionadoId,
    setEsClienteNuevo: toggleEsClienteNuevo,
    updateClienteNuevo,
    resetClienteNuevo,
    createCliente
  }
}
