import React, { useMemo, useState, useRef, useEffect } from 'react'
import { parseISO } from 'date-fns'
import { Card, Button, SedeIndicator } from '@components/common'
import ComentariosSection from '@components/common/ComentariosSection'
import { usePizarraData } from '@hooks/usePizarraData'
import { ENTIDADES_COMENTABLES, RUTAS_COLORES, ESTADOS_PEDIDO, RUTAS } from '@utils/constants'
import { getLocalDate } from '@utils/dateUtils'

const PizarraProduccion = () => {
  // Usar datos reales del backend
  // El campo "listo" viene directamente en cada detalle de pedido
  const {
    pedidosExpandidos,
    rutasAbiertasHoy,
    pedidosAgendados,
    loading,
    error,
    refetch,
    toggleItemsListoBatch
  } = usePizarraData()

  // Estado y ref para pantalla completa
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  // Manejar cambios de fullscreen (incluyendo ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Función para toggle pantalla completa
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Error al cambiar pantalla completa:', err)
    }
  }

  // Obtener fecha actual (usa getLocalDate para evitar problemas de timezone)
  const hoy = getLocalDate()

  // Obtener IDs de las rutas abiertas de hoy + columna S/R (rutaId = 0)
  const rutasActivasIds = useMemo(() => {
    const rutasIds = rutasAbiertasHoy.map(r => r.id)
    // Siempre incluir rutaId = 0 para pedidos adicionales (Sin Ruta)
    return [...rutasIds, RUTAS.SIN_RUTA]
  }, [rutasAbiertasHoy])

  // Filtrar pedidos del día actual: incluye rutas activas + pedidos sin ruta (S/R)
  // NOTA: El backend ya filtra por fecha_entrega = hoy, así que solo filtramos por ruta aquí
  const pedidosProduccion = useMemo(() => {
    const pedidos = pedidosExpandidos.filter(
      // Incluir pedidos con rutaId en rutasActivasIds O pedidos sin ruta (null)
      p => rutasActivasIds.includes(p.rutaId) || p.rutaId === null
    )
    return pedidos
  }, [pedidosExpandidos, rutasActivasIds])

  // Generar estructura dinámica: especie → medida → presentación → ruta → { cantidad, detalleIds, todosListos }
  const pizarra = useMemo(() => {
    const grouped = {}

    pedidosProduccion.forEach(pedido => {
      pedido.detalles?.forEach(detalle => {
        const especie = detalle.especie?.nombre
        const medida = detalle.medida?.nombre
        const presentacion = detalle.presentacion?.kilos
        // Si no tiene rutaId (pedido adicional sin ruta), usar 0 (S/R)
        const rutaId = pedido.rutaId === null ? RUTAS.SIN_RUTA : pedido.rutaId

        if (!especie || !medida || !presentacion || rutaId === undefined) return

        // Inicializar estructura
        if (!grouped[especie]) {
          grouped[especie] = {
            medidas: new Set(),
            presentaciones: new Set(),
            data: {}
          }
        }

        grouped[especie].medidas.add(medida)
        grouped[especie].presentaciones.add(presentacion)

        // Crear anidamiento: medida → presentación → ruta
        if (!grouped[especie].data[medida]) {
          grouped[especie].data[medida] = {}
        }
        if (!grouped[especie].data[medida][presentacion]) {
          grouped[especie].data[medida][presentacion] = {}
        }
        if (!grouped[especie].data[medida][presentacion][rutaId]) {
          grouped[especie].data[medida][presentacion][rutaId] = {
            cantidad: 0,
            detalleIds: [],
            detallesListos: 0
          }
        }

        // Sumar cantidad de bolsas y guardar detalleId
        grouped[especie].data[medida][presentacion][rutaId].cantidad += detalle.cantidad
        grouped[especie].data[medida][presentacion][rutaId].detalleIds.push(detalle.id)
        if (detalle.listo) {
          grouped[especie].data[medida][presentacion][rutaId].detallesListos += 1
        }
      })
    })

    // Convertir Sets a arrays ordenados
    Object.keys(grouped).forEach(especieKey => {
      grouped[especieKey].medidas = Array.from(grouped[especieKey].medidas).sort()
      grouped[especieKey].presentaciones = Array.from(grouped[especieKey].presentaciones).sort((a, b) => a - b)
    })

    return grouped
  }, [pedidosProduccion])

  const getRutaColor = (rutaId) => {
    // Si es rutaId = 0 (S/R), retornar color amarillo
    if (rutaId === RUTAS.SIN_RUTA) {
      return RUTAS_COLORES[RUTAS.SIN_RUTA]
    }
    const ruta = rutasAbiertasHoy.find(r => r.id === rutaId)
    // Usar el color configurado de la ruta, o fallback al mapa estático si no tiene
    return ruta?.color || RUTAS_COLORES[ruta?.numero] || '#3B82F6'
  }

  const getRutaNumero = (rutaId) => {
    // Si es rutaId = 0 (S/R), retornar 0
    if (rutaId === RUTAS.SIN_RUTA) {
      return RUTAS.SIN_RUTA
    }
    const ruta = rutasAbiertasHoy.find(r => r.id === rutaId)
    return ruta ? ruta.numero : null
  }

  const getRutaLabel = (rutaNumero) => {
    // Si es 0, mostrar "S/R" en lugar de "R0"
    if (rutaNumero === RUTAS.SIN_RUTA) {
      return 'S/R'
    }
    return `R${rutaNumero}`
  }

  // Generar ID único para comentarios basado en fecha (ej: 20250119)
  const pizarraId = parseInt(hoy.replace(/-/g, ''))

  // Separar tablas: Única en primera fila, el resto en segunda fila
  // IMPORTANTE: Este useMemo debe estar ANTES de cualquier return condicional
  const { tablasPrincipales, tablasSecundarias } = useMemo(() => {
    const principales = [] // Única va aquí
    const secundarias = [] // Amarilla, Blanca, etc.

    Object.entries(pizarra).forEach(([especie, especieData]) => {
      const tabla = {
        especie,
        especieData,
        // Calcular número de columnas para ajuste automático
        numColumnas: especieData.medidas.length * rutasActivasIds.length
      }

      // "Única" va en la fila principal
      if (especie.toLowerCase() === 'única' || especie.toLowerCase() === 'unica') {
        principales.push(tabla)
      } else {
        secundarias.push(tabla)
      }
    })

    return { tablasPrincipales: principales, tablasSecundarias: secundarias }
  }, [pizarra, rutasActivasIds])

  // Estado de carga
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Pizarra de Producción</h1>
            <SedeIndicator size="sm" />
          </div>
        </div>
        <Card>
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg">Cargando pizarra de producción...</p>
          </div>
        </Card>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Pizarra de Producción</h1>
            <SedeIndicator size="sm" />
          </div>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-lg text-red-600 mb-4">Error: {error}</p>
            <Button variant="primary" onClick={refetch}>
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Si no hay pedidos para producir hoy
  if (pedidosProduccion.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Pizarra de Producción</h1>
            <SedeIndicator size="sm" />
          </div>
        </div>
        <Card>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No hay pedidos asignados a rutas abiertas para hoy</p>
            <p className="text-sm mt-2">Los pedidos aparecerán aquí cuando se asignen a las rutas del día</p>
            <Button variant="secondary" onClick={refetch} className="mt-4">
              Actualizar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Clases condicionales para pantalla completa
  const fullscreenClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white overflow-auto p-2 pt-3'
    : ''

  // Componente para renderizar una tabla de especie
  const renderTablaEspecie = (especie, especieData) => (
    <div key={especie} className="flex-shrink-0">
      <table className="border-collapse border-2 border-black">
        {/* Encabezado con especie */}
        <thead>
          <tr>
            <th
              colSpan={1 + especieData.medidas.length * rutasActivasIds.length}
              className={`text-center font-bold text-white bg-black border border-black uppercase tracking-wider ${
                isFullscreen ? 'p-5 text-3xl' : 'p-4 text-2xl'
              }`}
            >
              {especie}
            </th>
          </tr>

          {/* Fila de medidas (dinámicas) */}
          <tr>
            <th className="border-2 border-black bg-white"></th>
            {especieData.medidas.map(medida => (
              <th
                key={medida}
                colSpan={rutasActivasIds.length}
                className={`text-center font-bold text-black bg-yellow-400 border-2 border-black ${
                  isFullscreen ? 'p-3 text-xl' : 'p-2'
                }`}
              >
                {medida}
              </th>
            ))}
          </tr>

          {/* Sub-encabezados de rutas (rutas activas + S/R) */}
          <tr>
            <th className="border-2 border-black bg-white"></th>
            {especieData.medidas.map(medida => (
              <React.Fragment key={`header-${medida}`}>
                {rutasActivasIds.map(rutaId => {
                  const rutaNumero = getRutaNumero(rutaId)
                  return (
                    <th
                      key={`${medida}-r${rutaNumero}`}
                      className={`text-center font-bold text-white border border-black ${
                        isFullscreen ? 'p-3 text-base' : 'p-2 text-xs font-semibold'
                      }`}
                      style={{ backgroundColor: getRutaColor(rutaId) }}
                    >
                      {getRutaLabel(rutaNumero)}
                    </th>
                  )
                })}
              </React.Fragment>
            ))}
          </tr>
        </thead>

        {/* Filas de presentaciones (dinámicas) */}
        <tbody>
          {especieData.presentaciones.map(presentacionKg => (
            <tr key={presentacionKg}>
              {/* Celda de presentación (naranja) */}
              <td className={`text-center font-bold text-black bg-orange-400 border-2 border-black whitespace-nowrap ${
                isFullscreen ? 'p-4 text-xl' : 'p-3'
              }`}>
                {presentacionKg} Kg
              </td>

              {/* Celdas de cantidades por medida y ruta */}
              {especieData.medidas.map(medida => {
                const medidasData = especieData.data[medida] || {}
                const presentacionData = medidasData[presentacionKg] || {}

                return (
                  <React.Fragment key={`${medida}-${presentacionKg}`}>
                    {rutasActivasIds.map(rutaId => {
                      const cellData = presentacionData[rutaId] || { cantidad: 0, detalleIds: [], detallesListos: 0 }
                      const { cantidad, detalleIds, detallesListos } = cellData
                      // Está listo si TODOS los detalles están marcados como listos
                      const todosListos = detalleIds.length > 0 && detallesListos === detalleIds.length

                      // Handler para toggle de todos los detalles de esta celda (batch)
                      const handleToggle = async () => {
                        if (!cantidad || detalleIds.length === 0) return
                        // Toggle todos los detalles en una sola operacion
                        await toggleItemsListoBatch(detalleIds, !todosListos)
                      }

                      return (
                        <td
                          key={`${medida}-${presentacionKg}-r${rutaId}`}
                          className={`text-center border border-black transition-colors cursor-pointer hover:opacity-80 ${
                            isFullscreen ? 'p-3' : 'p-2'
                          }`}
                          style={{
                            backgroundColor: todosListos ? '#90EE90' : '#87CEEB',
                            minWidth: isFullscreen ? '90px' : '70px'
                          }}
                          onClick={handleToggle}
                        >
                          {cantidad ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-bold text-gray-900 ${
                                isFullscreen ? 'text-3xl' : 'text-xl'
                              }`}>
                                {cantidad}
                              </span>
                              {todosListos && (
                                <span className={`text-green-700 font-bold ${
                                  isFullscreen ? 'text-sm' : 'text-xs'
                                }`}>
                                  ✓ Listo
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={`text-gray-400 ${isFullscreen ? 'text-xl' : ''}`}>-</span>
                          )}
                        </td>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'space-y-3' : 'space-y-6'} ${fullscreenClasses}`}
    >
      {/* Header con botón de pantalla completa */}
      <div className={`flex items-start gap-4 ${isFullscreen ? 'justify-end' : 'justify-between'}`}>
        {!isFullscreen && (
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Pizarra de Producción
              </h1>
              <SedeIndicator size="sm" />
            </div>
          </div>
        )}
        <Button
          variant={isFullscreen ? 'danger' : 'primary'}
          onClick={toggleFullscreen}
          className="flex items-center gap-2 whitespace-nowrap"
        >
          {isFullscreen ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 00-2 0v1H2a1 1 0 000 2h3a1 1 0 001-1V4zm10 0a1 1 0 112 0v1h1a1 1 0 110 2h-3a1 1 0 01-1-1V4zM5 16a1 1 0 00-2 0v1a1 1 0 001 1h1a1 1 0 100-2H4zm12-1a1 1 0 011 1v1h1a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Salir (ESC)
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Pantalla Completa
            </>
          )}
        </Button>
      </div>

      {/* Mensaje de pedidos agendados para fechas futuras */}
      {!isFullscreen && pedidosAgendados && pedidosAgendados.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-blue-900 font-semibold text-base mb-1">
                📅 Pedidos agendados para próximos días
              </h4>
              <div className="space-y-1">
                {pedidosAgendados.map((item) => {
                  const fecha = parseISO(item.fecha)
                  const fechaFormateada = fecha.toLocaleDateString('es-PE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })
                  return (
                    <p key={item.fecha} className="text-blue-800 text-sm">
                      <span className="font-medium">{item.cantidad} pedido{item.cantidad !== 1 ? 's' : ''}</span>
                      {' '}agendado{item.cantidad !== 1 ? 's' : ''} para el <span className="font-medium">{fechaFormateada}</span>
                    </p>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primera fila: Tabla(s) principal(es) - Única */}
      {tablasPrincipales.length > 0 && (
        <div className="flex flex-wrap gap-4 items-start">
          {tablasPrincipales.map(({ especie, especieData }) => (
            renderTablaEspecie(especie, especieData)
          ))}
        </div>
      )}

      {/* Segunda fila: Tablas secundarias - Amarilla, Blanca, etc. */}
      {tablasSecundarias.length > 0 && (
        <div className="flex flex-wrap gap-4 items-start">
          {tablasSecundarias.map(({ especie, especieData }) => (
            renderTablaEspecie(especie, especieData)
          ))}
        </div>
      )}

      {/* Sección de Comentarios para Administrador y Producción */}
      <ComentariosSection
        entidadTipo={ENTIDADES_COMENTABLES.PRODUCCION}
        entidadId={pizarraId}
        titulo="Comentarios de Producción del Día"
        mostrarUltimoDestacado={true}
      />
    </div>
  )
}

export default PizarraProduccion
