/**
 * Barrel export para hooks personalizados
 * Centraliza las exportaciones de hooks reutilizables
 */

// Hook para obtener el cliente del usuario actual
export { useClienteActual } from './useClienteActual'

// Hook para obtener información de horarios de rutas
export { useHorarioRuta } from './useHorarioRuta'

// Hook para gestionar medidas con APIs reales
export { useMeasures } from './useMeasures'

// Hook para gestionar comunicados con APIs reales (API-027, API-028, API-029, API-030)
export { useAnnouncements } from './useAnnouncements'

// Hook para gestionar pagos con APIs reales (API-025, API-026)
export { usePayments } from './usePayments'

// Hook para gestionar clientes con APIs reales (API-016)
export { useCustomers } from './useCustomers'

// Hook para gestionar perfil de usuario con APIs reales (API-075, API-076)
export { useProfile } from './useProfile'

// Hook para pedidos del cliente actual (API-006)
export { usePedidosCliente } from './usePedidosCliente'