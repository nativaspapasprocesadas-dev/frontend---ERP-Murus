import React from 'react'
import { Toast } from '@components/common'
import { VoucherUpload } from '@components/Pedidos'
import useAuthStore from '@features/auth/useAuthStore'
import { useToast } from '@hooks/useToast'
import { useCreditConfiguration } from '@hooks/useConfiguration'
import { ROLES, TIPO_CLIENTE } from '@utils/constants'

// Hooks de lógica de negocio
import {
  useClienteForm,
  useCarrito,
  usePaymentForm,
  useDeliveryForm,
  useRutaValidation,
  usePedidoCreation,
  useProductFilters,
  useVoucherUpload
} from './hooks'

// Componentes UI
import {
  ClientSelector,
  ClientInfo,
  PaymentTypeSelector,
  DeliveryMethodSelector,
  ProductForm,
  ShoppingCart,
  ObservationsField,
  RouteExitAlert
} from './components'

const NuevoPedido = () => {
  const { user, isRole } = useAuthStore()
  const { toast, showToast, hideToast } = useToast()

  // Hook de configuración de crédito para alertas
  const { config: creditConfig } = useCreditConfiguration()

  // Hook de cliente
  const clienteForm = useClienteForm({ user, isRole })
  const { cliente, createCliente } = clienteForm

  // Hook de filtros para productos disponibles (carga inicial)
  // Pasa customerId para obtener precios especiales del cliente
  const initialFilters = useProductFilters({
    customerId: cliente?.id || null
  })

  // Hook de carrito (recibe productos para edición)
  const carritoHook = useCarrito({
    cliente,
    productos: initialFilters.productos
  })

  // Hook de pago
  const paymentForm = usePaymentForm({ cliente })

  // Hook de validación de ruta (debe ejecutarse antes de useDeliveryForm)
  const rutaValidation = useRutaValidation({ cliente, isRole })

  // Hook de entrega (recibe rutaYaSalio para habilitar opción "Agendar para mañana")
  const deliveryForm = useDeliveryForm({ rutaYaSalio: rutaValidation.rutaYaSalio })

  // Hook de voucher (para clientes NO_RECURRENTE)
  const voucherUpload = useVoucherUpload()

  // Hook de filtros para edición (usa especieId del productoEditando)
  // Pasa customerId para obtener precios especiales del cliente
  const editFilters = useProductFilters({
    especieId: carritoHook.productoEditando.especieId,
    medidaId: carritoHook.productoEditando.medidaId,
    presentacionId: carritoHook.productoEditando.presentacionId,
    customerId: cliente?.id || null
  })

  // Función para resetear formulario después de crear pedido
  const handlePedidoSuccess = () => {
    carritoHook.vaciarCarrito()
    voucherUpload.resetVoucher()
  }

  // Hook de creación de pedido
  const { crearPedido } = usePedidoCreation({
    cliente,
    carrito: carritoHook.carrito,
    totales: carritoHook.totales,
    paymentForm,
    deliveryForm,
    user,
    isRole,
    createCliente,
    showToast,
    onSuccess: handlePedidoSuccess,
    voucherFile: voucherUpload.voucherFile,
    creditConfig
  })

  // Mostrar selector solo para admin/coordinador/superadmin
  const mostrarSelectorCliente = isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR) || isRole(ROLES.SUPERADMINISTRADOR)

  // Mostrar selector de pago SOLO para clientes NO_RECURRENTES (necesitan ver que es contado y subir voucher)
  // Los clientes RECURRENTES no ven nada de tipo de pago - el sistema lo maneja internamente
  const mostrarSelectorPago = cliente?.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE

  // Mostrar selector de entrega (admin/coordinador/superadmin siempre, cliente solo si ruta ya salió)
  const mostrarSelectorEntrega = isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR) || isRole(ROLES.SUPERADMINISTRADOR) || (isRole(ROLES.CLIENTE) && rutaValidation.rutaYaSalio)

  // Mostrar alerta informativa para clientes cuando la ruta NO ha salido
  const mostrarAlertaRuta = isRole(ROLES.CLIENTE) && !rutaValidation.rutaYaSalio

  // Estado de carga para cliente (solo CLIENTE necesita esperar carga)
  const clienteLoading = isRole(ROLES.CLIENTE) && !cliente

  // Determinar si debe mostrar campo de voucher
  // - Cliente NO_RECURRENTE: siempre (obligatorio) - deben pagar al contado con comprobante
  // - Cliente RECURRENTE: nunca - su pago es automáticamente a crédito
  const esClienteNoRecurrente = cliente?.tipoCliente === TIPO_CLIENTE.NO_RECURRENTE
  const esClienteRecurrente = cliente?.tipoCliente === TIPO_CLIENTE.RECURRENTE
  const mostrarVoucher = cliente && esClienteNoRecurrente
  const voucherObligatorio = esClienteNoRecurrente

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Nuevo Pedido</h2>

      {/* Mensaje de carga para rol CLIENTE */}
      {clienteLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700">Cargando información del cliente...</p>
        </div>
      )}

      {/* Selector de cliente (solo admin/coordinador) */}
      {mostrarSelectorCliente && (
        <ClientSelector
          esClienteNuevo={clienteForm.esClienteNuevo}
          setEsClienteNuevo={clienteForm.setEsClienteNuevo}
          clienteSeleccionadoId={clienteForm.clienteSeleccionadoId}
          setClienteSeleccionadoId={clienteForm.setClienteSeleccionadoId}
          clienteNuevo={clienteForm.clienteNuevo}
          updateClienteNuevo={clienteForm.updateClienteNuevo}
          clientesOptions={clienteForm.clientesOptions}
          clienteNuevoValido={clienteForm.clienteNuevoValido}
        />
      )}

      {/* Contenido cuando hay cliente seleccionado */}
      {cliente && (
        <>
          {/* Información del cliente */}
          <ClientInfo cliente={cliente} isRole={isRole} />

          {/* Selector de tipo de pago */}
          {mostrarSelectorPago && (
            <PaymentTypeSelector
              tipoPagoSeleccionado={paymentForm.tipoPagoSeleccionado}
              setTipoPagoSeleccionado={paymentForm.setTipoPagoSeleccionado}
              diasCreditoPersonalizados={paymentForm.diasCreditoPersonalizados}
              setDiasCreditoPersonalizados={paymentForm.setDiasCreditoPersonalizados}
              pagadoAnticipado={paymentForm.pagadoAnticipado}
              setPagadoAnticipado={paymentForm.setPagadoAnticipado}
              cliente={cliente}
              puedeUsarCredito={paymentForm.puedeUsarCredito}
            />
          )}

          {/* Alerta informativa cuando la ruta NO ha salido */}
          {mostrarAlertaRuta && <RouteExitAlert />}

          {/* Selector de método de entrega */}
          {mostrarSelectorEntrega && (
            <DeliveryMethodSelector
              metodoEntrega={deliveryForm.metodoEntrega}
              setMetodoEntrega={deliveryForm.setMetodoEntrega}
              metodoEntregaOtro={deliveryForm.metodoEntregaOtro}
              setMetodoEntregaOtro={deliveryForm.setMetodoEntregaOtro}
              isRole={isRole}
              whatsappMensajeRutaSalida={rutaValidation.whatsappMensajeRutaSalida}
              rutaYaSalio={rutaValidation.rutaYaSalio}
            />
          )}

          {/* Campo de observaciones */}
          <ObservationsField
            observaciones={deliveryForm.observaciones}
            setObservaciones={deliveryForm.setObservaciones}
          />

          {/* Campo de voucher (para pago al contado) */}
          {mostrarVoucher && (
            <div className={`rounded-lg p-4 border ${voucherObligatorio ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start mb-3">
                {voucherObligatorio ? (
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="ml-3 flex-1">
                  {voucherObligatorio ? (
                    <>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Cliente No Recurrente - Voucher Obligatorio
                      </h3>
                      <p className="mt-1 text-sm text-yellow-700">
                        Como este es un cliente no recurrente, debes adjuntar el comprobante de pago antes de crear el pedido.
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm font-medium text-blue-800">
                        Adjuntar Voucher de Pago (Opcional)
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        Si ya realizaste el pago (transferencia, Yape, Plin, etc.), puedes adjuntar el comprobante para que sea aprobado por el administrador.
                      </p>
                    </>
                  )}
                </div>
              </div>
              <VoucherUpload
                onFileSelect={voucherUpload.handleFileSelect}
                onRemove={voucherUpload.handleFileRemove}
                value={voucherUpload.voucherFile}
                required={voucherObligatorio}
                error={voucherUpload.voucherError}
              />
            </div>
          )}

          {/* Formulario de selección de productos */}
          <ProductForm
            onAdd={carritoHook.agregarAlCarrito}
            cliente={cliente}
          />

          {/* Carrito de compras */}
          <ShoppingCart
            carrito={carritoHook.carrito}
            totales={carritoHook.totales}
            editandoIndex={carritoHook.editandoIndex}
            productoEditando={carritoHook.productoEditando}
            setProductoEditando={carritoHook.setProductoEditando}
            productoEditandoSeleccionado={editFilters.productoSeleccionado}
            especiesOptions={editFilters.especiesOptions}
            medidasEditandoOptions={editFilters.medidasOptions}
            presentacionesEditandoOptions={editFilters.presentacionesOptions}
            onEdit={carritoHook.iniciarEdicion}
            onDelete={carritoHook.eliminarDelCarrito}
            onSaveEdit={carritoHook.guardarEdicion}
            onCancelEdit={carritoHook.cancelarEdicion}
            onClearCart={carritoHook.vaciarCarrito}
            onCreateOrder={crearPedido}
          />
        </>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  )
}

export default NuevoPedido
