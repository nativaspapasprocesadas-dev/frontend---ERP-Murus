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
  return (
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
  )
}

export default PedidosStats
