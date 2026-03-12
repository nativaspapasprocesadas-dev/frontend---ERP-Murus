/**
 * useCustomers Hook
 * Hook para gestionar clientes con APIs reales
 *
 * APIs integradas:
 * - API-016: GET /api/v1/customers (listar clientes)
 * - API-017: GET /api/v1/customers/:id (detalle cliente)
 * - API-018: POST /api/v1/customers (crear cliente)
 * - API-019: PUT /api/v1/customers/:id (actualizar cliente)
 * - API-020: PATCH /api/v1/customers/:id/type (cambiar tipo cliente)
 *
 * Elementos relacionados: ELM-054, ELM-055, ELM-056, ELM-057, ELM-059
 */
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';

export const useCustomers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Monto global de alerta (desde configuración del sistema)
  const MONTO_ALERTA_GLOBAL = 20000;

  /**
   * Mapear respuesta del backend al formato del frontend
   */
  const mapFromAPI = useCallback((customer) => {
    // Usar totalDebt calculado dinámicamente (SUM CARGO - SUM ABONO) del backend
    // Si no está disponible, usar currentBalance como fallback
    const totalDeuda = customer.totalDebt ?? customer.currentBalance ?? 0;
    return {
      id: customer.id,
      nombre: customer.user?.name || customer.name || 'Sin nombre',
      email: customer.user?.email || customer.email || '',
      telefono: customer.user?.phone || customer.phone || '',
      direccion: customer.address || '',
      ruta: customer.routeId || null,
      rutaId: customer.routeId || null,
      rutaNombre: customer.route?.name || '',
      diasCredito: customer.creditDays || 0,
      saldoActual: totalDeuda,
      totalDeuda: totalDeuda,
      tipoCliente: customer.customerType || (customer.creditDays > 0 ? 'RECURRENTE' : 'NO_RECURRENTE'),
      activo: customer.isActive !== false,
      // Datos de contacto
      nombreContacto: customer.contactName || '',
      cargoContacto: customer.contactPosition || '',
      telefonoContacto: customer.contactPhone || '',
      // Alerta global: si supera monto de alerta
      superaMontoAlerta: totalDeuda >= MONTO_ALERTA_GLOBAL,
      tieneDeudaVencida: customer.hasOverdueDebt || false,
      // Resumen de creditos (conteos del backend)
      creditosPendientesCount: customer.pendingCreditsCount || 0,
      creditosVencidosCount: customer.overdueCreditsCount || 0,
      totalVencido: customer.overdueAmount || 0,
    };
  }, []);

  /**
   * API-016: Cargar clientes
   * GET /api/v1/customers
   */
  const fetchCustomers = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.pageSize !== undefined && filters.pageSize !== null) params.append('pageSize', filters.pageSize);
      if (filters.search) params.append('search', filters.search);
      if (filters.routeId) params.append('routeId', filters.routeId);
      if (filters.customerType) params.append('customerType', filters.customerType);
      if (filters.branchId) params.append('branchId', filters.branchId);

      const response = await apiClient.get(`/customers?${params.toString()}`);
      const customers = response.data.data || [];
      const mappedData = customers.map(mapFromAPI);
      setData(mappedData);

      return {
        success: true,
        data: mappedData,
        pagination: response.data.pagination,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al cargar clientes';
      setError(errorMessage);
      console.error('Error en fetchCustomers:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  /**
   * API-017: Obtener detalle de cliente por ID
   * GET /api/v1/customers/:id
   */
  const fetchCustomerById = useCallback(async (customerId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/customers/${customerId}`);
      const customer = mapFromAPI(response.data);

      return {
        success: true,
        data: customer,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al obtener cliente';
      setError(errorMessage);
      console.error('Error en fetchCustomerById:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  /**
   * API-018: Crear nuevo cliente
   * POST /api/v1/customers
   */
  const createCustomer = useCallback(async (customerData) => {
    setLoading(true);
    setError(null);

    try {
      // Mapear datos del formulario a formato API
      // Nota: El email se genera automáticamente en el backend
      const apiData = {
        name: customerData.nombre,
        phone: customerData.telefono,
        password: customerData.password,
        address: customerData.direccion,
        routeId: customerData.ruta ? parseInt(customerData.ruta) : null,
        creditDays: customerData.diasCredito ? parseInt(customerData.diasCredito) : 0,
        discountPercentage: customerData.descuentoPorcentaje ? parseFloat(customerData.descuentoPorcentaje) : 0,
        contactName: customerData.nombreContacto,
        contactPosition: customerData.cargoContacto,
        contactPhone: customerData.telefonoContacto,
      };

      const response = await apiClient.post('/customers', apiData);

      // Recargar lista completa
      await fetchCustomers({ pageSize: 0 });

      return {
        success: true,
        data: response.data,
        message: `Cliente "${customerData.nombre}" creado exitosamente`,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al crear cliente';
      setError(errorMessage);
      console.error('Error en createCustomer:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  /**
   * API-019: Actualizar cliente
   * PUT /api/v1/customers/:id
   */
  const updateCustomer = useCallback(async (customerId, customerData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put(`/customers/${customerId}`, customerData);

      // Actualizar lista local
      setData((prevData) =>
        prevData.map((c) =>
          c.id === customerId ? mapFromAPI(response.data) : c
        )
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar cliente';
      setError(errorMessage);
      console.error('Error en updateCustomer:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  /**
   * API-020: Cambiar tipo de cliente
   * PATCH /api/v1/customers/:id/type
   *
   * ELM-059: Toggle tipo cliente (RECURRENTE <-> NO_RECURRENTE)
   */
  const changeCustomerType = useCallback(async (customerId, customerType) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.patch(`/customers/${customerId}/type`, {
        customerType,
      });

      // Actualizar lista local
      setData((prevData) =>
        prevData.map((c) =>
          c.id === customerId ? mapFromAPI(response.data) : c
        )
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al cambiar tipo de cliente';
      setError(errorMessage);
      console.error('Error en changeCustomerType:', err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [mapFromAPI]);

  // NOTA: No se hace fetch automático al montar porque:
  // 1. El rol CLIENTE no tiene permisos para listar clientes (API-016 requiere ADMIN/COORDINADOR)
  // 2. Los componentes que necesiten clientes deben llamar explícitamente a fetchCustomers()
  // Esto evita errores 403 cuando el hook se usa en modales que se importan pero no se muestran

  /**
   * Obtener cliente por ID (desde cache local)
   */
  const getById = useCallback((id) => {
    return data.find((item) => item.id === id) || null;
  }, [data]);

  /**
   * Obtener clientes con deuda
   */
  const getWithDebt = useCallback(() => {
    return data.filter((customer) => customer.totalDeuda > 0);
  }, [data]);

  /**
   * Obtener clientes por ruta
   */
  const getByRoute = useCallback((routeId) => {
    return data.filter((customer) => customer.rutaId === routeId);
  }, [data]);

  return {
    // Estado
    data,
    clientesExpandidos: data, // Alias para compatibilidad con codigo existente
    loading,
    error,

    // Operaciones CRUD
    fetchCustomers,
    refresh: fetchCustomers,
    fetchCustomerById,
    createCustomer,
    createClienteConUsuario: createCustomer, // Alias para compatibilidad
    updateCustomer,
    update: updateCustomer, // Alias para compatibilidad
    changeCustomerType,

    // Helpers
    getById,
    getWithDebt,
    getByRoute,
  };
};
