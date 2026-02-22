import React from 'react'
import { Card } from '@components/common'
import { ROLES } from '@utils/constants'
import { formatearMoneda } from '@utils/formatters'

const ClientInfo = ({ cliente, isRole }) => {
  if (!cliente) return null

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Información del Cliente</h3>
      <div className={`grid grid-cols-1 ${(isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR)) ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        <div>
          <p className="text-sm text-gray-600">Cliente</p>
          <p className="font-semibold">{cliente.nombre}</p>
        </div>
        {/* Mostrar ruta solo para roles administrativos */}
        {(isRole(ROLES.ADMINISTRADOR) || isRole(ROLES.COORDINADOR)) && (
          <div>
            <p className="text-sm text-gray-600">Ruta Asignada</p>
            <p className="font-semibold text-blue-600">{cliente.rutaLabel || `Ruta ${cliente.ruta}`}</p>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-600">Días de Crédito</p>
          <p className="font-semibold text-blue-600">{cliente.diasCredito || 15} días</p>
        </div>
      </div>
      {cliente?.totalDeuda > 0 && (
        <div className="mt-4 p-3 bg-amber-50 rounded border-l-4 border-amber-400">
          <p className="text-sm">
            <span className="font-semibold">Deuda actual:</span> {formatearMoneda(cliente.totalDeuda)}
            {cliente.tieneDeudaVencida && (
              <span className="ml-2 text-red-600 font-semibold">⚠️ Tiene deuda vencida</span>
            )}
          </p>
        </div>
      )}
    </Card>
  )
}

export default ClientInfo
