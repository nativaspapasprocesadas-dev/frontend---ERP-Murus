import React from 'react'
import { Card } from '@components/common'

const StatCard = ({ title, value, icon, borderColor, textColor }) => (
  <Card className={`border-l-4 ${borderColor}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-2xl font-bold ${textColor || ''}`}>{value}</p>
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </Card>
)

const PedidosStats = ({ stats }) => {
  const tieneDespachoNoRuta = (stats.despachoTaxi || 0) + (stats.despachoRecojo || 0) + (stats.despachoOtro || 0) > 0

  return (
    <div className="space-y-4">
      {/* Fila 1: Contadores por estado */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon="📦"
          borderColor="border-blue-500"
        />
        <StatCard
          title="Pendientes"
          value={stats.pendientes}
          icon="⏳"
          borderColor="border-yellow-500"
          textColor="text-yellow-600"
        />
        <StatCard
          title="En Proceso"
          value={stats.enProceso}
          icon="🚀"
          borderColor="border-purple-500"
          textColor="text-purple-600"
        />
        <StatCard
          title="Completados"
          value={stats.completados}
          icon="✅"
          borderColor="border-green-500"
          textColor="text-green-600"
        />
      </div>

      {/* Fila 2: Contadores por tipo de despacho */}
      {(tieneDespachoNoRuta || stats.despachoRuta > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          <StatCard
            title="Despacho en Ruta"
            value={stats.despachoRuta || 0}
            icon="🚚"
            borderColor="border-blue-400"
            textColor="text-blue-600"
          />
          <StatCard
            title="Sin Ruta"
            value={(stats.despachoTaxi || 0) + (stats.despachoRecojo || 0) + (stats.despachoOtro || 0)}
            icon="📋"
            borderColor="border-amber-500"
            textColor="text-amber-600"
          />
        </div>
      )}
    </div>
  )
}

export default PedidosStats
