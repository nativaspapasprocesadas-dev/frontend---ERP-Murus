import { useState, useEffect, useMemo } from 'react'
import { Input, Select, Button, Toast } from '@components/common'
import { ProductPriceTable } from '@components/Clientes'
import { useCustomers } from '@hooks/useCustomers'
import { useProducts } from '@hooks/useProducts'
import { useRoutes } from '@hooks/useRoutes'
import { PricingService } from '@services/PricingService'
import { CustomersService } from '@services/CustomersService'
import { clienteSchema, clienteInitialValues, validarCliente } from '@utils/schemas/clienteSchema'

const TOAST_DISPLAY_MS = 1000

/**
 * Componente de formulario para crear/editar cliente
 * ELM-027: FormularioNuevoCliente
 *
 * Modos de operación:
 * - Crear: Sin prop `cliente` -> Usa API-018: POST /api/v1/customers
 * - Editar: Con prop `cliente` -> Usa API-019: PUT /api/v1/customers/:id
 *
 * Usa API-014: GET /api/v1/catalog/products (listar productos para precios personalizados)
 *
 * Responsabilidad: Solo UI y validación de formulario
 * Lógica de creación/edición delegada a useCustomers
 *
 * Props:
 * - cliente: Datos del cliente a editar (opcional, si no se pasa es modo creación)
 * - onSuccess: Callback cuando se crea/edita exitosamente
 * - onCancel: Callback cuando se cancela
 * - onError: Callback para mostrar errores via Toast (opcional)
 */
const FormularioNuevoCliente = ({ cliente, onSuccess, onCancel, onError }) => {
  const { createCustomer, updateCustomer, loading } = useCustomers()
  const { productosExpandidos, fetchProducts, loading: loadingProducts } = useProducts()
  const { rutasConfig, loading: loadingRutas } = useRoutes()

  // Generar opciones de rutas dinámicamente desde la API
  const rutasOptions = useMemo(() => {
    if (!rutasConfig || rutasConfig.length === 0) return []
    return rutasConfig
      .filter(ruta => ruta.activo) // Solo rutas activas
      .map(ruta => ({
        value: ruta.id,
        label: ruta.nombre || `Ruta ${ruta.id}`
      }))
  }, [rutasConfig])

  // Determinar si es modo edición
  const isEditing = Boolean(cliente?.id)

  // Estado del formulario - inicializar con datos del cliente si existe
  const [formData, setFormData] = useState(() => {
    if (cliente) {
      return {
        nombre: cliente.nombre || '',
        password: '', // No se edita la contraseña
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        ruta: cliente.ruta?.toString() || cliente.rutaId?.toString() || '',
        diasCredito: cliente.diasCredito?.toString() || '0',
        nombreContacto: cliente.nombreContacto || '',
        cargoContacto: cliente.cargoContacto || '',
        telefonoContacto: cliente.telefonoContacto || ''
      }
    }
    return clienteInitialValues
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  // Estado para Toast de notificaciones
  const [toast, setToast] = useState(null)

  // Helper para mostrar error (usa callback externo si existe, sino toast interno)
  const mostrarError = (mensaje) => {
    if (onError) {
      onError(mensaje)
    } else {
      setToast({ type: 'error', message: mensaje })
    }
  }

  // Helper para mostrar éxito
  const mostrarExito = (mensaje) => {
    setToast({ type: 'success', message: mensaje })
  }

  // Estado de precios por producto
  const [preciosProductos, setPreciosProductos] = useState([])
  // IDs de productos que tenían precio activo al cargar (para detectar desmarcados)
  const [productosConPrecioOriginal, setProductosConPrecioOriginal] = useState(new Set())

  // Cargar TODOS los productos al montar el componente (incluye no visibles en catálogo)
  // El filtro visible_en_catalogo solo aplica para lo que ve el cliente en su catálogo,
  // pero al asignar precios personalizados, el admin debe ver TODOS los productos
  useEffect(() => {
    fetchProducts({ includeHidden: true, pageSize: 0 })
  }, [fetchProducts])

  // Inicializar precios cuando se cargan los productos (SOLO en modo creacion)
  // En modo edicion, los precios se cargan desde el segundo useEffect
  useEffect(() => {
    if (!isEditing && productosExpandidos.length > 0 && preciosProductos.length === 0) {
      const preciosIniciales = PricingService.initializeDefaultPrices(productosExpandidos)
      setPreciosProductos(preciosIniciales)
    }
  }, [productosExpandidos, preciosProductos.length, isEditing])

  // Cargar precios personalizados del cliente en modo edición
  useEffect(() => {
    const cargarPreciosCliente = async () => {
      if (isEditing && cliente?.id && productosExpandidos.length > 0) {
        try {
          const result = await CustomersService.getCustomerProductPrices(cliente.id)

          // Guardar IDs de productos que tienen precio activo originalmente
          const idsConPrecio = new Set()
          if (result.success && result.data) {
            result.data.forEach(p => {
              if (p.isActive) {
                idsConPrecio.add(p.productId)
              }
            })
          }
          setProductosConPrecioOriginal(idsConPrecio)

          // Mapear TODOS los productos, usando precios personalizados si existen
          const preciosConPersonalizados = productosExpandidos.map(producto => {
            const precioCliente = result.success
              ? result.data.find(p => p.productId === producto.id)
              : null
            const precioBase = producto.precioBase || producto.precioKilo || 0
            return {
              ...producto,
              id: producto.id,
              productoId: producto.id,
              precioBase: precioBase,
              activo: precioCliente?.isActive || false,
              precioPersonalizado: precioCliente?.customPrice ?? precioBase
            }
          })
          setPreciosProductos(preciosConPersonalizados)
        } catch (error) {
          console.error('Error cargando precios del cliente:', error)
          // En caso de error, inicializar con valores por defecto (sin activar)
          const preciosDefault = productosExpandidos.map(producto => {
            const precioBase = producto.precioBase || producto.precioKilo || 0
            return {
              ...producto,
              id: producto.id,
              productoId: producto.id,
              precioBase: precioBase,
              activo: false,
              precioPersonalizado: precioBase
            }
          })
          setPreciosProductos(preciosDefault)
        }
      }
    }
    cargarPreciosCliente()
  }, [isEditing, cliente?.id, productosExpandidos])

  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    // Validación para campos de teléfono: solo números
    if (name === 'telefono' || name === 'telefonoContacto') {
      // Remover cualquier caracter que no sea número
      const onlyNumbers = value.replace(/[^0-9]/g, '')

      setFormData({
        ...formData,
        [name]: onlyNumbers
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      })
    }

    // Limpiar error del campo al modificarlo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      })
    }

    // Limpiar error del servidor
    if (serverError) {
      setServerError('')
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')

    // Validar formulario (en modo edición, password no es requerido)
    const dataToValidate = isEditing
      ? { ...formData, password: formData.password || 'dummypassword' } // Password no requerido en edición
      : formData
    const validation = validarCliente(dataToValidate)

    if (!validation.isValid) {
      // En modo edición, ignorar error de password si está vacío
      if (isEditing && validation.errors.password && !formData.password) {
        delete validation.errors.password
        if (Object.keys(validation.errors).length === 0) {
          validation.isValid = true
        }
      }
      if (!validation.isValid) {
        setErrors(validation.errors)
        // Mostrar Toast con el primer error de validación
        const primerError = Object.values(validation.errors)[0]
        mostrarError(primerError || 'Por favor, completa todos los campos requeridos')
        return
      }
    }

    // Validar que haya al menos un producto seleccionado (solo en creación)
    const productosActivos = preciosProductos.filter(p => p.activo)
    if (!isEditing && productosActivos.length === 0) {
      mostrarError('Debes seleccionar al menos un producto para el cliente')
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (isEditing) {
        // Modo edición: Actualizar cliente usando API-019
        const updateData = {
          name: formData.nombre,
          phone: formData.telefono,
          address: formData.direccion,
          routeId: formData.ruta ? parseInt(formData.ruta) : null,
          creditDays: formData.diasCredito ? parseInt(formData.diasCredito) : 0,
          contactName: formData.nombreContacto,
          contactPosition: formData.cargoContacto,
          contactPhone: formData.telefonoContacto
        }

        result = await updateCustomer(cliente.id, updateData)

        if (result.success) {
          // Actualizar precios de productos
          // Enviar:
          // 1. Productos activos (para crear/actualizar)
          // 2. Productos que tenían precio original pero ahora están desmarcados (para desactivar)
          const preciosParaAPI = preciosProductos
            .filter(p => {
              // Incluir si está activo (marcado)
              if (p.activo) return true
              // O si tenía precio original y ahora está desmarcado (necesita desactivarse)
              if (productosConPrecioOriginal.has(p.id) && !p.activo) return true
              return false
            })
            .map(p => ({
              productId: p.id,
              // Si está activo, enviar el precio; si no, enviar null para desactivar
              customPrice: p.activo ? (p.precioPersonalizado || p.precioBase) : null,
              isActive: p.activo
            }))

          if (preciosParaAPI.length > 0) {
            await CustomersService.updateCustomerProductPrices(
              cliente.id,
              preciosParaAPI
            )
          }

          // Si hay callback onError, la página padre maneja los toasts
          if (onError) {
            onSuccess()
          } else {
            mostrarExito('Cliente actualizado exitosamente')
            setTimeout(() => onSuccess(), TOAST_DISPLAY_MS)
          }
        } else {
          mostrarError(result.error || 'Error al actualizar el cliente')
        }
      } else {
        // Modo creación: Crear cliente usando API-018
        result = await createCustomer(formData)

        if (result.success) {
          // Crear precios de productos personalizados usando API-081
          if (productosActivos.length > 0) {
            const preciosParaAPI = productosActivos.map(p => ({
              productId: p.id,
              customPrice: p.precioPersonalizado || null,
              isActive: true
            }))

            await CustomersService.updateCustomerProductPrices(
              result.data.id,
              preciosParaAPI
            )
          }

          // Si hay callback onError, la página padre maneja los toasts
          if (onError) {
            onSuccess()
          } else {
            mostrarExito(result.message || 'Cliente creado exitosamente')
            setTimeout(() => onSuccess(), TOAST_DISPLAY_MS)
          }
        } else {
          mostrarError(result.error || 'Error al crear el cliente')
        }
      }
    } catch (error) {
      mostrarError(`Error inesperado al ${isEditing ? 'actualizar' : 'crear'} el cliente`)
      console.error(`Error al ${isEditing ? 'actualizar' : 'crear'} cliente:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección 1: Información del Usuario */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información de Acceso
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          El cliente iniciará sesión con el nombre del negocio
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            name="nombre"
            label={clienteSchema.nombre.label}
            value={formData.nombre}
            onChange={handleChange}
            placeholder={clienteSchema.nombre.placeholder}
            error={errors.nombre}
            required={clienteSchema.nombre.required}
          />

          {!isEditing && (
            <Input
              name="password"
              type="password"
              label={clienteSchema.password.label}
              value={formData.password}
              onChange={handleChange}
              placeholder={clienteSchema.password.placeholder}
              error={errors.password}
              required={clienteSchema.password.required}
            />
          )}

          <Input
            name="telefono"
            type="tel"
            label={clienteSchema.telefono.label}
            value={formData.telefono}
            onChange={handleChange}
            placeholder={clienteSchema.telefono.placeholder}
            error={errors.telefono}
            required={clienteSchema.telefono.required}
            maxLength={9}
            pattern="[0-9]*"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Sección 2: Persona de Contacto */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Persona de Contacto
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Datos del encargado o responsable del negocio
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              name="nombreContacto"
              label={clienteSchema.nombreContacto.label}
              value={formData.nombreContacto}
              onChange={handleChange}
              placeholder={clienteSchema.nombreContacto.placeholder}
              error={errors.nombreContacto}
              required={clienteSchema.nombreContacto.required}
            />
          </div>

          <Input
            name="cargoContacto"
            label={clienteSchema.cargoContacto.label}
            value={formData.cargoContacto}
            onChange={handleChange}
            placeholder={clienteSchema.cargoContacto.placeholder}
            error={errors.cargoContacto}
            required={clienteSchema.cargoContacto.required}
          />

          <Input
            name="telefonoContacto"
            type="tel"
            label={clienteSchema.telefonoContacto.label}
            value={formData.telefonoContacto}
            onChange={handleChange}
            placeholder={clienteSchema.telefonoContacto.placeholder}
            error={errors.telefonoContacto}
            required={clienteSchema.telefonoContacto.required}
            maxLength={9}
            pattern="[0-9]*"
            inputMode="numeric"
          />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {clienteSchema.telefonoContacto.helpText}
        </p>
      </div>

      {/* Sección 3: Información Comercial */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Información Comercial
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Datos de ubicación y entrega
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              name="direccion"
              label={clienteSchema.direccion.label}
              value={formData.direccion}
              onChange={handleChange}
              placeholder={clienteSchema.direccion.placeholder}
              error={errors.direccion}
              required={clienteSchema.direccion.required}
            />
          </div>

          <Select
            name="ruta"
            label={clienteSchema.ruta.label}
            value={formData.ruta}
            onChange={handleChange}
            options={rutasOptions}
            error={errors.ruta}
            required={clienteSchema.ruta.required}
            placeholder={loadingRutas ? "Cargando rutas..." : "Selecciona una ruta"}
            disabled={loadingRutas}
          />
        </div>
      </div>

      {/* Sección 4: Precios por Producto */}
      <div className="border-b pb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Precios por Producto
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Asigna precios específicos para cada producto que este cliente puede comprar
        </p>

        <ProductPriceTable
          productos={productosExpandidos}
          preciosSeleccionados={preciosProductos}
          onChange={setPreciosProductos}
        />
      </div>

      {/* Sección 5: Configuración de Crédito */}
      <div className="pb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuración de Crédito
        </h3>

        {/* Alerta explicativa */}
        <div className={`mb-4 p-4 rounded-lg border-2 ${
          formData.diasCredito > 0
            ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
            : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
        }`}>
          {formData.diasCredito > 0 ? (
            <div className="text-green-800">
              <p className="font-semibold text-lg mb-2">Cliente Recurrente (puede pagar a crédito)</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>Cliente con historial de confianza</li>
                <li>Puede elegir entre pago al contado o a crédito</li>
                <li>Tiene <strong>{formData.diasCredito} días</strong> para pagar después de la entrega</li>
              </ul>
            </div>
          ) : (
            <div className="text-orange-800">
              <p className="font-semibold text-lg mb-2">Cliente NO Recurrente (solo pago al contado)</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>Cliente nuevo sin historial</li>
                <li>NO tiene aprobación de crédito</li>
                <li>Solo verá opción de pago al contado en pedidos</li>
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Input
            name="diasCredito"
            type="number"
            label={clienteSchema.diasCredito.label}
            value={formData.diasCredito}
            onChange={handleChange}
            placeholder={clienteSchema.diasCredito.placeholder}
            error={errors.diasCredito}
            required={clienteSchema.diasCredito.required}
            min={clienteSchema.diasCredito.min}
            max={clienteSchema.diasCredito.max}
          />

          <p className="text-xs text-gray-600 mt-2">
            {clienteSchema.diasCredito.helpText}
          </p>

          {formData.diasCredito > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-blue-800 font-medium">
                Ejemplo: Si se entregan pedidos con {formData.diasCredito} días de crédito
              </p>
              <div className="text-xs text-blue-700 space-y-1">
                {(() => {
                  const hoy = new Date()
                  const vencimiento = new Date(hoy)
                  vencimiento.setDate(hoy.getDate() + parseInt(formData.diasCredito))
                  return (
                    <>
                      <p>Pedido entregado el <strong>{hoy.toLocaleDateString('es-PE')}</strong></p>
                      <p>Fecha de vencimiento: <strong>{vencimiento.toLocaleDateString('es-PE')}</strong></p>
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || loading}
        >
          {isSubmitting
            ? (isEditing ? 'Guardando...' : 'Creando Cliente...')
            : (isEditing ? 'Guardar Cambios' : 'Crear Cliente')
          }
        </Button>
      </div>

      {/* Toast de notificaciones (solo si no hay callback onError externo) */}
      {!onError && toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </form>
  )
}

export default FormularioNuevoCliente
