import { useState, useEffect, useCallback } from 'react'
import { Modal, Button, Input, Select, ComboBox, Badge } from '@components/common'
import { useCustomers } from '@hooks/useCustomers'
import OrdersService from '@services/OrdersService'
import { listCatalogProducts } from '@services/CatalogService'
import { PedidoAdicionalService } from '@services/PedidoAdicionalService'
import { TIPOS_PAGO, TIPOS_PAGO_LABELS, METODOS_ENTREGA, METODOS_ENTREGA_LABELS, TIPO_CLIENTE } from '@utils/constants'
import { getLocalDateTime } from '@utils/dateUtils'
import useAuthStore from '@features/auth/useAuthStore'

/**
 * Modal para crear pedidos adicionales (fuera de ruta)
 * ELM-032: ModalPedidoAdicional
 * Usa API-009: POST /api/v1/orders (crear pedido)
 * Usa API-016: GET /api/v1/customers (listar clientes)
 * Usa API-014: GET /api/v1/catalog/products (listar productos)
 *
 * Responsabilidad: Solo UI y validación de formulario
 * Lógica de negocio delegada a PedidoAdicionalService
 */
const ModalPedidoAdicional = ({ isOpen, onClose, onSuccess, showToast }) => {
  const { user, getSedeIdParaFiltro } = useAuthStore()
  const { data: clientesExpandidos, fetchCustomers } = useCustomers()

  // Estado para productos con precios personalizados del cliente
  const [productosCliente, setProductosCliente] = useState([])
  const [loadingProductos, setLoadingProductos] = useState(false)

  // Cliente seleccionado (objeto completo)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    clienteId: '',
    comentarioAdicional: '',
    metodoEntrega: '',
    fechaEntregaEstimada: '',
    tipoPago: TIPOS_PAGO.CONTADO,
    diasCredito: null,
    pagadoAnticipado: false,
    productos: []
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para selección de productos
  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1)

  // Cargar productos con precios personalizados para el cliente
  const cargarProductosCliente = useCallback(async (customerId) => {
    if (!customerId) {
      setProductosCliente([])
      return
    }

    setLoadingProductos(true)
    try {
      const response = await listCatalogProducts({ customerId, pageSize: 200 })
      setProductosCliente(response.data || [])
    } catch (error) {
      console.error('Error cargando productos del cliente:', error)
      setProductosCliente([])
    } finally {
      setLoadingProductos(false)
    }
  }, [])

  // Cargar clientes al abrir modal (filtrados por sede activa)
  useEffect(() => {
    if (isOpen) {
      const sedeId = getSedeIdParaFiltro()
      fetchCustomers({ branchId: sedeId || undefined })
    }
  }, [isOpen, fetchCustomers, getSedeIdParaFiltro])

  // Resetear formulario al abrir modal
  useEffect(() => {
    if (isOpen) {
      // Usar hora local para evitar desfase de timezone
      const horaActual = getLocalDateTime().slice(0, 16)

      setFormData({
        clienteId: '',
        comentarioAdicional: '',
        metodoEntrega: '',
        fechaEntregaEstimada: horaActual,
        tipoPago: TIPOS_PAGO.CONTADO,
        diasCredito: null,
        pagadoAnticipado: false,
        productos: []
      })
      setErrors({})
      setProductoSeleccionado('')
      setCantidadSeleccionada(1)
      setClienteSeleccionado(null)
      setProductosCliente([])
    }
  }, [isOpen])

  // Cuando cambia el cliente seleccionado
  useEffect(() => {
    if (formData.clienteId) {
      const cliente = clientesExpandidos.find(c => c.id === parseInt(formData.clienteId))
      setClienteSeleccionado(cliente)

      if (cliente) {
        // Cargar productos con precios personalizados
        cargarProductosCliente(cliente.id)

        // Asignar tipo de pago según tipo de cliente
        const esRecurrente = cliente.tipoCliente === TIPO_CLIENTE.RECURRENTE
        const tipoPago = esRecurrente ? TIPOS_PAGO.CREDITO : TIPOS_PAGO.CONTADO

        setFormData(prev => ({
          ...prev,
          tipoPago,
          diasCredito: esRecurrente ? cliente.diasCredito : null,
          pagadoAnticipado: false,
          productos: [] // Limpiar productos al cambiar cliente
        }))
      }
    } else {
      setClienteSeleccionado(null)
      setProductosCliente([])
    }
  }, [formData.clienteId, clientesExpandidos, cargarProductosCliente])

  // Manejar cambio en campos
  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Agregar producto a la lista (usa precio personalizado si existe)
  const handleAgregarProducto = () => {
    if (!productoSeleccionado || !clienteSeleccionado) return

    const producto = productosCliente.find(
      p => p.id === parseInt(productoSeleccionado)
    )

    if (!producto) return

    // Usar precio personalizado (discountedPrice) o precio base
    const precioKg = producto.discountedPrice || producto.basePrice || producto.precioBaseKg || 0
    const kilosPorBolsa = producto.presentationKilos || 1
    const tieneDescuento = producto.discountedPrice && producto.discountedPrice < producto.basePrice

    const nuevoProducto = {
      productoId: producto.id,
      nombreProducto: producto.name || `${producto.species} ${producto.measure} ${kilosPorBolsa}kg`,
      cantidad: cantidadSeleccionada,
      kilosPorBolsa: kilosPorBolsa,
      precioKg: precioKg,
      precioBase: producto.basePrice || precioKg,
      tieneDescuento,
      subtotal: cantidadSeleccionada * kilosPorBolsa * precioKg
    }

    setFormData(prev => ({
      ...prev,
      productos: [...prev.productos, nuevoProducto]
    }))

    // Reset selección
    setProductoSeleccionado('')
    setCantidadSeleccionada(1)
  }

  // Eliminar producto de la lista
  const handleEliminarProducto = (index) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }))
  }

  // Calcular totales
  const totalKilos = formData.productos.reduce(
    (sum, p) => sum + p.cantidad * p.kilosPorBolsa,
    0
  )
  const totalMonto = formData.productos.reduce((sum, p) => sum + p.subtotal, 0)

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Preparar datos para validación
    const datosValidacion = {
      ...formData,
      totalKilos,
      totalMonto
    }

    // Validar formulario usando PedidoAdicionalService
    const validation = PedidoAdicionalService.validatePedidoAdicional(datosValidacion)

    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsSubmitting(true)

    try {
      // Preparar pedido adicional usando servicio
      const pedidoData = PedidoAdicionalService.preparePedidoAdicional(
        { ...datosValidacion, totalKilos, totalMonto },
        user.id
      )

      // Crear pedido usando API-009 con tipo ADICIONAL
      const result = await OrdersService.createOrder({
        customerId: pedidoData.clienteId,
        paymentType: pedidoData.tipoPago,
        creditDays: pedidoData.diasCredito,
        deliveryMethod: pedidoData.metodoEntrega,
        estimatedDeliveryDate: pedidoData.fechaEntregaEstimada,
        observations: pedidoData.comentarioAdicional,
        isPrepaid: pedidoData.pagadoAnticipado || false,
        orderType: 'ADICIONAL', // Campo agregado para ELM-032
        items: formData.productos.map(p => ({
          productId: p.productoId,
          quantity: p.cantidad,
          unitPrice: p.precioKg * p.kilosPorBolsa // precio por unidad = precioKg × kilos de la presentación
        }))
      })

      if (result.success) {
        if (showToast) {
          showToast('Pedido adicional creado exitosamente', 'success')
        }
        await onSuccess()
      } else {
        setErrors({ general: result.error || 'Error al crear pedido adicional' })
      }
    } catch (error) {
      console.error('Error al crear pedido adicional:', error)
      setErrors({ general: 'Error inesperado al crear el pedido' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📦 Nuevo Pedido Adicional (Fuera de Ruta)"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error general */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{errors.general}</p>
          </div>
        )}

        {/* Sección 1: Cliente */}
        <div className="border-b pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Cliente</h3>
          <Select
            name="clienteId"
            label="Selecciona el Cliente"
            value={formData.clienteId}
            onChange={handleChange}
            options={clientesExpandidos.map(c => ({
              value: c.id,
              label: `${c.nombre} ${c.tipoCliente === TIPO_CLIENTE.RECURRENTE ? '(Recurrente)' : '(No Recurrente)'}`
            }))}
            error={errors.clienteId}
            required
            placeholder="Selecciona un cliente"
          />

          {/* Info del cliente seleccionado */}
          {clienteSeleccionado && (
            <div className={`mt-3 p-3 rounded-lg border ${
              clienteSeleccionado.tipoCliente === TIPO_CLIENTE.RECURRENTE
                ? 'bg-blue-50 border-blue-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={clienteSeleccionado.tipoCliente === TIPO_CLIENTE.RECURRENTE ? 'info' : 'warning'}>
                  {clienteSeleccionado.tipoCliente === TIPO_CLIENTE.RECURRENTE ? '👤 Cliente Recurrente' : '👤 Cliente No Recurrente'}
                </Badge>
              </div>
              <p className={`text-sm ${
                clienteSeleccionado.tipoCliente === TIPO_CLIENTE.RECURRENTE ? 'text-blue-800' : 'text-amber-800'
              }`}>
                {clienteSeleccionado.tipoCliente === TIPO_CLIENTE.RECURRENTE
                  ? `📝 Este pedido se registrará a CRÉDITO (${clienteSeleccionado.diasCredito || 0} días)`
                  : '💵 Este pedido se registrará como CONTADO (el cliente debe pagar al recibir)'
                }
              </p>
              {clienteSeleccionado.tipoCliente === TIPO_CLIENTE.RECURRENTE && clienteSeleccionado.totalDeuda > 0 && (
                <p className="text-sm text-blue-700 mt-1">
                  💳 Deuda actual: S/. {clienteSeleccionado.totalDeuda?.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sección 2: Productos */}
        <div className="border-b pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Productos</h3>

          {!clienteSeleccionado ? (
            <p className="text-sm text-gray-500 italic">Selecciona un cliente primero para ver los productos con sus precios</p>
          ) : loadingProductos ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              Cargando productos con precios del cliente...
            </div>
          ) : (
            <>
              {/* Selector de productos con búsqueda */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <ComboBox
                    name="productoSeleccionado"
                    value={productoSeleccionado}
                    onChange={(e) => setProductoSeleccionado(e.target.value)}
                    options={productosCliente.map(p => {
                      const tieneDescuento = p.discountedPrice && p.discountedPrice < p.basePrice
                      const precioMostrar = p.discountedPrice || p.basePrice
                      return {
                        value: p.id,
                        label: `${p.name} ${p.presentationKilos}kg - S/. ${precioMostrar?.toFixed(2)}/kg${tieneDescuento ? ' ✓ Precio especial' : ''}`
                      }
                    })}
                    placeholder="Escribe para buscar producto..."
                  />
                </div>
                <Input
                  type="number"
                  value={cantidadSeleccionada}
                  onChange={(e) => setCantidadSeleccionada(parseInt(e.target.value) || 1)}
                  min={1}
                  className="w-20"
                  placeholder="Cant."
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAgregarProducto}
                  disabled={!productoSeleccionado}
                >
                  +
                </Button>
              </div>

              {productosCliente.length === 0 && (
                <p className="text-sm text-amber-600">No hay productos disponibles en el catálogo</p>
              )}
            </>
          )}

          {/* Lista de productos agregados */}
          {formData.productos.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 mt-3">
              {formData.productos.map((prod, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{prod.nombreProducto}</p>
                      {prod.tieneDescuento && (
                        <Badge variant="success" className="text-xs">Precio especial</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      {prod.cantidad} bolsas × {prod.kilosPorBolsa}kg × S/. {prod.precioKg?.toFixed(2)}/kg = S/. {prod.subtotal.toFixed(2)}
                    </p>
                    {prod.tieneDescuento && prod.precioBase > prod.precioKg && (
                      <p className="text-xs text-green-600">
                        Ahorro: S/. {((prod.precioBase - prod.precioKg) * prod.cantidad * prod.kilosPorBolsa).toFixed(2)} (precio base: S/. {prod.precioBase?.toFixed(2)}/kg)
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => handleEliminarProducto(index)}
                  >
                    ✕
                  </Button>
                </div>
              ))}

              {/* Totales */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Kilos:</span>
                  <span>{totalKilos} kg</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total Monto:</span>
                  <span>S/. {totalMonto.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          {errors.productos && (
            <p className="text-sm text-red-600 mt-1">{errors.productos}</p>
          )}
        </div>

        {/* Sección 3: Comentario (OBLIGATORIO) */}
        <div className="border-b pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Comentario <span className="text-red-600">*</span>
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Explica el motivo del pedido adicional (mínimo 10 caracteres)
          </p>
          <textarea
            name="comentarioAdicional"
            value={formData.comentarioAdicional}
            onChange={handleChange}
            placeholder="Ej: Pedido urgente. Cliente solicitó a las 5pm para evento nocturno. Se enviará por taxi a Av. Los Olivos 234."
            rows={4}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.comentarioAdicional
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-primary-500'
            }`}
            maxLength={500}
          />
          <div className="flex justify-between text-xs mt-1">
            <span className={errors.comentarioAdicional ? 'text-red-600' : 'text-gray-500'}>
              {errors.comentarioAdicional || `${formData.comentarioAdicional.length}/500 caracteres`}
            </span>
            <span className="text-gray-500">
              Mínimo 10 caracteres
            </span>
          </div>
        </div>

        {/* Sección 4: Método de Entrega */}
        <div className="border-b pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Método de Entrega <span className="text-red-600">*</span>
          </h3>
          <div className="space-y-2">
            {Object.entries(METODOS_ENTREGA).map(([key, value]) => (
              <label key={value} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="metodoEntrega"
                  value={value}
                  checked={formData.metodoEntrega === value}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-900">
                  {METODOS_ENTREGA_LABELS[value]}
                </span>
              </label>
            ))}
          </div>
          {errors.metodoEntrega && (
            <p className="text-sm text-red-600 mt-1">{errors.metodoEntrega}</p>
          )}
        </div>

        {/* Sección 5: Fecha de Entrega Estimada */}
        <div className="border-b pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Fecha de Entrega Estimada <span className="text-red-600">*</span>
          </h3>
          <Input
            type="datetime-local"
            name="fechaEntregaEstimada"
            value={formData.fechaEntregaEstimada}
            onChange={handleChange}
            error={errors.fechaEntregaEstimada}
            required
          />
        </div>

        {/* Sección 6: Tipo de Pago (automático según tipo de cliente) */}
        <div className="pb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Tipo de Pago</h3>

          {!clienteSeleccionado ? (
            <p className="text-sm text-gray-500 italic">Se asignará automáticamente al seleccionar cliente</p>
          ) : (
            <>
              {/* Mostrar tipo de pago asignado automáticamente */}
              <div className={`p-3 rounded-lg border ${
                formData.tipoPago === TIPOS_PAGO.CREDITO
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${
                    formData.tipoPago === TIPOS_PAGO.CREDITO ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {formData.tipoPago === TIPOS_PAGO.CREDITO ? '📝' : '💵'}
                  </span>
                  <span className={`font-semibold ${
                    formData.tipoPago === TIPOS_PAGO.CREDITO ? 'text-blue-900' : 'text-amber-900'
                  }`}>
                    {TIPOS_PAGO_LABELS[formData.tipoPago]}
                  </span>
                  <span className="text-xs text-gray-500">(asignado automáticamente)</span>
                </div>
                {formData.tipoPago === TIPOS_PAGO.CREDITO && formData.diasCredito && (
                  <p className="text-sm text-blue-700 mt-1">
                    Vencimiento: {formData.diasCredito} días después de la entrega
                  </p>
                )}
              </div>

              {/* Checkbox de pago anticipado (solo para contado) */}
              {formData.tipoPago === TIPOS_PAGO.CONTADO && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <label className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="pagadoAnticipado"
                      checked={formData.pagadoAnticipado}
                      onChange={(e) => setFormData(prev => ({ ...prev, pagadoAnticipado: e.target.checked }))}
                      className="w-5 h-5 text-green-600 focus:ring-green-500 mt-0.5"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-green-900">
                        ✓ El cliente ya pagó este pedido
                      </span>
                      <p className="text-xs text-green-700 mt-1">
                        Marque esta opción si el cliente pagó anticipadamente. El repartidor NO cobrará al entregar y en el ticket aparecerá "PAGADO".
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || formData.productos.length === 0}
          >
            {isSubmitting ? 'Creando...' : 'Crear Pedido Adicional'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ModalPedidoAdicional
