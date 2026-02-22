/**
 * usePayments Hook
 * Hook para gestionar pagos con APIs reales
 * Integración: ELM-101, API-025 (POST /payments), API-026 (GET /payments)
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { getLocalDateTime } from '@utils/dateUtils';

export const usePayments = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Mapear respuesta del backend al formato del frontend
   * Backend usa: customer, amount, paymentMethod, reference, createdAt
   * Frontend usa: clienteId, monto, metodoPago, fechaPago, nombreCliente
   */
  const mapFromAPI = useCallback((payment) => {
    return {
      id: payment.id,
      clienteId: payment.customerId || payment.customer?.id,
      nombreCliente: payment.customer?.name || 'Desconocido',
      monto: payment.amount,
      metodoPago: payment.paymentMethod,
      referencia: payment.reference || '',
      notas: payment.notes || '',
      fechaPago: payment.createdAt,
      fechaCreacion: payment.createdAt,
      registradoPor: payment.userId || null,
      registradoPorNombre: payment.user?.name || 'Sistema',
      registradoPorRol: payment.user?.role || '',
      firma: payment.signature || null,
    };
  }, []);

  /**
   * Mapear datos del frontend al formato del backend
   */
  const mapToAPI = useCallback((formData) => {
    return {
      customerId: formData.clienteId || formData.customerId,
      amount: parseFloat(formData.monto || formData.amount),
      paymentMethod: formData.metodoPago || formData.paymentMethod,
      reference: formData.referencia || formData.reference || '',
      notes: formData.notas || formData.notes || '',
    };
  }, []);

  /**
   * Cargar historial de pagos - API-026
   * GET /api/v1/payments
   */
  const fetchPayments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize) params.append('pageSize', filters.pageSize);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await apiClient.get(`/payments?${params.toString()}`);
      const payments = response.data.data || [];
      setData(payments.map(mapFromAPI));

      return {
        success: true,
        data: payments.map(mapFromAPI),
        pagination: response.data.pagination,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar pagos';
      setError(errorMessage);
      console.error('Error en fetchPayments:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  // Cargar pagos al montar el componente
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  /**
   * Registrar nuevo pago - API-025
   * POST /api/v1/payments
   */
  const create = useCallback(async (formData, additionalData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...mapToAPI(formData),
        // Incluir firma digital si existe en additionalData
        signature: additionalData.firma || null,
      };
      const response = await apiClient.post('/payments', payload);

      // Crear el nuevo pago con datos completos para mostrar inmediatamente
      const newPayment = {
        id: response.data.id,
        clienteId: response.data.customerId,
        monto: response.data.amount,
        creditMovementId: response.data.creditMovementId,
        newBalance: response.data.newBalance,
        metodoPago: payload.paymentMethod,
        notas: payload.notes || '',
        referencia: payload.reference || '',
        fechaPago: getLocalDateTime(),
        fechaCreacion: getLocalDateTime(),
        // Datos adicionales pasados desde el componente
        nombreCliente: additionalData.nombreCliente || 'Cargando...',
        registradoPorNombre: additionalData.registradoPorNombre || 'Sistema',
        registradoPorRol: additionalData.registradoPorRol || '',
        firma: additionalData.firma || null,
      };

      setData((prev) => [newPayment, ...prev]);

      // Refrescar la lista para obtener los datos completos del servidor
      // Esto se hace en segundo plano para no bloquear la UI
      setTimeout(() => {
        fetchPayments();
      }, 500);

      return {
        success: true,
        data: newPayment,
        creditMovementId: response.data.creditMovementId,
        newBalance: response.data.newBalance,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al registrar pago';
      setError(errorMessage);
      console.error('Error en create payment:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapToAPI, fetchPayments]);

  /**
   * Obtener pago por ID
   */
  const getById = useCallback((id) => {
    return data.find((item) => item.id === id) || null;
  }, [data]);

  /**
   * Filtrar pagos por cliente
   */
  const filterByCustomer = useCallback((customerId) => {
    return data.filter((payment) => payment.clienteId === customerId);
  }, [data]);

  /**
   * Obtener total de pagos en un rango de fechas
   */
  const getTotalByDateRange = useCallback((dateFrom, dateTo) => {
    const filtered = data.filter((payment) => {
      const paymentDate = new Date(payment.fechaPago);
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;

      if (from && paymentDate < from) return false;
      if (to && paymentDate > to) return false;
      return true;
    });

    return filtered.reduce((sum, payment) => sum + payment.monto, 0);
  }, [data]);

  return {
    data,
    loading,
    error,
    create,
    getById,
    filterByCustomer,
    getTotalByDateRange,
    refresh: fetchPayments,
  };
};
