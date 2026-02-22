import React from 'react'
import { Card, Badge, Button } from '@components/common'
import DateRangePicker from '@components/common/DateRangePicker'
import { formatearMoneda, formatearKilos, formatearFecha } from '@utils/formatters'
import { ESTADOS_RUTA, ESTADOS_RUTA_LABELS, ESTADOS_RUTA_COLORS } from '@utils/constants'
import { useHistorialRutasFiltros } from '../hooks/useHistorialRutasFiltros'

/**
 * Icono de ordenamiento para las cabeceras
 */
const SortIcon = ({ active, direction }) => (
  <span className="ml-1 inline-flex flex-col">
    <svg
      className={`w-3 h-3 -mb-1 ${active && direction === 'asc' ? 'text-primary-600' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M5 12l5-5 5 5H5z" />
    </svg>
    <svg
      className={`w-3 h-3 ${active && direction === 'desc' ? 'text-primary-600' : 'text-gray-300'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M5 8l5 5 5-5H5z" />
    </svg>
  </span>
)

/**
 * Cabecera de columna ordenable
 */
const SortableHeader = ({ children, sortKey, sortConfig, onSort }) => (
  <th
    onClick={() => onSort(sortKey)}
    className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none transition-colors"
  >
    <div className="flex items-center">
      {children}
      <SortIcon active={sortConfig.key === sortKey} direction={sortConfig.direction} />
    </div>
  </th>
)

const HistorialRutasTable = ({
  rutas,
  rutasConfig,
  colores,
  labels,
  isSuperAdmin,
  getSedeById,
  getChoferById,
  onExportar
}) => {
  // Hook de filtros y ordenamiento
  const {
    rutasOrdenadas,
    filtroFechas,
    filtroRuta,
    sortConfig,
    opcionesRutas,
    handleSort,
    handleFiltroFechasChange,
    handleFiltroRutaChange,
    limpiarFiltros,
    hayFiltrosActivos,
    totalFiltradas,
    totalOriginal
  } = useHistorialRutasFiltros(rutas, rutasConfig)

  return (
    <Card>
      {/* Header con título y filtros */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial de Rutas
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({totalFiltradas} de {totalOriginal})
            </span>
          </h3>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro de fechas */}
            <div className="w-full sm:w-72">
              <DateRangePicker
                startDate={filtroFechas.startDate}
                endDate={filtroFechas.endDate}
                onChange={handleFiltroFechasChange}
                placeholder="Filtrar por fecha"
                maxDays={90}
              />
            </div>

            {/* Filtro de ruta */}
            <div className="w-full sm:w-48">
              <select
                value={filtroRuta}
                onChange={(e) => handleFiltroRutaChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Todas las rutas</option>
                {opcionesRutas.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón limpiar filtros */}
            {hayFiltrosActivos && (
              <Button
                variant="secondary"
                size="sm"
                onClick={limpiarFiltros}
                className="whitespace-nowrap"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla con cabeceras ordenables */}
      {rutasOrdenadas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-4">
            {hayFiltrosActivos ? 'No hay rutas que coincidan con los filtros' : 'No hay rutas en el historial'}
          </p>
        </div>
      ) : (
        <>
          {/* Vista de tabla para escritorio */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader sortKey="nombre" sortConfig={sortConfig} onSort={handleSort}>
                    Ruta
                  </SortableHeader>
                  {isSuperAdmin && (
                    <SortableHeader sortKey="sedeId" sortConfig={sortConfig} onSort={handleSort}>
                      Sede
                    </SortableHeader>
                  )}
                  <SortableHeader sortKey="fecha" sortConfig={sortConfig} onSort={handleSort}>
                    Fecha
                  </SortableHeader>
                  <SortableHeader sortKey="fechaEnvio" sortConfig={sortConfig} onSort={handleSort}>
                    Fecha Envío
                  </SortableHeader>
                  <SortableHeader sortKey="cantidadPedidos" sortConfig={sortConfig} onSort={handleSort}>
                    Pedidos
                  </SortableHeader>
                  <SortableHeader sortKey="totalKilos" sortConfig={sortConfig} onSort={handleSort}>
                    Total Kilos
                  </SortableHeader>
                  <SortableHeader sortKey="totalMonto" sortConfig={sortConfig} onSort={handleSort}>
                    Total Monto
                  </SortableHeader>
                  <SortableHeader sortKey="choferId" sortConfig={sortConfig} onSort={handleSort}>
                    Chofer
                  </SortableHeader>
                  <SortableHeader sortKey="estado" sortConfig={sortConfig} onSort={handleSort}>
                    Estado
                  </SortableHeader>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rutasOrdenadas.map((row) => {
                  const estado = row.estado || ESTADOS_RUTA.ABIERTA
                  const variant = ESTADOS_RUTA_COLORS[estado] || 'default'
                  const label = ESTADOS_RUTA_LABELS[estado] || estado.toUpperCase()
                  // Usar driver del backend como fuente primaria, getChoferById como fallback
                  const choferFromBackend = row.driver ? {
                    id: row.driver.id,
                    nombre: row.driver.name,
                    licencia: row.driver.license
                  } : null
                  const chofer = choferFromBackend || (row.choferId ? getChoferById(row.choferId) : null)
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

                      {/* Fecha */}
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-900">
                        {row.fecha ? formatearFecha(row.fecha, 'dd/MM/yyyy') : '-'}
                      </td>

                      {/* Fecha Envío */}
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-900">
                        {row.fechaEnvio ? (
                          <span className="text-green-700">
                            {formatearFecha(row.fechaEnvio, 'dd/MM/yyyy HH:mm')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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

                      {/* Chofer */}
                      <td className="px-4 lg:px-6 py-3 text-sm">
                        {chofer ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{chofer.nombre}</span>
                            <span className="text-xs text-gray-500">Lic: {chofer.licencia}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 lg:px-6 py-3 text-sm">
                        <Badge variant={variant}>{label}</Badge>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 lg:px-6 py-3 text-sm">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onExportar(row)}
                        >
                          Exportar PDF
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Vista de cards para móvil */}
          <div className="md:hidden space-y-3 p-4">
            {rutasOrdenadas.map((row) => {
              const estado = row.estado || ESTADOS_RUTA.ABIERTA
              const variant = ESTADOS_RUTA_COLORS[estado] || 'default'
              const label = ESTADOS_RUTA_LABELS[estado] || estado.toUpperCase()
              // Usar driver del backend como fuente primaria, getChoferById como fallback
              const choferFromBackend = row.driver ? {
                id: row.driver.id,
                nombre: row.driver.name,
                licencia: row.driver.license
              } : null
              const chofer = choferFromBackend || (row.choferId ? getChoferById(row.choferId) : null)

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

                  {/* Detalles */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Fecha</dt>
                      <dd>{row.fecha ? formatearFecha(row.fecha, 'dd/MM/yyyy') : '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Fecha Envío</dt>
                      <dd className="text-green-700">
                        {row.fechaEnvio ? formatearFecha(row.fechaEnvio, 'dd/MM HH:mm') : '-'}
                      </dd>
                    </div>
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
                    <div>
                      <dt className="text-xs text-gray-500 uppercase">Chofer</dt>
                      <dd>{chofer?.nombre || 'Sin asignar'}</dd>
                    </div>
                  </div>

                  {/* Acción */}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onExportar(row)}
                    className="w-full"
                  >
                    Exportar PDF
                  </Button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}

export default HistorialRutasTable
