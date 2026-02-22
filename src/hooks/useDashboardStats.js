/**
 * useDashboardStats Hook
 * Hook para obtener estadisticas reales del dashboard via API-004
 */
import { useState, useEffect } from 'react';
import DashboardService from '@services/DashboardService';

/**
 * Hook para obtener y manejar estadisticas del dashboard
 * @param {Object} params - Parametros opcionales
 * @param {string} params.branchId - ID de sede (opcional)
 * @param {boolean} params.enabled - Si debe ejecutar la peticion (default: true)
 * @returns {Object} { stats, loading, error, refetch }
 */
export const useDashboardStats = ({ branchId = null, enabled = true } = {}) => {
  const [stats, setStats] = useState({
    totalPedidosHoy: 0,
    totalVentasHoy: 0,
    pedidosPendientes: 0,
    clientesConDeuda: 0,
    alertasCredito: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await DashboardService.getDashboardStats({
        branchId
      });

      if (result.success) {
        setStats({
          totalPedidosHoy: result.data.totalPedidosHoy || 0,
          totalVentasHoy: result.data.totalVentasHoy || 0,
          pedidosPendientes: result.data.pedidosPendientes || 0,
          clientesConDeuda: result.data.clientesConDeuda || 0,
          alertasCredito: result.data.alertasCredito || 0
        });
      }
    } catch (err) {
      console.error('Error en useDashboardStats:', err);
      setError(err.error || 'Error al cargar estadisticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [branchId, enabled]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};

export default useDashboardStats;
