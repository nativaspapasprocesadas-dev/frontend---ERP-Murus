import React from 'react'
import { Card, Button, Select } from '@components/common'
import { ESTADOS_PEDIDO, ESTADOS_PEDIDO_LABELS } from '@utils/constants'

/**
 * Componente de filtros para la lista de pedidos
 *
 * NOTA: El filtro por sede se maneja globalmente mediante el SedeSelector
 * en el Navbar (para SUPERADMINISTRADOR). No se duplica aquí.
 */
const PedidosFiltros = ({
  filtroEstado,
  onFiltroChange,
  onLimpiar
}) => {
  const estadosOptions = Object.keys(ESTADOS_PEDIDO).map(key => ({
    value: ESTADOS_PEDIDO[key],
    label: ESTADOS_PEDIDO_LABELS[ESTADOS_PEDIDO[key]]
  }))

  const hayFiltrosActivos = !!filtroEstado

  return (
    <Card>
      <div className="flex gap-4 items-center flex-wrap">
        <Select
          label="Filtrar por Estado"
          value={filtroEstado}
          onChange={(e) => onFiltroChange(e.target.value)}
          options={estadosOptions}
          placeholder="Todos los estados"
          className="w-64"
        />

        {hayFiltrosActivos && (
          <Button variant="secondary" onClick={onLimpiar}>
            Limpiar Filtros
          </Button>
        )}
      </div>
    </Card>
  )
}

export default PedidosFiltros
