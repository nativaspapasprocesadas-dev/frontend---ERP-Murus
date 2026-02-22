import React from 'react'
import { Card, Table, Badge, Button } from '@components/common'
import { formatearMoneda, formatearKilos } from '@utils/formatters'
import { ESTADOS_RUTA, ESTADOS_RUTA_LABELS, ESTADOS_RUTA_COLORS } from '@utils/constants'

const RutasTable = ({
  title,
  rutas,
  colores,
  labels,
  isSuperAdmin,
  getSedeById,
  getChoferById,
  onExportar,
  onCambiarEstado
}) => {
  const columns = [
    {
      title: 'Ruta',
      key: 'nombre',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: colores[row.numero] || '#3b82f6' }}
          />
          <span className="font-bold">{value || labels[row.numero] || 'Sin nombre'}</span>
        </div>
      )
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
      title: 'Hora Límite',
      key: 'horaLimiteRecepcion',
      render: (value) => {
        if (!value) return <span className="text-gray-400 text-xs">No definida</span>
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{value}</span>
            <span className="text-xs text-gray-500">hrs</span>
          </div>
        )
      }
    },
    {
      title: 'Pedidos',
      key: 'cantidadPedidos',
      render: (value) => <span className="font-semibold">{value}</span>
    },
    {
      title: 'Total Kilos',
      key: 'totalKilos',
      render: (value) => formatearKilos(value)
    },
    {
      title: 'Total Monto',
      key: 'totalMonto',
      render: (value) => (
        <span className="font-bold text-primary-600">{formatearMoneda(value)}</span>
      )
    },
    {
      title: 'Chofer',
      key: 'choferId',
      render: (value, row) => {
        if (!value && !row.driver) return <span className="text-gray-400 text-sm">Sin asignar</span>
        // Usar driver del backend como fuente primaria, getChoferById como fallback
        const chofer = row.driver
          ? { nombre: row.driver.name, licencia: row.driver.license }
          : getChoferById(value)
        return (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{chofer?.nombre || 'Desconocido'}</span>
            <span className="text-xs text-gray-500">Lic: {chofer?.licencia}</span>
          </div>
        )
      }
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (value) => {
        // Estados ya normalizados por useRoutes hook
        const estado = value || ESTADOS_RUTA.ABIERTA
        const variant = ESTADOS_RUTA_COLORS[estado] || 'default'
        const label = ESTADOS_RUTA_LABELS[estado] || estado.toUpperCase()
        return <Badge variant={variant}>{label}</Badge>
      }
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (id, row) => {
        // Estados ya normalizados por useRoutes hook
        const estadoActual = row.estado || ESTADOS_RUTA.ABIERTA
        const puedeEnviar = estadoActual === ESTADOS_RUTA.ABIERTA
        const puedeCompletar = estadoActual === ESTADOS_RUTA.ENVIADA

        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onExportar(row)}
            >
              Exportar PDF
            </Button>
            {onCambiarEstado && puedeEnviar && (
              <Button
                size="sm"
                onClick={() => onCambiarEstado(id, ESTADOS_RUTA.ENVIADA)}
              >
                Salida de vehiculo
              </Button>
            )}
            {onCambiarEstado && puedeCompletar && (
              <>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => onCambiarEstado(id, ESTADOS_RUTA.ABIERTA)}
                >
                  Reabrir
                </Button>
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onCambiarEstado(id, ESTADOS_RUTA.COMPLETADA)}
                >
                  Completar
                </Button>
              </>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <Card title={title}>
      <Table
        columns={columns}
        data={rutas}
        emptyMessage="No hay rutas"
      />
    </Card>
  )
}

export default RutasTable
