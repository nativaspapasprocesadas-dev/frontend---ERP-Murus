import React from 'react'
import { Button, Badge } from '@components/common'
import { PedidoEditService } from '@services/PedidoEditService'
import { ROLES, ESTADOS_PAGO } from '@utils/constants'

const ActionsCell = ({
  pedido,
  isRole,
  onVerDetalle,
  onImprimir,
  onEditar,
  onCancelar,
  onAlertaModificacion,
  onVerVoucher
}) => {
  const canEdit = PedidoEditService.canEdit(pedido).canEdit
  const canCancel = PedidoEditService.canCancel(pedido).canCancel
  const isAdmin = isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.SUPERADMINISTRADOR)
  const isCliente = isRole(ROLES.CLIENTE)

  // Verificar si tiene voucher pendiente de aprobacion
  const tieneVoucherPendiente = pedido.voucherUrl && pedido.estadoPago === ESTADOS_PAGO.PENDIENTE
  const tieneVoucherAprobado = pedido.voucherUrl && pedido.estadoPago === ESTADOS_PAGO.APROBADO
  const tieneVoucherRechazado = pedido.voucherUrl && pedido.estadoPago === ESTADOS_PAGO.RECHAZADO

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => onVerDetalle(pedido.id)}
      >
        Ver Detalle
      </Button>
      <Button
        size="sm"
        variant="info"
        onClick={() => onImprimir(pedido)}
        title="Imprimir Ticket"
      >
        🖨️
      </Button>

      {/* Boton Ver Voucher - Solo para admin cuando hay voucher */}
      {isAdmin && pedido.voucherUrl && (
        <Button
          size="sm"
          variant={tieneVoucherPendiente ? 'warning' : tieneVoucherAprobado ? 'success' : 'danger'}
          onClick={() => onVerVoucher(pedido.id)}
          title={tieneVoucherPendiente ? 'Voucher pendiente de aprobacion' : 'Ver voucher'}
        >
          {tieneVoucherPendiente ? '📋 Aprobar Voucher' : '📋 Ver Voucher'}
        </Button>
      )}

      {/* Indicador de estado de pago para clientes */}
      {isCliente && pedido.voucherUrl && (
        <Badge
          variant={tieneVoucherPendiente ? 'warning' : tieneVoucherAprobado ? 'success' : 'danger'}
        >
          {tieneVoucherPendiente ? 'Pago en revision' : tieneVoucherAprobado ? 'Pago aprobado' : 'Pago rechazado'}
        </Badge>
      )}

      {isCliente && (
        <Button
          size="sm"
          variant="warning"
          onClick={() => onAlertaModificacion(pedido.id)}
          title="Informacion sobre modificaciones"
        >
          ⚠️
        </Button>
      )}
      {isAdmin && canEdit && (
        <Button
          size="sm"
          variant="warning"
          onClick={() => onEditar(pedido.id)}
          title="Editar Pedido"
        >
          ✏️ Editar
        </Button>
      )}
      {isAdmin && canCancel && (
        <Button
          size="sm"
          variant="danger"
          onClick={() => onCancelar(pedido.id)}
          title="Cancelar Pedido"
        >
          🗑️ Cancelar
        </Button>
      )}
    </div>
  )
}

export default ActionsCell
