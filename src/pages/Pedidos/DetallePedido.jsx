import { useMemo, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Badge } from '@components/common'
import ComentariosSection from '@components/common/ComentariosSection'
import { useOrderDetail } from '@hooks/useOrderDetail'
import { ENTIDADES_COMENTABLES } from '@utils/constants'
import useAuthStore from '@features/auth/useAuthStore'
import { formatearMoneda, formatearKilos, formatearFecha } from '@utils/formatters'
import { numeroALetras } from '@utils/numeroALetras'
import {
  ESTADOS_PEDIDO_LABELS,
  ESTADOS_PEDIDO_COLORS,
  TIPOS_PAGO_LABELS,
  TIPOS_PAGO,
  RUTAS_COLORES,
  ROLES,
  ESTADOS_PAGO,
  ESTADOS_PAGO_LABELS,
  ESTADOS_PAGO_COLORS,
  TIPO_CLIENTE
} from '@utils/constants'
import configurationService from '@services/configurationService'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const DetallePedido = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isRole } = useAuthStore()

  // INTEGRACION REAL: Usa API-008 GET /api/v1/orders/:id via useOrderDetail hook
  const { order: pedido, loading, error } = useOrderDetail(parseInt(id))

  // Estado para configuración de empresa
  const [empresaConfig, setEmpresaConfig] = useState(null)

  // Estado para el modal del voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false)

  // Cargar configuración de empresa al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      const result = await configurationService.getCompanyConfig()
      if (result.success) {
        // Incluir el código de sede del usuario para usarlo en documentos
        setEmpresaConfig({
          ...result.data,
          sedeCode: user?.sedeCode || 'NV'
        })
      }
    }
    loadConfig()
  }, [user?.sedeCode])

  // Calcular totales - DEBE estar antes de cualquier return condicional
  const totales = useMemo(() => {
    if (!pedido) return { original: { items: 0, kilos: 0, monto: 0 }, adiciones: { items: 0, kilos: 0, monto: 0 } }

    const detallesOriginales = pedido.detallesOriginales || []
    const adiciones = pedido.adiciones || []

    return {
      original: {
        items: detallesOriginales.length,
        kilos: detallesOriginales.reduce((sum, d) => sum + d.totalKilos, 0),
        monto: detallesOriginales.reduce((sum, d) => sum + d.subtotal, 0)
      },
      adiciones: {
        items: adiciones.length,
        kilos: adiciones.reduce((sum, d) => sum + d.totalKilos, 0),
        monto: adiciones.reduce((sum, d) => sum + d.subtotal, 0)
      }
    }
  }, [pedido])

  // Estado de carga
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Cargando ticket...</h1>
          <Button onClick={() => navigate('/pedidos')}>Volver</Button>
        </div>
        <Card>
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Si hay error o no se encuentra el pedido
  if (error || !pedido) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Ticket no encontrado</h1>
          <Button onClick={() => navigate('/pedidos')}>Volver</Button>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-red-600 mb-2">{error || 'El ticket solicitado no existe'}</p>
            <p className="text-gray-600 text-sm">Verifique el ID del pedido o intente nuevamente</p>
          </div>
        </Card>
      </div>
    )
  }

  // Generar Nota de Venta Térmica (formato estandarizado 80mm)
  const generarNotaVentaTermica = () => {
    if (!empresaConfig) {
      console.error('Configuración de empresa no disponible')
      return
    }

    const doc = new jsPDF({
      format: [80, 220]
    })
    const empresa = empresaConfig
    const anchoTicket = 80
    let yPos = 5

    // Obtener todos los detalles (originales + adiciones)
    const todosLosDetalles = [
      ...(pedido.detallesOriginales || []),
      ...(pedido.adiciones || [])
    ]

    // ============================================
    // ENCABEZADO - Logo centrado arriba, texto debajo
    // ============================================
    const logoWidth = 22
    const logoHeight = 22
    const logoX = (anchoTicket - logoWidth) / 2

    try {
      doc.addImage('/logoPapas.png', 'PNG', logoX, yPos, logoWidth, logoHeight)
    } catch (error) {
      console.error('Error al cargar logo:', error)
    }

    yPos += logoHeight + 2

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(empresa.razonSocial, anchoTicket / 2, yPos, { align: 'center' })

    yPos += 4
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`TEL ${empresa.telefonoPlanta}`, anchoTicket / 2, yPos, { align: 'center' })

    yPos += 3
    doc.text(`Registro Sanitario ${empresa.registroSanitario}`, anchoTicket / 2, yPos, { align: 'center' })

    yPos += 3
    doc.setFont('helvetica', 'bold')
    doc.text(`RUC ${empresa.ruc}`, anchoTicket / 2, yPos, { align: 'center' })

    // Línea separadora
    yPos += 4
    doc.setDrawColor(0, 0, 0)
    doc.line(5, yPos, anchoTicket - 5, yPos)

    // ============================================
    // TÍTULO
    // ============================================
    yPos += 5
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('NOTA DE VENTA', anchoTicket / 2, yPos, { align: 'center' })

    yPos += 4
    doc.setFontSize(9)
    // Usar branchCode del pedido, o sedeCode de empresa como fallback, o 'NV' por defecto
    const codigoSede = pedido.branchCode || empresa.sedeCode || 'NV'
    // Usar correlativoSede si está disponible, sino usar pedido.id como fallback
    const numeroDocumento = pedido.correlativoSede || pedido.id
    doc.text(`${codigoSede}01 - ${String(numeroDocumento).padStart(8, '0')}`, anchoTicket / 2, yPos, { align: 'center' })

    // Línea separadora
    yPos += 4
    doc.line(5, yPos, anchoTicket - 5, yPos)

    // ============================================
    // INFORMACIÓN DEL DOCUMENTO
    // ============================================
    yPos += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('CLIENTE:', 5, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(pedido.nombreCliente, 22, yPos)

    yPos += 4
    doc.setFont('helvetica', 'bold')
    doc.text('FECHA EMISIÓN:', 5, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(formatearFecha(pedido.fecha, 'dd/MM/yyyy'), 35, yPos)

    // VENDEDOR (solo si el usuario actual NO es cliente)
    if (user && user.rol !== ROLES.CLIENTE) {
      yPos += 4
      doc.setFont('helvetica', 'bold')
      doc.text('VENDEDOR:', 5, yPos)
      doc.setFont('helvetica', 'normal')
      const rolCapitalizado = user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
      doc.text(rolCapitalizado, 25, yPos)
    }

    // Línea separadora
    yPos += 5
    doc.line(5, yPos, anchoTicket - 5, yPos)

    // ============================================
    // TABLA DE PRODUCTOS
    // ============================================
    yPos += 4
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('[CANT.]', 5, yPos)
    doc.text('KILOS', 17, yPos)
    doc.text('DESCRIPCIÓN', 28, yPos)
    doc.text('P/U', 55, yPos)
    doc.text('TOTAL', anchoTicket - 5, yPos, { align: 'right' })

    yPos += 2
    doc.line(5, yPos, anchoTicket - 5, yPos)

    // Productos
    doc.setFont('helvetica', 'normal')
    todosLosDetalles.forEach(detalle => {
      yPos += 4

      // [Cantidad]
      doc.text(`[${detalle.cantidad}]`, 5, yPos)

      // Kilos totales
      const kilosTotales = detalle.cantidad * detalle.kilosPorBolsa
      doc.text(`${kilosTotales}kg`, 17, yPos)

      // Descripción del producto (sin los kilos)
      const descripcion = `${detalle.especie?.nombre || ''} ${detalle.medida?.nombre || ''}`
      const descWrapped = doc.splitTextToSize(descripcion, 24)
      doc.text(descWrapped, 28, yPos)

      // Precio unitario
      doc.text(detalle.precioKg.toFixed(2), 55, yPos)

      // Total
      doc.text(detalle.subtotal.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

      yPos += (descWrapped.length - 1) * 3 + 2
    })

    // Línea separadora
    yPos += 3
    doc.line(5, yPos, anchoTicket - 5, yPos)

    // ============================================
    // TOTALES
    // ============================================
    yPos += 4
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('SUBTOTAL S/.:', 5, yPos)
    doc.text(pedido.totalMonto.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL A PAGAR S/.:', 5, yPos)
    doc.text(pedido.totalMonto.toFixed(2), anchoTicket - 5, yPos, { align: 'right' })

    // IMPORTE EN LETRAS
    yPos += 5
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    const totalEnLetras = numeroALetras(pedido.totalMonto)
    const letrasWrapped = doc.splitTextToSize(`IMPORTE EN LETRAS: ${totalEnLetras}`, anchoTicket - 10)
    doc.text(letrasWrapped, 5, yPos)
    yPos += letrasWrapped.length * 3

    // Línea separadora
    yPos += 2
    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.5)
    doc.line(5, yPos, anchoTicket - 5, yPos)

    // ============================================
    // FORMA DE PAGO
    // ============================================
    yPos += 4
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    const tipoPagoTexto = TIPOS_PAGO_LABELS[pedido.tipoPago] || pedido.tipoPago
    doc.text(`Forma de pago: ${tipoPagoTexto}`, anchoTicket / 2, yPos, { align: 'center' })

    // Estado de pago anticipado
    if (pedido.pagadoAnticipado) {
      yPos += 4
      doc.setFont('helvetica', 'bold')
      doc.text('*** YA PAGADO ***', anchoTicket / 2, yPos, { align: 'center' })
    }

    // Información de crédito si aplica
    if (pedido.tipoPago === TIPOS_PAGO.CREDITO && pedido.diasCredito) {
      yPos += 4
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text(`El pago se realizará al: Crédito ${pedido.diasCredito} día(s)`, anchoTicket / 2, yPos, { align: 'center' })
    }

    // Línea separadora punteada
    yPos += 4
    doc.setLineWidth(0.1)
    doc.setLineDash([2, 2])
    doc.line(5, yPos, anchoTicket - 5, yPos)
    doc.setLineDash([])
    doc.setLineWidth(0.5)

    // ============================================
    // PIE DE PÁGINA
    // ============================================
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('¡Gracias por su compra!', anchoTicket / 2, yPos, { align: 'center' })

    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.text(`Impreso: ${formatearFecha(new Date().toISOString(), 'dd/MM/yyyy HH:mm')}`, anchoTicket / 2, yPos, { align: 'center' })

    // Abrir en nueva ventana para imprimir
    window.open(doc.output('bloburl'), '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Ticket #{pedido.id}</h1>
            <Badge variant={ESTADOS_PEDIDO_COLORS[pedido.estado]}>
              {ESTADOS_PEDIDO_LABELS[pedido.estado]}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">
            Creado el {formatearFecha(pedido.fecha, 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="primary" onClick={generarNotaVentaTermica}>
            🖨️ Imprimir Ticket (80mm)
          </Button>
          <Button variant="secondary" onClick={() => navigate('/pedidos')}>
            Volver
          </Button>
        </div>
      </div>

      {/* Información general */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cliente */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-semibold text-lg">{pedido.nombreCliente}</p>
            </div>
            {pedido.direccionCliente && (
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{pedido.direccionCliente}</p>
              </div>
            )}
            {pedido.telefonoCliente && (
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{pedido.telefonoCliente}</p>
              </div>
            )}
            {pedido.cliente && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Descuento</p>
                  <p className="font-semibold text-green-600">
                    {((pedido.cliente.descuento || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Detalles del pedido */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Detalles del Ticket</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge variant={ESTADOS_PEDIDO_COLORS[pedido.estado]}>
                {ESTADOS_PEDIDO_LABELS[pedido.estado]}
              </Badge>
            </div>
            {pedido.rutaNumero && (
              <div>
                <p className="text-sm text-gray-600">Ruta Asignada</p>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: RUTAS_COLORES[pedido.rutaNumero] }}
                  ></div>
                  <span className="font-semibold">Ruta {pedido.rutaNumero}</span>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Tipo de Pago</p>
              <Badge variant={pedido.tipoPago === 'contado' ? 'success' : 'warning'}>
                {TIPOS_PAGO_LABELS[pedido.tipoPago]}
              </Badge>
            </div>
            {pedido.diasCredito && (
              <div>
                <p className="text-sm text-gray-600">Días de Crédito</p>
                <p className="font-semibold">{pedido.diasCredito} días</p>
              </div>
            )}
            {pedido.fechaEntrega && (
              <div>
                <p className="text-sm text-gray-600">Fecha de Entrega</p>
                <p className="font-semibold">
                  {formatearFecha(pedido.fechaEntrega, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Creado por</p>
              <p className="font-medium">{pedido.creadoPorNombre}</p>
            </div>
          </div>
        </Card>

        {/* Información de Voucher (solo si existe) */}
        {(pedido.voucherUrl || pedido.estadoPago || pedido.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE) && (
          <Card className="border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold mb-4">Información de Pago</h3>
            <div className="space-y-3">
              {pedido.tipoCliente && (
                <div>
                  <p className="text-sm text-gray-600">Tipo de Cliente</p>
                  <Badge variant={pedido.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE ? 'warning' : 'default'}>
                    {pedido.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE ? 'No Recurrente' : 'Recurrente'}
                  </Badge>
                </div>
              )}
              {pedido.pagadoAnticipado && (
                <div>
                  <p className="text-sm text-gray-600">Pago Anticipado</p>
                  <Badge variant="success">Sí</Badge>
                </div>
              )}
              {pedido.estadoPago && (
                <div>
                  <p className="text-sm text-gray-600">Estado de Pago</p>
                  <Badge variant={ESTADOS_PAGO_COLORS[pedido.estadoPago]}>
                    {ESTADOS_PAGO_LABELS[pedido.estadoPago]}
                  </Badge>
                </div>
              )}
              {pedido.voucherUrl && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Voucher de Pago</p>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                    {pedido.voucherUrl.endsWith('.pdf') ? (
                      <div className="p-4 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <svg className="h-8 w-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">Archivo PDF</span>
                        </div>
                        <button
                          onClick={() => setShowVoucherModal(true)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Ver documento
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowVoucherModal(true)}
                        className="w-full"
                      >
                        <img
                          src={pedido.voucherUrl}
                          alt="Voucher de pago"
                          className="w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Click para ver en tamaño completo
                  </p>
                </div>
              )}
              {!pedido.voucherUrl && pedido.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        Voucher pendiente
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        El cliente aún no ha subido el comprobante de pago.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Productos del pedido original */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Productos del Ticket Original</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Imagen
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Producto
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Cantidad (bolsas)
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Kg/Bolsa
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Total Kg
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Precio/Kg
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pedido.detallesOriginales?.map((detalle) => (
                <tr key={detalle.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {detalle.fotoUrl ? (
                        <img
                          src={detalle.fotoUrl}
                          alt={detalle.nombreProducto}
                          className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{detalle.nombreProducto}</span>
                      <span className="text-xs text-gray-500">
                        {detalle.especie?.nombre} - {detalle.medida?.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{detalle.cantidad}</td>
                  <td className="px-4 py-3 text-center">{detalle.kilosPorBolsa} kg</td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {formatearKilos(detalle.totalKilos)}
                  </td>
                  <td className="px-4 py-3 text-right">{formatearMoneda(detalle.precioKg)}</td>
                  <td className="px-4 py-3 text-right font-bold text-primary-600">
                    {formatearMoneda(detalle.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 font-semibold">Subtotal Original</td>
                <td className="px-4 py-3 text-center font-bold">{totales.original.items} items</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-center font-bold">
                  {formatearKilos(totales.original.kilos)}
                </td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-bold text-primary-600 text-lg">
                  {formatearMoneda(totales.original.monto)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Adiciones (si existen) */}
      {pedido.tieneAdiciones && (
        <Card className="border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-lg font-semibold">Productos Adicionados</h3>
            <Badge variant="warning">Adiciones</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Imagen
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Cantidad (bolsas)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Kg/Bolsa
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Total Kg
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Precio/Kg
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Fecha Adición
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pedido.adiciones?.map((detalle) => (
                  <tr key={detalle.id} className="hover:bg-orange-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        {detalle.fotoUrl ? (
                          <img
                            src={detalle.fotoUrl}
                            alt={detalle.nombreProducto}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{detalle.nombreProducto}</span>
                        <span className="text-xs text-gray-500">
                          {detalle.especie?.nombre} - {detalle.medida?.nombre}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{detalle.cantidad}</td>
                    <td className="px-4 py-3 text-center">{detalle.kilosPorBolsa} kg</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {formatearKilos(detalle.totalKilos)}
                    </td>
                    <td className="px-4 py-3 text-right">{formatearMoneda(detalle.precioKg)}</td>
                    <td className="px-4 py-3 text-right font-bold text-orange-600">
                      {formatearMoneda(detalle.subtotal)}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {formatearFecha(detalle.fechaCreacion, 'dd/MM/yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-orange-50 border-t-2 border-orange-300">
                <tr>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 font-semibold">Subtotal Adiciones</td>
                  <td className="px-4 py-3 text-center font-bold">{totales.adiciones.items} items</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-center font-bold">
                    {formatearKilos(totales.adiciones.kilos)}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600 text-lg">
                    {formatearMoneda(totales.adiciones.monto)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Resumen Total */}
      <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-300">
        <h3 className="text-lg font-semibold mb-4">Resumen Total del Ticket</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total Items</p>
            <p className="text-3xl font-bold text-gray-900">
              {pedido.cantidadProductos}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total Kilos</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatearKilos(pedido.totalKilos)}
            </p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow">
            <p className="text-sm text-gray-600 mb-1">Total a Pagar</p>
            <p className="text-4xl font-bold text-primary-600">
              {formatearMoneda(pedido.totalMonto)}
            </p>
          </div>
        </div>

        {pedido.tieneAdiciones && (
          <div className="mt-4 p-3 bg-white rounded border border-orange-300">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Nota:</span> Este ticket incluye adiciones posteriores.
              {' '}Original: {formatearMoneda(totales.original.monto)} + Adiciones: {formatearMoneda(totales.adiciones.monto)}
            </p>
          </div>
        )}
      </Card>

      {/* Sección de Comentarios (solo para Admin y Producción) */}
      {(isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.PRODUCCION)) && (
        <ComentariosSection
          entidadTipo={ENTIDADES_COMENTABLES.PEDIDO}
          entidadId={pedido.id}
          titulo="Comentarios del Ticket"
          mostrarUltimoDestacado={true}
        />
      )}

      {/* Modal para visualizar el Voucher */}
      {showVoucherModal && pedido.voucherUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay de fondo */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowVoucherModal(false)}
            ></div>

            {/* Contenedor del modal */}
            <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
              {/* Header del modal */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Voucher de Pago - Ticket #{pedido.id}
                </h3>
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 max-h-[75vh] overflow-auto">
                {pedido.voucherUrl.endsWith('.pdf') ? (
                  <iframe
                    src={pedido.voucherUrl}
                    className="w-full h-[65vh] border-0"
                    title="Voucher PDF"
                  />
                ) : (
                  <div className="flex justify-center">
                    <img
                      src={pedido.voucherUrl}
                      alt="Voucher de pago"
                      className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
                    />
                  </div>
                )}
              </div>

              {/* Footer del modal */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <a
                  href={pedido.voucherUrl}
                  download
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Descargar
                </a>
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetallePedido
