import React from 'react'
import { Button, SedeIndicator } from '@components/common'

const RutasHeader = ({ onConfiguracion }) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">Rutas</h1>
          <SedeIndicator size="sm" />
        </div>
        <p className="text-gray-600 mt-1">Gestiona las rutas de distribución</p>
      </div>
      <Button variant="primary" onClick={onConfiguracion}>
        ⚙️ Configurar Rutas
      </Button>
    </div>
  )
}

export default RutasHeader
