import React from 'react'
import { Card, Badge, Button } from '@components/common'
import { formatearMoneda, formatearKilos, formatearFecha } from '@utils/formatters'
import { ESTADOS_RUTA, ESTADOS_RUTA_LABELS, ESTADOS_RUTA_COLORS } from '@utils/constants'

/**
 * Calcula los días restantes hasta una fecha
 */
const getDiasRestantes = (fecha) => {
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const fechaRuta = new Date(fecha)
  fechaRuta.setHours(0, 0, 0, 0)
  const diffTime = fechaRuta - hoy
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Badge que muestra los días restantes
 */
const DiasRestantesBadge = ({ fecha }) => {
  const dias = getDiasRestantes(fecha)
  if (dias === null) return null

  let bgColor = 'bg-blue-100 text-blue-800'
  let texto = `En ${dias} días`

  if (dias === 1) {
    bgColor = 'bg-amber-100 text-amber-800'
    texto = 'Mañana'
  } else if (dias === 2) {
    bgColor = 'bg-yellow-100 text-yellow-800'
    texto = 'Pasado mañana'
  } else if (dias > 7) {
    bgColor = 'bg-gray-100 text-gray-700'
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
      {texto}
    </span>
  )
}

/**
 * Componente para mostrar rutas programadas para fechas futuras
 * Similar a HistorialRutasTable pero más simple, sin filtros de fecha
 */
const RutasProgramadasTable = ({
  rutas,
  colores,
  labels,
  isSuperAdmin,
  getSedeById,
  getChoferById,
  onVerDetalle
}) => {
  // Si no hay rutas futuras, no mostrar nada
  if (!rutas || rutas.length === 0) {
    return null
  }

  return (
    <Card>
      {/* Header con título */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Rutas Programadas
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({rutas.length} {rutas.length === 1 ? 'ruta' : 'rutas'} para próximos días)
            </span>
          </h3>
        </div>
      </div>

      {/* Vista de tabla para escritorio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruta
              </th>
              {isSuperAdmin && (
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sede
                </th>
              )}
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Programada
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pedidos
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Kilos
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Monto
              </th>
              <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rutas.map((row) => {
              const estado = row.estado || ESTADOS_RUTA.ABIERTA
              const variant = ESTADOS_RUTA_COLORS[estado] || 'default'
              const label = ESTADOS_RUTA_LABELS[estado] || estado.toUpperCase()
              const sede = row.sedeId ? getSedeById(row.sedeId) : null

              return (
                <tr key={row.id} className="hover:bg-gray-50">
                  {/* Ruta */}
                  <td className="px-4 lg:px-6 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colores[row.numero] || '#3b82f6' }}
                      />
                      <span className="font-bold">
                        {row.nombre || labels[row.numero] || 'Sin nombre'}
                      </span>
                    </div>
                  </td>

                  {/* Sede (solo SuperAdmin) */}
                  {isSuperAdmin && (
                    <td className="px-4 lg:px-6 py-3 text-sm">
                      {sede ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: sede.color || '#6366f1' }}
                        >
                          {sede.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}

                  {/* Fecha Programada con badge de días restantes */}
                  <td className="px-4 lg:px-6 py-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-900 font-medium">
                        {row.fecha ? formatearFecha(row.fecha, 'EEEE dd/MM/yyyy') : '-'}
                      </span>
                      <DiasRestantesBadge fecha={row.fecha} />
                    </div>
                  </td>

                  {/* Pedidos */}
                  <td className="px-4 lg:px-6 py-3 text-sm font-semibold">
                    {row.cantidadPedidos}
                  </td>

                  {/* Total Kilos */}
                  <td className="px-4 lg:px-6 py-3 text-sm">
                    {formatearKilos(row.totalKilos)}
                  </td>

                  {/* Total Monto */}
                  <td className="px-4 lg:px-6 py-3 text-sm font-bold text-primary-600">
                    {formatearMoneda(row.totalMonto)}
                  </td>

                  {/* Estado */}
                  <td className="px-4 lg:px-6 py-3 text-sm">
                    <Badge variant={variant}>{label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para móvil */}
      <div className="md:hidden space-y-3 p-4">
        {rutas.map((row) => {
          const estado = row.estado || ESTADOS_RUTA.ABIERTA
          const variant = ESTADOS_RUTA_COLORS[estado] || 'default'
          const label = ESTADOS_RUTA_LABELS[estado] || estado.toUpperCase()
          const sede = row.sedeId ? getSedeById(row.sedeId) : null

          return (
            <div
              key={row.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              {/* Header de la card */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colores[row.numero] || '#3b82f6' }}
                  />
                  <span className="font-bold">
                    {row.nombre || labels[row.numero] || 'Sin nombre'}
                  </span>
                </div>
                <Badge variant={variant}>{label}</Badge>
              </div>

              {/* Fecha programada destacada */}
              <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {row.fecha ? formatearFecha(row.fecha, 'EEEE dd/MM/yyyy') : '-'}
                  </span>
                  <DiasRestantesBadge fecha={row.fecha} />
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {isSuperAdmin && sede && (
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-500 uppercase">Sede</dt>
                    <dd>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: sede.color || '#6366f1' }}
                      >
                        {sede.nombre}
                      </span>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Pedidos</dt>
                  <dd className="font-semibold">{row.cantidadPedidos}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Total</dt>
                  <dd className="font-bold text-primary-600">{formatearMoneda(row.totalMonto)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Kilos</dt>
                  <dd>{formatearKilos(row.totalKilos)}</dd>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default RutasProgramadasTable
