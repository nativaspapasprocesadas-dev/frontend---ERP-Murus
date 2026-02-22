import React from 'react'
import { Card } from '@components/common'

const ObservationsField = ({ observaciones, setObservaciones }) => {
  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Observaciones</h3>
      <textarea
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Notas adicionales sobre la entrega (opcional)..."
        rows={3}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        maxLength={500}
      />
      <p className="text-xs text-gray-500 mt-1">
        {observaciones.length}/500 caracteres
      </p>
    </Card>
  )
}

export default ObservationsField
