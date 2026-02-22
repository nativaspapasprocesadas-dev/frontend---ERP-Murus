import React from 'react'
import { Button, SedeIndicator } from '@components/common'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

const PedidosHeader = ({ isRole, onNuevoPedido, onPedidoAdicional, showToast }) => {
  const { sedeIdActiva } = useAuthStore()
  const isSuperAdmin = isRole(ROLES.SUPERADMINISTRADOR)

  const puedeCrearPedido = isRole(ROLES.CLIENTE) || isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR) || isSuperAdmin
  const puedeCrearAdicional = isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR) || isSuperAdmin

  // Handler para validar sede antes de crear pedido (solo Superadmin)
  const handleNuevoPedido = () => {
    if (isSuperAdmin && !sedeIdActiva) {
      showToast?.('Debe seleccionar una sede antes de crear un pedido', 'warning')
      return
    }
    onNuevoPedido()
  }

  // Handler para validar sede antes de crear pedido adicional (solo Superadmin)
  const handlePedidoAdicional = () => {
    if (isSuperAdmin && !sedeIdActiva) {
      showToast?.('Debe seleccionar una sede antes de crear un pedido adicional', 'warning')
      return
    }
    onPedidoAdicional()
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
          <SedeIndicator size="sm" />
        </div>
        <p className="text-gray-600 mt-1">Gestiona los pedidos del sistema</p>
      </div>
      <div className="flex gap-3">
        {puedeCrearPedido && (
          <Button onClick={handleNuevoPedido}>
            + Nuevo Pedido
          </Button>
        )}
        {puedeCrearAdicional && (
          <Button onClick={handlePedidoAdicional} variant="warning">
            📦 Pedido Adicional
          </Button>
        )}
      </div>
    </div>
  )
}

export default PedidosHeader
