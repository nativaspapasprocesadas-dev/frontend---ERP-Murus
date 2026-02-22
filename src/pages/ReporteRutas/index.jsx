import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Select, Badge, SedeIndicator } from '@components/common'
import { getRoutesReport } from '@services/ReportsService'
import { listRouteConfigs } from '@services/RoutesService'
import { formatearMoneda, formatearKilos, formatearFecha } from '@utils/formatters'
import { RUTAS_COLORES } from '@utils/constants'
import useAuthStore from '@features/auth/useAuthStore'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Vista de Reporte por Rutas (Despacho)
 * ELM-140 (Vista principal), ELM-141 (Desglose por Ruta), ELM-142 (Tabla Detalle de Despachos)
 *
 * Integrado con: API-063 GET /api/v1/reports/routes
 */
const ReporteRutas = () => {
  const { sedeIdActiva, getSedeIdParaFiltro } = useAuthStore()

  const [rutasExpandidas, setRutasExpandidas] = useState([])
  const [rutasConfig, setRutasConfig] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [filtroFecha, setFiltroFecha] = useState('este_mes')
  const [rutaSeleccionada, setRutaSeleccionada] = useState('todas')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    // Cargar rutas_config para el selector (independiente del reporte)
    const cargarRutasConfig = async () => {
      try {
        const response = await listRouteConfigs()
        if (response.success && response.data) {
          setRutasConfig(
            response.data
              .filter(r => r.isActive)
              .map(r => ({ id: r.id, nombre: r.name, color: r.color }))
              .sort((a, b) => a.id - b.id)
          )
        }
      } catch (err) {
        console.error('Error cargando configuración de rutas:', err)
      }
    }
    cargarRutasConfig()
  }, [])

  // Obtener rango de fechas segun filtro
  const getRangoFechas = () => {
    const hoy = new Date()
    switch (filtroFecha) {
      case 'hoy':
        return { inicio: format(hoy, 'yyyy-MM-dd'), fin: format(hoy, 'yyyy-MM-dd') }
      case 'esta_semana':
        return {
          inicio: format(startOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          fin: format(endOfWeek(hoy, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        }
      case 'este_mes':
        return {
          inicio: format(startOfMonth(hoy), 'yyyy-MM-dd'),
          fin: format(endOfMonth(hoy), 'yyyy-MM-dd')
        }
      case 'personalizado':
        return { inicio: fechaInicio, fin: fechaFin }
      default:
        return { inicio: '', fin: '' }
    }
  }

  // Cargar datos desde API-063
  useEffect(() => {
    const cargarDatos = async () => {
      const rango = getRangoFechas()
      if (!rango.inicio) return

      try {
        setLoading(true)
        setError(null)

        const branchIdParaFiltro = getSedeIdParaFiltro()
        const params = { dateFrom: rango.inicio, dateTo: rango.fin }
        if (branchIdParaFiltro) params.branchId = branchIdParaFiltro

        const response = await getRoutesReport(params)

        if (response.success && response.routes) {
          const rutasMapeadas = (response.routes || []).map(ruta => ({
            id: ruta.dailyId || ruta.id,
            numero: ruta.id,
            nombre: ruta.name,
            color: ruta.color || null,
            descripcion: ruta.descripcion || null,
            horaLimite: ruta.horaLimite || null,
            fecha: ruta.date || rango.inicio,
            estado: ruta.status,
            horaInicio: ruta.horaInicio || null,
            horaFin: ruta.horaFin || null,
            kmInicio: ruta.kmInicio,
            kmFin: ruta.kmFin,
            observaciones: ruta.observaciones || null,
            cantidadPedidos: ruta.orderCount || 0,
            totalKilos: ruta.totalKilos || 0,
            totalMonto: ruta.totalAmount || 0,
            choferId: ruta.choferId || null,
            choferNombre: ruta.choferNombre || null,
            choferTelefono: ruta.choferTelefono || null,
            pedidos: ruta.orders || [],
            productDetails: ruta.productDetails || []
          }))
          setRutasExpandidas(rutasMapeadas)
        } else {
          setRutasExpandidas([])
        }
      } catch (err) {
        console.error('Error cargando reporte de rutas:', err)
        setError(err.message || 'Error al cargar datos')
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [filtroFecha, fechaInicio, fechaFin, sedeIdActiva])

  // Rutas disponibles para el selector (desde rutas_config, siempre lleno)
  const rutasDisponibles = useMemo(() => {
    return rutasConfig.map(r => ({ numero: r.id, nombre: r.nombre, color: r.color }))
  }, [rutasConfig])

  // Filtrar rutas segun seleccion
  const rutasFiltradas = useMemo(() => {
    if (rutaSeleccionada === 'todas') return rutasExpandidas
    return rutasExpandidas.filter(ruta => ruta.numero === parseInt(rutaSeleccionada))
  }, [rutasExpandidas, rutaSeleccionada])

  // Estadisticas generales
  const estadisticas = useMemo(() => {
    const totalPedidos = rutasFiltradas.reduce((sum, r) => sum + r.cantidadPedidos, 0)
    const totalKilos = rutasFiltradas.reduce((sum, r) => sum + r.totalKilos, 0)
    const totalMonto = rutasFiltradas.reduce((sum, r) => sum + r.totalMonto, 0)

    const porRuta = {}
    rutasFiltradas.forEach(ruta => {
      if (!porRuta[ruta.numero]) {
        porRuta[ruta.numero] = { numero: ruta.numero, nombre: ruta.nombre, color: ruta.color, pedidos: 0, kilos: 0, monto: 0, despachos: 0 }
      }
      porRuta[ruta.numero].pedidos += ruta.cantidadPedidos
      porRuta[ruta.numero].kilos += ruta.totalKilos
      porRuta[ruta.numero].monto += ruta.totalMonto
      porRuta[ruta.numero].despachos += 1
    })

    return {
      totalPedidos,
      totalKilos,
      totalMonto,
      totalDespachos: rutasFiltradas.length,
      porRuta: Object.values(porRuta)
    }
  }, [rutasFiltradas])

  // Detalles por ruta: despachos, clientes, productos, especies
  const detallesPorRuta = useMemo(() => {
    const detalles = {}

    rutasFiltradas.forEach(ruta => {
      if (!detalles[ruta.numero]) {
        detalles[ruta.numero] = {
          numero: ruta.numero,
          nombre: ruta.nombre,
          color: ruta.color,
          despachos: [],
          clientes: {},
          productos: {},
          especies: {}
        }
      }

      // Agregar despacho con datos logisticos
      const kmRecorridos = (ruta.kmInicio != null && ruta.kmFin != null) ? (ruta.kmFin - ruta.kmInicio) : null
      detalles[ruta.numero].despachos.push({
        fecha: ruta.fecha,
        estado: ruta.estado,
        pedidos: ruta.cantidadPedidos,
        kilos: ruta.totalKilos,
        monto: ruta.totalMonto,
        chofer: ruta.choferNombre || 'Sin asignar',
        choferTelefono: ruta.choferTelefono || null,
        horaInicio: ruta.horaInicio,
        horaFin: ruta.horaFin,
        kmRecorridos,
        observaciones: ruta.observaciones
      })

      // Agrupar clientes unicos desde pedidos
      ruta.pedidos.forEach(pedido => {
        const keyCliente = pedido.cliente || 'Sin nombre'
        if (!detalles[ruta.numero].clientes[keyCliente]) {
          detalles[ruta.numero].clientes[keyCliente] = {
            nombre: keyCliente,
            direccion: pedido.direccion || '-',
            telefono: pedido.telefonoContacto || '-',
            tipoCliente: pedido.tipoCliente || '-',
            totalPedidos: 0,
            totalMonto: 0
          }
        }
        detalles[ruta.numero].clientes[keyCliente].totalPedidos += 1
        detalles[ruta.numero].clientes[keyCliente].totalMonto += pedido.total || 0
      })

      // Agrupar productos y especies desde productDetails del backend
      ruta.productDetails.forEach(detalle => {
        const keyProd = detalle.nombreProducto || 'Sin nombre'
        if (!detalles[ruta.numero].productos[keyProd]) {
          detalles[ruta.numero].productos[keyProd] = { nombre: keyProd, cantidad: 0, kilos: 0 }
        }
        detalles[ruta.numero].productos[keyProd].cantidad += detalle.cantidadBolsas || 0
        detalles[ruta.numero].productos[keyProd].kilos += detalle.totalKilos || 0

        const especie = detalle.especie || 'Sin especie'
        if (!detalles[ruta.numero].especies[especie]) {
          detalles[ruta.numero].especies[especie] = 0
        }
        detalles[ruta.numero].especies[especie] += detalle.totalKilos || 0
      })
    })

    // Convertir a arrays y ordenar
    Object.keys(detalles).forEach(rutaNum => {
      detalles[rutaNum].clientes = Object.values(detalles[rutaNum].clientes)
        .sort((a, b) => b.totalMonto - a.totalMonto)

      detalles[rutaNum].productos = Object.values(detalles[rutaNum].productos)
        .sort((a, b) => b.cantidad - a.cantidad)

      detalles[rutaNum].especies = Object.entries(detalles[rutaNum].especies)
        .map(([nombre, kilos]) => ({ nombre, kilos }))
        .sort((a, b) => b.kilos - a.kilos)
    })

    return detalles
  }, [rutasFiltradas])

  // Obtener color de ruta (backend > constante > fallback)
  const getColorRuta = (numero, colorBackend) => {
    return colorBackend || RUTAS_COLORES[numero] || '#6b7280'
  }

  // Formatear hora
  const formatearHora = (isoString) => {
    if (!isoString) return null
    try {
      const d = new Date(isoString)
      return format(d, 'HH:mm', { locale: es })
    } catch { return null }
  }

  // Exportar a PDF
  const exportarPDF = () => {
    const doc = new jsPDF()
    const rango = getRangoFechas()

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Reporte de Despacho por Rutas', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    const periodo = filtroFecha === 'hoy' ? 'Hoy' :
      filtroFecha === 'esta_semana' ? 'Esta Semana' :
        filtroFecha === 'este_mes' ? 'Este Mes' :
          `${formatearFecha(rango.inicio)} - ${formatearFecha(rango.fin)}`
    doc.text(`Periodo: ${periodo}`, 105, 28, { align: 'center' })

    if (rutaSeleccionada !== 'todas') {
      const rutaNombre = rutasDisponibles.find(r => r.numero === parseInt(rutaSeleccionada))?.nombre || `Ruta ${rutaSeleccionada}`
      doc.text(`Ruta: ${rutaNombre}`, 105, 34, { align: 'center' })
    }

    let yPosition = rutaSeleccionada !== 'todas' ? 42 : 36

    // Resumen general
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen General', 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Total Despachos: ${estadisticas.totalDespachos}`, 20, yPosition)
    doc.text(`Total Pedidos: ${estadisticas.totalPedidos}`, 80, yPosition)
    doc.text(`Total Kilos: ${formatearKilos(estadisticas.totalKilos)}`, 140, yPosition)
    yPosition += 6
    doc.text(`Total Monto: ${formatearMoneda(estadisticas.totalMonto)}`, 20, yPosition)
    yPosition += 10

    // Tabla desglose por ruta
    if (estadisticas.porRuta.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Desglose por Ruta', 20, yPosition)
      yPosition += 6

      autoTable(doc, {
        startY: yPosition,
        head: [['Ruta', 'Despachos', 'Pedidos', 'Kilos', 'Monto']],
        body: estadisticas.porRuta.map(ruta => [
          ruta.nombre || `Ruta ${ruta.numero}`,
          ruta.despachos.toString(),
          ruta.pedidos.toString(),
          formatearKilos(ruta.kilos),
          formatearMoneda(ruta.monto)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22], fontSize: 10 },
        styles: { fontSize: 9 }
      })
      yPosition = doc.lastAutoTable.finalY + 10
    }

    // Detalle por ruta
    Object.keys(detallesPorRuta).forEach((rutaNum, index) => {
      const detalle = detallesPorRuta[rutaNum]

      if (yPosition > 240 || index > 0) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(`${detalle.nombre || 'Ruta ' + rutaNum} - Detalle`, 20, yPosition)
      yPosition += 8

      // Tabla despachos
      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha', 'Estado', 'Chofer', 'Pedidos', 'Kilos', 'Monto']],
        body: detalle.despachos.map(d => [
          formatearFecha(d.fecha),
          d.estado,
          d.chofer + (d.choferTelefono ? ` (${d.choferTelefono})` : ''),
          d.pedidos.toString(),
          formatearKilos(d.kilos),
          formatearMoneda(d.monto)
        ]),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22], fontSize: 9 },
        styles: { fontSize: 8 }
      })
      yPosition = doc.lastAutoTable.finalY + 8

      // Tabla clientes
      if (detalle.clientes.length > 0) {
        if (yPosition > 240) { doc.addPage(); yPosition = 20 }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Clientes en esta Ruta', 20, yPosition)
        yPosition += 6

        autoTable(doc, {
          startY: yPosition,
          head: [['Cliente', 'Direccion', 'Telefono', 'Tipo', 'Pedidos', 'Monto']],
          body: detalle.clientes.map(c => [
            c.nombre,
            c.direccion,
            c.telefono,
            c.tipoCliente,
            c.totalPedidos.toString(),
            formatearMoneda(c.totalMonto)
          ]),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
          styles: { fontSize: 7 },
          columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 35 } }
        })
        yPosition = doc.lastAutoTable.finalY + 8
      }

      // Tabla productos
      if (detalle.productos.length > 0) {
        if (yPosition > 240) { doc.addPage(); yPosition = 20 }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Productos Mas Despachados', 20, yPosition)
        yPosition += 6

        autoTable(doc, {
          startY: yPosition,
          head: [['Producto', 'Bolsas', 'Kilos']],
          body: detalle.productos.slice(0, 10).map(p => [
            p.nombre,
            p.cantidad.toString(),
            formatearKilos(p.kilos)
          ]),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
          styles: { fontSize: 8 }
        })
        yPosition = doc.lastAutoTable.finalY + 10
      }

      // Tabla especies
      if (detalle.especies.length > 0) {
        if (yPosition > 240) { doc.addPage(); yPosition = 20 }
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Kilos por Especie', 20, yPosition)
        yPosition += 6

        autoTable(doc, {
          startY: yPosition,
          head: [['Especie', 'Kilos Totales']],
          body: detalle.especies.map(e => [e.nombre, formatearKilos(e.kilos)]),
          theme: 'striped',
          headStyles: { fillColor: [251, 191, 36], fontSize: 9 },
          styles: { fontSize: 8 }
        })
        yPosition = doc.lastAutoTable.finalY + 10
      }
    })

    // Pie de pagina
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128)
      doc.text(
        `Pagina ${i} de ${pageCount} - Generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}`,
        105, 290, { align: 'center' }
      )
    }

    doc.save(`reporte-rutas-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`)
  }

  const getNombrePeriodo = () => {
    const rango = getRangoFechas()
    switch (filtroFecha) {
      case 'hoy':
        return format(new Date(), "EEEE, d 'de' MMMM", { locale: es })
      case 'esta_semana':
        return `Semana del ${format(new Date(rango.inicio), "d 'de' MMMM", { locale: es })}`
      case 'este_mes':
        return format(new Date(), "MMMM yyyy", { locale: es })
      case 'personalizado':
        if (fechaInicio && fechaFin) return `${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}`
        return 'Periodo personalizado'
      default:
        return ''
    }
  }

  return (
    <div className={`space-y-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-golden-500 p-8 shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-golden-400/20 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                </div>
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium">
                  Reporte de Despacho
                </span>
                <SedeIndicator size="sm" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                Reporte por Rutas
              </h1>
              <p className="text-white/80 text-lg capitalize">
                {getNombrePeriodo()}
              </p>
            </div>

            <button
              onClick={exportarPDF}
              disabled={rutasFiltradas.length === 0 || loading}
              className="group flex items-center gap-3 px-6 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <svg className="w-6 h-6 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Filtros de Busqueda</h2>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Periodo de Consulta</label>
              <select
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
              >
                <option value="hoy">Hoy</option>
                <option value="esta_semana">Esta Semana</option>
                <option value="este_mes">Este Mes</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Filtrar por Ruta</label>
              <select
                value={rutaSeleccionada}
                onChange={(e) => setRutaSeleccionada(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
              >
                <option value="todas">Todas las Rutas</option>
                {rutasDisponibles.map(ruta => (
                  <option key={ruta.numero} value={ruta.numero}>{ruta.nombre || `Ruta ${ruta.numero}`}</option>
                ))}
              </select>
            </div>

            {filtroFecha === 'personalizado' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Indicador de carga */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <p className="text-gray-500 font-medium">Cargando datos de rutas...</p>
          </div>
        </div>
      )}

      {/* Estadisticas Generales */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Rutas</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Despachos</p>
              <p className="text-4xl font-bold text-gray-900">{estadisticas.totalDespachos}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Pedidos</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Pedidos</p>
              <p className="text-4xl font-bold text-gray-900">{estadisticas.totalPedidos}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded-full">Peso</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Kilos</p>
              <p className="text-4xl font-bold text-gray-900">{formatearKilos(estadisticas.totalKilos)}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Ventas</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Monto</p>
              <p className="text-4xl font-bold text-gray-900">{formatearMoneda(estadisticas.totalMonto)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Desglose por Ruta */}
      {!loading && estadisticas.porRuta.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Desglose por Ruta</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estadisticas.porRuta.map((ruta, index) => {
                const rutaColor = getColorRuta(ruta.numero, ruta.color)
                return (
                  <div
                    key={ruta.numero}
                    className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      background: `linear-gradient(135deg, ${rutaColor}15 0%, ${rutaColor}05 100%)`,
                      border: `2px solid ${rutaColor}30`
                    }}
                  >
                    <div className="h-1.5 w-full" style={{ backgroundColor: rutaColor }}></div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: rutaColor }}>
                            <span className="text-white font-bold text-lg">{ruta.numero}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{ruta.nombre || `Ruta ${ruta.numero}`}</h3>
                            <p className="text-sm text-gray-500">{ruta.despachos} despacho{ruta.despachos !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white/60 rounded-xl">
                          <p className="text-xs font-medium text-gray-500 mb-1">Pedidos</p>
                          <p className="text-xl font-bold text-gray-900">{ruta.pedidos}</p>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-xl">
                          <p className="text-xs font-medium text-gray-500 mb-1">Kilos</p>
                          <p className="text-xl font-bold text-gray-900">{formatearKilos(ruta.kilos)}</p>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-xl">
                          <p className="text-xs font-medium text-gray-500 mb-1">Monto</p>
                          <p className="text-lg font-bold text-gray-900">{formatearMoneda(ruta.monto)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Detalle por Ruta */}
      {!loading && Object.keys(detallesPorRuta).length > 0 && (
        <>
          {Object.keys(detallesPorRuta).map((rutaNum) => {
            const detalle = detallesPorRuta[rutaNum]
            const rutaColor = getColorRuta(rutaNum, detalle.color)

            return (
              <div key={rutaNum} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div
                  className="px-6 py-5 border-b"
                  style={{
                    background: `linear-gradient(135deg, ${rutaColor}15 0%, white 100%)`,
                    borderBottomColor: `${rutaColor}30`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: rutaColor }}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{detalle.nombre || `Ruta ${rutaNum}`}</h2>
                      <p className="text-sm text-gray-500">Detalle completo de despachos</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Tabla de despachos con logistica */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full">
                      <thead>
                        <tr style={{ backgroundColor: `${rutaColor}10` }}>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                          <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Chofer</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Horario</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Km</th>
                          <th className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Pedidos</th>
                          <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Kilos</th>
                          <th className="px-4 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detalle.despachos.map((despacho, index) => {
                          const horaIni = formatearHora(despacho.horaInicio)
                          const horaFn = formatearHora(despacho.horaFin)
                          return (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-4 py-4">
                                <span className="text-sm font-medium text-gray-900">{formatearFecha(despacho.fecha)}</span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                                  style={{ backgroundColor: `${rutaColor}15`, color: rutaColor }}
                                >
                                  {despacho.estado}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div>
                                  <span className="text-sm text-gray-700 block">{despacho.chofer}</span>
                                  {despacho.choferTelefono && (
                                    <span className="text-xs text-gray-400">{despacho.choferTelefono}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                {horaIni || horaFn ? (
                                  <span className="text-xs text-gray-600">
                                    {horaIni || '--'} - {horaFn || '--'}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-300">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {despacho.kmRecorridos != null ? (
                                  <span className="text-xs font-medium text-gray-600">{despacho.kmRecorridos.toFixed(1)} km</span>
                                ) : (
                                  <span className="text-xs text-gray-300">-</span>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-sm font-bold text-gray-700">
                                  {despacho.pedidos}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-medium text-gray-900">{formatearKilos(despacho.kilos)}</span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <span className="text-sm font-bold text-gray-900">{formatearMoneda(despacho.monto)}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Observaciones (si alguna existe) */}
                  {detalle.despachos.some(d => d.observaciones) && (
                    <div className="space-y-2">
                      {detalle.despachos.filter(d => d.observaciones).map((d, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <span className="text-yellow-600 text-sm font-medium">{formatearFecha(d.fecha)}:</span>
                          <span className="text-sm text-gray-700">{d.observaciones}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clientes en esta Ruta */}
                  {detalle.clientes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Clientes en esta Ruta ({detalle.clientes.length})</h3>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-blue-50">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Direccion</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Telefono</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Pedidos</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detalle.clientes.map((cliente, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <span className="text-sm font-medium text-gray-900">{cliente.nombre}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">{cliente.direccion}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-gray-600">{cliente.telefono}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    cliente.tipoCliente === 'RECURRENTE'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {cliente.tipoCliente === 'RECURRENTE' ? 'Recurrente' : cliente.tipoCliente === 'NO_RECURRENTE' ? 'No Recurrente' : cliente.tipoCliente}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-sm font-bold text-gray-700">{cliente.totalPedidos}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-sm font-bold text-gray-900">{formatearMoneda(cliente.totalMonto)}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Top 10 Productos */}
                  {detalle.productos.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Top 10 Productos</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detalle.productos.slice(0, 10).map((producto, index) => (
                          <div
                            key={index}
                            className="group flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-200"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                              <span className="text-white font-bold text-sm">#{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{producto.nombre}</p>
                              <p className="text-sm text-gray-500">{formatearKilos(producto.kilos)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-600">{producto.cantidad}</p>
                              <p className="text-xs text-gray-400">bolsas</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kilos por Especie */}
                  {detalle.especies.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">Kilos por Especie</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {detalle.especies.map((especie, index) => (
                          <div
                            key={index}
                            className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-2 border-amber-200/50 hover:border-amber-300 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                            <div className="relative">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-800">{especie.nombre}</h4>
                              </div>
                              <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                {formatearKilos(especie.kilos)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Mensaje sin datos */}
      {!loading && rutasFiltradas.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="text-center py-16 px-6">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No se encontraron despachos para el periodo seleccionado. Intenta ajustar los filtros de fecha o seleccionar otra ruta.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReporteRutas
