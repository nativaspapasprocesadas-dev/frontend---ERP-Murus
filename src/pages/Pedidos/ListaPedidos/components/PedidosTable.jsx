import React from 'react'
import { Card, Table, Badge } from '@components/common'
import { formatearMoneda, formatearKilos, formatearFecha } from '@utils/formatters'
import {
  TIPOS_PAGO_LABELS,
  TIPOS_PEDIDO_LABELS,
  TIPOS_PEDIDO_COLORS,
  ESTADOS_PEDIDO_LABELS,
  ESTADOS_PEDIDO_COLORS
} from '@utils/constants'
import { PedidoAdicionalService } from '@services/PedidoAdicionalService'
import ActionsCell from './ActionsCell'

const PedidosTable = ({
  pedidos,
  loading,
  isSuperAdmin,
  getSedeById,
  isRole,
  onVerDetalle,
  onImprimir,
  onEditar,
  onCancelar,
  onAlertaModificacion,
  onVerVoucher,
  pagination,
  onNextPage,
  onPrevPage,
  onGoToPage
}) => {
  const columns = [
    {
      title: 'ID',
      key: 'id',
      render: (value) => <span className="font-mono text-gray-600">#{value}</span>
    },
    {
      title: 'Tipo',
      key: 'tipoPedido',
      render: (value, row) => {
        const esAdicional = PedidoAdicionalService.isPedidoAdicional(row)
        return (
          <Badge variant={esAdicional ? TIPOS_PEDIDO_COLORS.adicional : TIPOS_PEDIDO_COLORS.normal}>
            {esAdicional ? TIPOS_PEDIDO_LABELS.adicional : TIPOS_PEDIDO_LABELS.normal}
          </Badge>
        )
      }
    },
    {
      title: 'Cliente',
      key: 'nombreCliente',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      title: 'Fecha',
      key: 'fecha',
      render: (value) => formatearFecha(value, 'dd/MM/yyyy HH:mm')
    },
    ...(isSuperAdmin ? [{
      title: 'Sede',
      key: 'sedeId',
      render: (value) => {
        const sede = value ? getSedeById(value) : null
        if (!sede) return <span className="text-gray-400">-</span>
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: sede.color || '#6366f1' }}
          >
            {sede.nombre}
          </span>
        )
      }
    }] : []),
    {
      title: 'Productos',
      key: 'cantidadProductos',
      render: (value, row) => (
        <div className="flex flex-col">
          <span>{value} item(s)</span>
          {row.tieneAdiciones && (
            <Badge variant="warning" className="text-xs mt-1">+ Adiciones</Badge>
          )}
        </div>
      )
    },
    {
      title: 'Total',
      key: 'totalMonto',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-bold text-primary-600">{formatearMoneda(value)}</span>
          <span className="text-sm text-gray-500">{formatearKilos(row.totalKilos)}</span>
        </div>
      )
    },
    {
      title: 'Tipo Pago',
      key: 'tipoPago',
      render: (value) => {
        const tipoNormalizado = value?.toUpperCase() || 'CONTADO'
        return (
          <Badge variant={tipoNormalizado === 'CONTADO' ? 'success' : 'warning'}>
            {TIPOS_PAGO_LABELS[tipoNormalizado] || tipoNormalizado}
          </Badge>
        )
      }
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (value) => {
        const estadoLabel = ESTADOS_PEDIDO_LABELS[value] || value || 'Sin estado'
        const estadoColor = ESTADOS_PEDIDO_COLORS[value] || 'default'
        return (
          <Badge variant={estadoColor}>
            {estadoLabel}
          </Badge>
        )
      }
    },
    {
      title: 'Acciones',
      key: 'acciones',
      render: (_, row) => (
        <ActionsCell
          pedido={row}
          isRole={isRole}
          onVerDetalle={onVerDetalle}
          onImprimir={onImprimir}
          onEditar={onEditar}
          onCancelar={onCancelar}
          onAlertaModificacion={onAlertaModificacion}
          onVerVoucher={onVerVoucher}
        />
      )
    }
  ]

  // Generar array de páginas para mostrar
  const getPageNumbers = () => {
    if (!pagination || pagination.totalPages <= 1) return []

    const pages = []
    const { page, totalPages } = pagination
    const maxPagesToShow = 5

    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    return pages
  }

  return (
    <Card>
      <Table
        columns={columns}
        data={pedidos}
        loading={loading}
        emptyMessage="No hay pedidos registrados"
      />

      {/* Controles de Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
          {/* Info de paginación */}
          <div className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {((pagination.page - 1) * pagination.pageSize) + 1}
            </span>
            {' '}-{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.pageSize, pagination.total)}
            </span>
            {' '}de{' '}
            <span className="font-medium">{pagination.total}</span>
            {' '}pedidos
          </div>

          {/* Botones de navegación */}
          <div className="flex items-center gap-1">
            {/* Botón Primera Página */}
            <button
              onClick={() => onGoToPage(1)}
              disabled={pagination.page === 1}
              className={`px-2 py-1 text-sm rounded border ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
              title="Primera página"
            >
              «
            </button>

            {/* Botón Anterior */}
            <button
              onClick={onPrevPage}
              disabled={pagination.page === 1}
              className={`px-3 py-1 text-sm rounded border ${
                pagination.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Anterior
            </button>

            {/* Números de página */}
            <div className="hidden sm:flex items-center gap-1">
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => onGoToPage(pageNum)}
                  className={`px-3 py-1 text-sm rounded border ${
                    pageNum === pagination.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Indicador de página en móvil */}
            <span className="sm:hidden px-2 text-sm text-gray-600">
              {pagination.page} / {pagination.totalPages}
            </span>

            {/* Botón Siguiente */}
            <button
              onClick={onNextPage}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1 text-sm rounded border ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Siguiente
            </button>

            {/* Botón Última Página */}
            <button
              onClick={() => onGoToPage(pagination.totalPages)}
              disabled={pagination.page === pagination.totalPages}
              className={`px-2 py-1 text-sm rounded border ${
                pagination.page === pagination.totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
              title="Última página"
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Info cuando hay una sola página */}
      {pagination && pagination.total > 0 && pagination.totalPages === 1 && (
        <div className="px-4 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Mostrando {pagination.total} pedido{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  )
}

export default PedidosTable
