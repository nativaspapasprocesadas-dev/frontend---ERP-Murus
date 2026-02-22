import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Table, Badge, Modal, Toast, SedeIndicator } from '@components/common'
import { FormularioNuevoCliente } from '@components/Clientes'
import { useCustomers } from '@hooks/useCustomers'
import { useRoutes } from '@hooks/useRoutes'
import useAuthStore from '@features/auth/useAuthStore'
import { CustomersService } from '@services/CustomersService'
import { formatearMoneda, formatearPorcentaje, formatearTelefono } from '@utils/formatters'
import {
  PERMISOS,
  CONFIG_CLIENTES,
  TIPO_CLIENTE,
  TIPO_CLIENTE_COLORS,
  TIPO_CLIENTE_EMOJIS,
  TIPO_CLIENTE_LABELS
} from '@utils/constants'

const Clientes = () => {
  const navigate = useNavigate()
  const { user, sedeIdActiva, canViewAllSedes } = useAuthStore()
  const { clientesExpandidos, loading, fetchCustomers, changeCustomerType } = useCustomers()
  const { nombresPorNumero } = useRoutes()
  const [selectedCliente, setSelectedCliente] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [showEditarClienteModal, setShowEditarClienteModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [clienteAEliminar, setClienteAEliminar] = useState(null)
  const [deletingCliente, setDeletingCliente] = useState(false)

  // Estado para notificaciones Toast
  const [toast, setToast] = useState(null)

  // Helper para recargar clientes con filtro de sede consistente
  const recargarClientes = () => {
    const branchId = canViewAllSedes() ? null : sedeIdActiva
    fetchCustomers({ branchId })
  }

  // Cargar clientes al montar el componente, filtrando por sede activa
  // Consistente con la lógica de la página de Créditos (ELM-079)
  useEffect(() => {
    recargarClientes()
  }, [sedeIdActiva, canViewAllSedes])

  // Usar configuración dinámica de rutas
  const RUTAS_LABELS = nombresPorNumero

  // Mostrar notificación Toast
  const mostrarToast = (type, message) => {
    setToast({ type, message })
  }

  // Cerrar notificación Toast
  const cerrarToast = () => {
    setToast(null)
  }

  const handleViewDetail = (cliente) => {
    setSelectedCliente(cliente)
    setShowDetailModal(true)
  }

  // Abrir modal de edición desde el modal de detalle
  const handleEditCliente = () => {
    setShowDetailModal(false)
    setShowEditarClienteModal(true)
  }

  // Helper: Determina el tipo de cliente (Single Responsibility Principle)
  const esClienteRecurrente = (diasCredito) => diasCredito > 0

  // Helper: Calcula los nuevos días de crédito al hacer toggle (Open/Closed Principle)
  const calcularNuevosDiasCredito = (diasCreditoActual) => {
    return esClienteRecurrente(diasCreditoActual)
      ? CONFIG_CLIENTES.DIAS_CREDITO_NO_RECURRENTE
      : CONFIG_CLIENTES.DIAS_CREDITO_DEFAULT
  }

  // ELM-059: Toggle inmediato - Cambio directo sin confirmación ni validaciones
  // Usa API-020: PATCH /api/v1/customers/:id/type
  const handleToggleRecurrente = async (cliente) => {
    const isCurrentlyRecurring = esClienteRecurrente(cliente.diasCredito)
    const newCustomerType = isCurrentlyRecurring ? 'NO_RECURRENTE' : 'RECURRENTE'
    const estadoNuevo = isCurrentlyRecurring ? 'No Recurrente' : 'Recurrente'

    try {
      const result = await changeCustomerType(cliente.id, newCustomerType)

      if (result.success) {
        mostrarToast('success', `Cliente cambiado a "${estadoNuevo}" exitosamente`)
        // Recargar lista para reflejar cambios
        recargarClientes()
      } else {
        mostrarToast('error', result.error || `Error al cambiar el estado del cliente`)
      }
    } catch (error) {
      mostrarToast('error', `Error inesperado al cambiar el estado`)
    }
  }

  // Mostrar modal de confirmación para eliminar cliente
  const handleDeleteCliente = (cliente) => {
    setClienteAEliminar(cliente)
    setShowDeleteModal(true)
  }

  // Confirmar y ejecutar eliminación del cliente
  const confirmDeleteCliente = async () => {
    if (!clienteAEliminar) return

    setDeletingCliente(true)
    try {
      const result = await CustomersService.deleteCustomer(clienteAEliminar.id)

      if (result.success) {
        mostrarToast('success', `Cliente "${clienteAEliminar.nombre}" eliminado correctamente`)
        setShowDeleteModal(false)
        setClienteAEliminar(null)
        recargarClientes()
      } else {
        mostrarToast('error', result.error || 'Error al eliminar cliente')
      }
    } catch (error) {
      mostrarToast('error', 'Error inesperado al eliminar cliente')
    } finally {
      setDeletingCliente(false)
    }
  }

  // Cancelar eliminación
  const cancelDeleteCliente = () => {
    setShowDeleteModal(false)
    setClienteAEliminar(null)
  }

  // Verificar si puede eliminar clientes (solo SUPERADMINISTRADOR y ADMINISTRADOR)
  const puedeEliminarClientes = ['superadministrador', 'administrador'].includes(user?.rol)

  const columns = [
    {
      title: 'Cliente',
      key: 'nombre',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      title: 'Ruta',
      key: 'ruta',
      render: (value) => <Badge variant="info">{RUTAS_LABELS[value]}</Badge>
    },
    {
      title: 'Tipo',
      key: 'tipoCliente',
      render: (value, row) => {
        const isRecurrente = esClienteRecurrente(row.diasCredito)
        const tipoKey = isRecurrente ? TIPO_CLIENTE.RECURRENTE : TIPO_CLIENTE.NO_RECURRENTE
        return (
          <Badge variant={TIPO_CLIENTE_COLORS[tipoKey]}>
            {TIPO_CLIENTE_EMOJIS[tipoKey]} {TIPO_CLIENTE_LABELS[tipoKey]?.replace('Cliente ', '') || tipoKey}
          </Badge>
        )
      }
    },
    {
      title: 'Teléfono',
      key: 'telefono',
      render: (value) => formatearTelefono(value)
    },
    {
      title: 'Días Crédito',
      key: 'diasCredito',
      render: (value) => (
        <Badge variant="info">
          {value} días
        </Badge>
      )
    },
    {
      title: 'Deuda Actual',
      key: 'totalDeuda',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className={`font-semibold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatearMoneda(value)}
          </span>
          {/* Alerta si supera monto global (S/ 20,000) */}
          {value >= 20000 && (
            <Badge variant="warning" className="mt-1 text-xs">Monto Alto</Badge>
          )}
        </div>
      )
    },
    {
      title: 'Estado',
      key: 'tieneDeudaVencida',
      render: (value, row) => {
        if (row.tieneDeudaVencida) {
          return <Badge variant="danger">Mora</Badge>
        }
        // Alerta si supera monto global de alerta (S/ 20,000)
        if (row.totalDeuda >= 20000) {
          return <Badge variant="warning">Deuda Alta</Badge>
        }
        return <Badge variant="success">Al día</Badge>
      }
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (_, row) => {
        const isRecurrente = esClienteRecurrente(row.diasCredito)
        const tipoKey = isRecurrente ? TIPO_CLIENTE.RECURRENTE : TIPO_CLIENTE.NO_RECURRENTE

        return (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleViewDetail(row)}>
              Ver Detalle
            </Button>
            <button
              onClick={() => handleToggleRecurrente(row)}
              className={`
                px-4 py-2 rounded-lg font-semibold text-sm
                transition-all duration-200 ease-in-out
                transform hover:scale-105 active:scale-95
                shadow-md hover:shadow-lg
                ${isRecurrente
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
                }
              `}
              aria-label={`Cambiar estado de ${row.nombre}`}
              title={`Click para cambiar a ${isRecurrente ? 'No Recurrente' : 'Recurrente'}`}
            >
              {TIPO_CLIENTE_EMOJIS[tipoKey]} {TIPO_CLIENTE_LABELS[tipoKey] || tipoKey}
            </button>
            {puedeEliminarClientes && (
              <button
                onClick={() => handleDeleteCliente(row)}
                className="px-3 py-2 rounded-lg font-semibold text-sm bg-red-100 hover:bg-red-200 text-red-700 transition-all duration-200"
                title="Eliminar cliente"
              >
                Eliminar
              </button>
            )}
          </div>
        )
      }
    }
  ]

  // Verificar si tiene permiso para crear clientes
  const puedeCrearClientes = PERMISOS[user?.rol]?.canCreateClientes || false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <SedeIndicator />
          </div>
          <p className="text-gray-600 mt-1">Gestiona tus clientes y sus créditos</p>
        </div>
        {puedeCrearClientes && (
          <Button onClick={() => setShowNuevoClienteModal(true)}>
            + Nuevo Cliente
          </Button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{clientesExpandidos.length}</p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Con Deuda Vencida</p>
              <p className="text-2xl font-bold text-red-600">
                {clientesExpandidos.filter(c => c.tieneDeudaVencida).length}
              </p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </Card>

      </div>

      <Card>
        <Table columns={columns} data={clientesExpandidos} loading={loading} />
      </Card>

      {/* Modal Detalle */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Cliente: ${selectedCliente?.nombre}`}
        size="lg"
      >
        {selectedCliente && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Teléfono del Negocio</p>
                <p className="font-medium">{formatearTelefono(selectedCliente.telefono)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{selectedCliente.direccion}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ruta</p>
                <Badge variant="info">{RUTAS_LABELS[selectedCliente.ruta]}</Badge>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="font-semibold text-lg mb-3">Persona de Contacto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">{selectedCliente.nombreContacto || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cargo</p>
                  <p className="font-medium">{selectedCliente.cargoContacto || 'No especificado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{selectedCliente.telefonoContacto ? formatearTelefono(selectedCliente.telefonoContacto) : 'No especificado'}</p>
                </div>
              </div>
            </div>

            <hr />

            <div>
              <h3 className="font-semibold text-lg mb-3">Estado de Crédito</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Días de Crédito</p>
                  <p className="font-bold text-lg text-blue-600">
                    {selectedCliente.diasCredito || 0} días
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deuda Actual</p>
                  <p className={`font-bold text-lg ${selectedCliente.totalDeuda > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatearMoneda(selectedCliente.totalDeuda)}
                  </p>
                </div>
              </div>
              {/* Alerta si supera monto global de alerta */}
              {selectedCliente.totalDeuda >= 20000 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    Este cliente supera el monto de alerta global (S/ 20,000)
                  </p>
                </div>
              )}
            </div>

            <hr />

            <div>
              <h3 className="font-semibold text-lg mb-3">Resumen de Créditos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Créditos Pendientes</p>
                  <p className="font-bold text-xl">{selectedCliente.creditosPendientesCount || 0}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Créditos Vencidos</p>
                  <p className="font-bold text-xl text-red-600">{selectedCliente.creditosVencidosCount || 0}</p>
                </div>
                <div className="text-center p-3 bg-red-100 rounded-lg">
                  <p className="text-sm text-gray-600">Monto Vencido</p>
                  <p className="font-bold text-xl text-red-700">{formatearMoneda(selectedCliente.totalVencido)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </Button>
              {puedeCrearClientes && (
                <Button variant="primary" onClick={handleEditCliente}>
                  Editar Cliente
                </Button>
              )}
              <Button onClick={() => navigate('/creditos')}>
                Ver Créditos Completos
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nuevo Cliente */}
      <Modal
        isOpen={showNuevoClienteModal}
        onClose={() => setShowNuevoClienteModal(false)}
        title="Crear Nuevo Cliente"
        size="lg"
      >
        <FormularioNuevoCliente
          onSuccess={() => {
            setShowNuevoClienteModal(false)
            recargarClientes() // Recargar lista de clientes con filtro de sede
            mostrarToast('success', 'Cliente creado exitosamente')
          }}
          onCancel={() => setShowNuevoClienteModal(false)}
          onError={(mensaje) => mostrarToast('error', mensaje)}
        />
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal
        isOpen={showEditarClienteModal}
        onClose={() => {
          setShowEditarClienteModal(false)
          setSelectedCliente(null)
        }}
        title={`Editar Cliente: ${selectedCliente?.nombre || ''}`}
        size="lg"
      >
        {selectedCliente && (
          <FormularioNuevoCliente
            cliente={selectedCliente}
            onSuccess={() => {
              setShowEditarClienteModal(false)
              setSelectedCliente(null)
              recargarClientes() // Recargar lista de clientes con filtro de sede
              mostrarToast('success', 'Cliente actualizado exitosamente')
            }}
            onCancel={() => {
              setShowEditarClienteModal(false)
              setSelectedCliente(null)
            }}
            onError={(mensaje) => mostrarToast('error', mensaje)}
          />
        )}
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={cancelDeleteCliente}
        title="Confirmar Eliminación"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">
              ¿Está seguro que desea eliminar al cliente "{clienteAEliminar?.nombre}"?
            </p>
            <p className="text-red-600 text-sm mt-2">
              Esta acción:
            </p>
            <ul className="text-red-600 text-sm mt-1 list-disc list-inside">
              <li>Desactivará la cuenta del cliente</li>
              <li>No afectará los pedidos o créditos existentes</li>
              <li>El cliente no podrá acceder al sistema</li>
              <li>No se podrán registrar nuevos pedidos a su nombre</li>
            </ul>
          </div>

          {clienteAEliminar?.totalDeuda > 0 && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">
                Advertencia: Este cliente tiene una deuda de {formatearMoneda(clienteAEliminar.totalDeuda)}
              </p>
              <p className="text-yellow-700 text-sm mt-1">
                Los créditos pendientes se mantendrán en el sistema.
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={cancelDeleteCliente} disabled={deletingCliente}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteCliente}
              disabled={deletingCliente}
            >
              {deletingCliente ? 'Eliminando...' : 'Eliminar Cliente'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast de Notificaciones */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={cerrarToast}
          duration={4000}
        />
      )}
    </div>
  )
}

export default Clientes
