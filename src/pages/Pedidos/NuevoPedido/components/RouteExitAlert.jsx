import React from 'react'
import { Card } from '@components/common'

const RouteExitAlert = () => {
  return (
    <Card className="border-l-4 border-blue-500">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-blue-900 font-bold text-base mb-2">
              ℹ️ Información
            </h4>
            <p className="text-blue-800 text-sm leading-relaxed">
              Tu pedido será incluido en la ruta del día de hoy y será entregado en el horario habitual.
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default RouteExitAlert
