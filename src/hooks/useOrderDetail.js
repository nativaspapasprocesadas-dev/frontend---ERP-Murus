/**
 * useOrderDetail - Hook personalizado para obtener detalle de pedido
 * Consume API-008 GET /api/v1/orders/:id via OrdersService
 *
 * NOTA IMPORTANTE: La respuesta actual del backend NO incluye toda la informacion
 * que el frontend DetallePedido.jsx espera (fotoUrl, especie, medida, kilosPorBolsa, etc.)
 * Este hook hace el mejor mapeo posible con los datos disponibles.
 *
 * DESALINEAMIENTO DOCUMENTADO:
 * - Backend retorna: items[].productName, productCode, quantity, unitPrice, subtotal
 * - Frontend espera: detallesOriginales[].fotoUrl, especie, medida, kilosPorBolsa, totalKilos, precioKg
 * - NO existe flag tieneAdiciones ni array adiciones separado en backend actual
 *
 * Se requiere ampliar API-008 o crear API específica para incluir detalles expandidos.
 */

import { useState, useEffect } from 'react'
import { getOrderById } from '@/services/OrdersService'

// Construir URL base del backend para archivos estáticos (sin /api/v1)
const getBackendBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4020/api/v1'
  // Remover /api/v1 para obtener la URL base del servidor
  return apiUrl.replace(/\/api\/v\d+$/, '')
}

// Construir URL completa para archivos del backend
const buildFileUrl = (relativePath) => {
  if (!relativePath) return null
  // Si ya es una URL absoluta, retornarla
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath
  }
  // Construir URL completa
  const baseUrl = getBackendBaseUrl()
  return `${baseUrl}${relativePath}`
}

export const useOrderDetail = (orderId) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = await getOrderById(orderId)

        // Mapeo con datos disponibles del backend
        const mappedOrder = {
          id: data.id,
          correlativoSede: data.correlativoSede,
          branchId: data.branchId,
          branchCode: data.branchCode,
          numero: data.numero,
          fecha: data.fecha,
          estado: data.estado,
          tipoPedido: data.tipoPedido || 'normal',
          tipoPago: data.tipoPago,
          observaciones: data.observaciones,

          // Cliente
          nombreCliente: data.nombreCliente || 'Sin nombre',
          emailCliente: data.emailCliente,
          direccionCliente: data.direccionCliente,
          telefonoCliente: data.telefonoCliente,
          customerId: data.customerId,
          tipoCliente: data.tipoCliente,

          // Items del pedido con información completa
          detallesOriginales: (data.detalles || []).map(item => ({
            id: item.id,
            productoId: item.productoId,
            nombreProducto: item.nombreProducto,
            codigoProducto: item.codigoProducto,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.subtotal,
            fotoUrl: item.imagenUrl || null,
            especie: { nombre: item.especieNombre || 'N/A' },
            medida: { nombre: item.medidaNombre || 'N/A' },
            kilosPorBolsa: item.kilosPorBolsa || 0,
            totalKilos: item.totalKilos || 0,
            precioKg: (item.kilosPorBolsa > 0) ? (item.precioUnitario / item.kilosPorBolsa) : item.precioUnitario
          })),

          // Adiciones - NO disponibles en backend actual
          adiciones: [],
          tieneAdiciones: false,

          // Totales
          subtotal: data.subtotal || 0,
          totalMonto: data.total || 0,
          totalKilos: data.totalKilos || 0,
          cantidadProductos: (data.detalles || []).length,

          // Ruta
          rutaDiariaId: data.rutaDiariaId,
          rutaNombre: data.rutaNombre,
          rutaNumero: null, // TODO: mapear si existe

          // Campos adicionales para compatibilidad
          diasCredito: data.diasCredito || null,
          fechaEntrega: data.fechaEntrega || null,
          creadoPorNombre: 'Sistema', // TODO: ampliar backend
          pagadoAnticipado: data.pagadoAnticipado || false,

          // Informacion de voucher y pago
          // Construir URL completa para el voucher (archivos están en el backend)
          voucherUrl: buildFileUrl(data.voucherUrl),
          estadoPago: data.estadoPago || null,

          cliente: data.customerId ? {
            descuento: 0 // TODO: ampliar backend
          } : null
        }

        setOrder(mappedOrder)
      } catch (err) {
        console.error('[useOrderDetail] Error:', err)
        setError(err.message || 'Error al cargar el pedido')
        setOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  return {
    order,
    loading,
    error,
    refetch: () => {
      if (orderId) {
        const fetchOrder = async () => {
          setLoading(true)
          try {
            const data = await getOrderById(orderId)
            // (mismo mapeo)
          } catch (err) {
            setError(err.message)
          } finally {
            setLoading(false)
          }
        }
        fetchOrder()
      }
    }
  }
}

export default useOrderDetail
