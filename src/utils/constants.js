// ============================================
// ROLES DE USUARIO
// ============================================
export const ROLES = {
  SUPERADMINISTRADOR: 'superadministrador',
  ADMINISTRADOR: 'administrador',
  COORDINADOR: 'coordinador',
  CLIENTE: 'cliente',
  PRODUCCION: 'produccion'
}

// Roles con acceso multi-sede
export const ROLES_MULTI_SEDE = [
  ROLES.SUPERADMINISTRADOR
]

// IDs de roles en la base de datos (según seed.js)
export const ROLE_IDS = {
  administrador: 1,
  superadministrador: 2,
  coordinador: 3,
  produccion: 4,
  cliente: 5
}

// Mapeo inverso: ID -> nombre de rol
export const ROLE_NAMES_BY_ID = {
  1: 'administrador',
  2: 'superadministrador',
  3: 'coordinador',
  4: 'produccion',
  5: 'cliente'
}

// Labels para mostrar roles
export const ROLES_LABELS = {
  [ROLES.SUPERADMINISTRADOR]: 'Super Administrador',
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.COORDINADOR]: 'Coordinador',
  [ROLES.PRODUCCION]: 'Producción',
  [ROLES.CLIENTE]: 'Cliente'
}

// ============================================
// ESTADOS DE PEDIDOS
// Alineados con valores del backend (tabla pedidos.estado)
// ============================================
export const ESTADOS_PEDIDO = {
  PENDIENTE: 'pendiente',
  EN_PROCESO: 'en_proceso',
  COMPLETADO: 'completado',
  CANCELADO: 'cancelado'
}

export const ESTADOS_PEDIDO_LABELS = {
  [ESTADOS_PEDIDO.PENDIENTE]: 'Pendiente',
  [ESTADOS_PEDIDO.EN_PROCESO]: 'En Proceso',
  [ESTADOS_PEDIDO.COMPLETADO]: 'Completado',
  [ESTADOS_PEDIDO.CANCELADO]: 'Cancelado'
}

export const ESTADOS_PEDIDO_COLORS = {
  [ESTADOS_PEDIDO.PENDIENTE]: 'warning',
  [ESTADOS_PEDIDO.EN_PROCESO]: 'info',
  [ESTADOS_PEDIDO.COMPLETADO]: 'success',
  [ESTADOS_PEDIDO.CANCELADO]: 'danger'
}

// ============================================
// ESTADOS DE RUTAS
// Frontend usa: 'abierta', 'enviada', 'completada'
// Backend usa: 'pendiente', 'en_curso', 'completada'
// El hook useRoutes normaliza automáticamente
// ============================================
export const ESTADOS_RUTA = {
  ABIERTA: 'abierta',      // Backend: 'pendiente'
  ENVIADA: 'enviada',      // Backend: 'en_curso'
  COMPLETADA: 'completada' // Backend: 'completada'
}

export const ESTADOS_RUTA_LABELS = {
  [ESTADOS_RUTA.ABIERTA]: 'Abierta',
  [ESTADOS_RUTA.ENVIADA]: 'Enviada',
  [ESTADOS_RUTA.COMPLETADA]: 'Completada'
}

export const ESTADOS_RUTA_COLORS = {
  [ESTADOS_RUTA.ABIERTA]: 'warning',
  [ESTADOS_RUTA.ENVIADA]: 'info',
  [ESTADOS_RUTA.COMPLETADA]: 'success'
}

// ============================================
// NÚMEROS DE RUTAS
// ============================================
export const RUTAS = {
  SIN_RUTA: 0, // Para pedidos adicionales sin ruta
  RUTA_1: 1,
  RUTA_2: 2,
  RUTA_3: 3
}

export const RUTAS_COLORES = {
  [RUTAS.SIN_RUTA]: '#FBBF24', // Amarillo/Dorado Murus para S/R
  [RUTAS.RUTA_1]: '#14B8A6', // Turquesa Murus
  [RUTAS.RUTA_2]: '#F97316', // Naranja Murus
  [RUTAS.RUTA_3]: '#10b981'  // Verde Murus
}

// ============================================
// TIPOS DE PEDIDO
// ============================================
export const TIPOS_PEDIDO = {
  NORMAL: 'normal',
  ADICIONAL: 'adicional'
}

export const TIPOS_PEDIDO_LABELS = {
  [TIPOS_PEDIDO.NORMAL]: 'Normal',
  [TIPOS_PEDIDO.ADICIONAL]: 'Adicional'
}

export const TIPOS_PEDIDO_COLORS = {
  [TIPOS_PEDIDO.NORMAL]: 'info',
  [TIPOS_PEDIDO.ADICIONAL]: 'warning'
}

// ============================================
// MÉTODOS DE ENTREGA (Para pedidos)
// Valores deben coincidir con backend: 'DELIVERY' o 'RECOJO'
// ============================================
export const METODOS_ENTREGA = {
  DELIVERY: 'DELIVERY',
  RECOJO: 'RECOJO'
}

export const METODOS_ENTREGA_LABELS = {
  [METODOS_ENTREGA.DELIVERY]: 'Delivery (Entrega a domicilio)',
  [METODOS_ENTREGA.RECOJO]: 'Recojo en Planta'
}

// ============================================
// TIPOS DE DESPACHO (campo tipo_despacho en pedidos)
// Valores alineados con backend: RUTA, TAXI, RECOJO, OTRO
// ============================================
export const TIPOS_DESPACHO = {
  RUTA: 'RUTA',
  TAXI: 'TAXI',
  RECOJO: 'RECOJO',
  OTRO: 'OTRO'
}

export const TIPOS_DESPACHO_LABELS = {
  [TIPOS_DESPACHO.RUTA]: 'Ruta Propia',
  [TIPOS_DESPACHO.TAXI]: 'Taxi/Externo',
  [TIPOS_DESPACHO.RECOJO]: 'Recojo en Planta',
  [TIPOS_DESPACHO.OTRO]: 'Otro'
}

export const TIPOS_DESPACHO_COLORS = {
  [TIPOS_DESPACHO.RUTA]: 'info',
  [TIPOS_DESPACHO.TAXI]: 'warning',
  [TIPOS_DESPACHO.RECOJO]: 'success',
  [TIPOS_DESPACHO.OTRO]: 'default'
}

export const TIPOS_DESPACHO_ICONS = {
  [TIPOS_DESPACHO.RUTA]: '🚚',
  [TIPOS_DESPACHO.TAXI]: '🚕',
  [TIPOS_DESPACHO.RECOJO]: '🏪',
  [TIPOS_DESPACHO.OTRO]: '📦'
}

// ============================================
// TIPOS DE PAGO
// ============================================
export const TIPOS_PAGO = {
  CONTADO: 'CONTADO',
  CREDITO: 'CREDITO'
}

export const TIPOS_PAGO_LABELS = {
  [TIPOS_PAGO.CONTADO]: 'Contado',
  [TIPOS_PAGO.CREDITO]: 'Crédito'
}

// ============================================
// ESTADOS DE PAGO ANTICIPADO
// ============================================
export const ESTADOS_PAGO_ANTICIPADO = {
  NO_PAGADO: 'no_pagado',
  PAGADO_ANTICIPADO: 'pagado_anticipado'
}

// ============================================
// TIPOS DE MOVIMIENTO DE CRÉDITO
// ============================================
export const TIPOS_MOVIMIENTO = {
  CARGO: 'CARGO',
  ABONO: 'ABONO',
  SALDO_INICIAL: 'SALDO_INICIAL'
}

export const TIPOS_MOVIMIENTO_LABELS = {
  [TIPOS_MOVIMIENTO.CARGO]: 'Cargo',
  [TIPOS_MOVIMIENTO.ABONO]: 'Abono',
  [TIPOS_MOVIMIENTO.SALDO_INICIAL]: 'Saldo Inicial'
}

export const TIPOS_MOVIMIENTO_COLORS = {
  [TIPOS_MOVIMIENTO.CARGO]: 'danger',
  [TIPOS_MOVIMIENTO.ABONO]: 'success',
  [TIPOS_MOVIMIENTO.SALDO_INICIAL]: 'warning'
}

// ============================================
// TIPOS DE MEDIDA (CORTE)
// ============================================
export const TIPOS_MEDIDA = {
  TUBO: 'tubo',
  HOJUELA: 'hojuela',
  ENTERA: 'entera',
  BASTON_LISO: 'baston_liso',
  GAJO: 'gajo'
}

export const TIPOS_MEDIDA_LABELS = {
  [TIPOS_MEDIDA.TUBO]: 'Tubo',
  [TIPOS_MEDIDA.HOJUELA]: 'Hojuela',
  [TIPOS_MEDIDA.ENTERA]: 'Entera',
  [TIPOS_MEDIDA.BASTON_LISO]: 'Bastón Liso',
  [TIPOS_MEDIDA.GAJO]: 'Gajo'
}

// ============================================
// MÉTODOS DE PAGO
// ============================================
export const METODOS_PAGO = {
  EFECTIVO: 'EFECTIVO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  DEPOSITO: 'DEPOSITO',
  YAPE: 'YAPE',
  PLIN: 'PLIN'
}

export const METODOS_PAGO_LABELS = {
  [METODOS_PAGO.EFECTIVO]: 'Efectivo',
  [METODOS_PAGO.TRANSFERENCIA]: 'Transferencia',
  [METODOS_PAGO.DEPOSITO]: 'Depósito',
  [METODOS_PAGO.YAPE]: 'Yape',
  [METODOS_PAGO.PLIN]: 'Plin'
}

// ============================================
// FORMATOS Y CONFIGURACIONES
// ============================================
export const FORMATO_MONEDA = 'S/.'

// ============================================
// CONFIGURACIÓN DE CLIENTES
// ============================================
export const CONFIG_CLIENTES = {
  DIAS_CREDITO_DEFAULT: 15, // Días de crédito por defecto para clientes recurrentes
  DIAS_CREDITO_NO_RECURRENTE: 0 // Clientes no recurrentes = sin crédito
}

export const TIPO_CLIENTE = {
  RECURRENTE: 'RECURRENTE',
  NO_RECURRENTE: 'NO_RECURRENTE'
}

export const TIPO_CLIENTE_LABELS = {
  [TIPO_CLIENTE.RECURRENTE]: 'Cliente Recurrente',
  [TIPO_CLIENTE.NO_RECURRENTE]: 'Cliente No Recurrente'
}

export const TIPO_CLIENTE_COLORS = {
  [TIPO_CLIENTE.RECURRENTE]: 'success',
  [TIPO_CLIENTE.NO_RECURRENTE]: 'warning'
}

export const TIPO_CLIENTE_EMOJIS = {
  [TIPO_CLIENTE.RECURRENTE]: '✅',
  [TIPO_CLIENTE.NO_RECURRENTE]: '⭕'
}

// ============================================
// PRIORIDADES DE COMUNICADOS
// ============================================
export const PRIORIDADES_COMUNICADO = {
  ALTA: 'ALTA',
  MEDIA: 'MEDIA',
  BAJA: 'BAJA'
}

export const PRIORIDADES_COMUNICADO_LABELS = {
  [PRIORIDADES_COMUNICADO.ALTA]: 'Alta Prioridad',
  [PRIORIDADES_COMUNICADO.MEDIA]: 'Media Prioridad',
  [PRIORIDADES_COMUNICADO.BAJA]: 'Baja Prioridad'
}

export const PRIORIDADES_COMUNICADO_COLORS = {
  [PRIORIDADES_COMUNICADO.ALTA]: 'danger',
  [PRIORIDADES_COMUNICADO.MEDIA]: 'warning',
  [PRIORIDADES_COMUNICADO.BAJA]: 'info'
}

export const PRIORIDADES_COMUNICADO_EMOJIS = {
  [PRIORIDADES_COMUNICADO.ALTA]: '🔴',
  [PRIORIDADES_COMUNICADO.MEDIA]: '🟡',
  [PRIORIDADES_COMUNICADO.BAJA]: '🔵'
}

// ============================================
// ESTADOS DE PAGO (Para pedidos NO_RECURRENTE con voucher)
// ============================================
export const ESTADOS_PAGO = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO'
}

export const ESTADOS_PAGO_LABELS = {
  [ESTADOS_PAGO.PENDIENTE]: 'Pendiente',
  [ESTADOS_PAGO.APROBADO]: 'Aprobado',
  [ESTADOS_PAGO.RECHAZADO]: 'Rechazado'
}

export const ESTADOS_PAGO_COLORS = {
  [ESTADOS_PAGO.PENDIENTE]: 'warning',
  [ESTADOS_PAGO.APROBADO]: 'success',
  [ESTADOS_PAGO.RECHAZADO]: 'danger'
}

// ============================================
// ENTIDADES COMENTABLES
// ============================================
export const ENTIDADES_COMENTABLES = {
  PEDIDO: 'pedido',
  RUTA: 'ruta',
  PRODUCCION: 'produccion',
  CLIENTE: 'cliente'
}

// ============================================
// PERMISOS POR ROL
// ============================================
export const PERMISOS = {
  [ROLES.SUPERADMINISTRADOR]: {
    canManageSedes: true,
    canCreateUsers: true,
    canCreateClientes: true,
    canCreateProducts: true,
    canManagePrices: true,
    canViewAllOrders: true,
    canAssignRoutes: true,
    canManageCredits: true,
    canRegisterPayments: true,
    canViewReports: true,
    canExportPDF: true,
    canViewProduction: true,
    canMarkAsCompleted: true,
    canConfigureAlerts: true,
    canCommentOnPedidos: true,
    canCommentOnRutas: true,
    canCommentOnProduccion: true,
    canCommentOnClientes: true,
    canViewAllSedes: true
  },
  [ROLES.ADMINISTRADOR]: {
    canCreateUsers: true,
    canCreateClientes: true,
    canCreateProducts: true,
    canManagePrices: true,
    canViewAllOrders: true,
    canAssignRoutes: true,
    canManageCredits: true,
    canRegisterPayments: true,
    canViewReports: true,
    canExportPDF: true,
    canViewProduction: true,
    canMarkAsCompleted: true,
    canConfigureAlerts: true,
    canCommentOnPedidos: true,
    canCommentOnRutas: true,
    canCommentOnProduccion: true,
    canCommentOnClientes: true
  },
  [ROLES.COORDINADOR]: {
    canCreateUsers: false,
    canCreateClientes: true,
    canCreateProducts: false,
    canManagePrices: false,
    canViewAllOrders: true,
    canAssignRoutes: true,
    canManageCredits: true,
    canRegisterPayments: true,
    canViewReports: false,
    canExportPDF: true,
    canViewProduction: false,
    canMarkAsCompleted: false,
    canConfigureAlerts: false,
    canCommentOnPedidos: false,
    canCommentOnRutas: true,
    canCommentOnProduccion: false,
    canCommentOnClientes: true
  },
  [ROLES.PRODUCCION]: {
    canCreateUsers: false,
    canCreateProducts: false,
    canManagePrices: false,
    canViewAllOrders: true,
    canAssignRoutes: false,
    canManageCredits: false,
    canRegisterPayments: false,
    canViewReports: false,
    canExportPDF: false,
    canViewProduction: true,
    canMarkAsCompleted: true,
    canConfigureAlerts: false,
    canCommentOnPedidos: true,
    canCommentOnRutas: false,
    canCommentOnProduccion: true,
    canCommentOnClientes: false
  },
  [ROLES.CLIENTE]: {
    canCreateUsers: false,
    canCreateClientes: false,
    canCreateProducts: false,
    canManagePrices: false,
    canViewAllOrders: false,
    canAssignRoutes: false,
    canManageCredits: false,
    canRegisterPayments: false,
    canViewReports: false,
    canExportPDF: false,
    canViewProduction: false,
    canMarkAsCompleted: false,
    canConfigureAlerts: false,
    canCommentOnPedidos: false,
    canCommentOnRutas: false,
    canCommentOnProduccion: false,
    canCommentOnClientes: false
  }
}
