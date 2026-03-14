import React from 'react'
import { Card, Button, Input, Select } from '@components/common'
import { ESTADOS_PEDIDO, ESTADOS_PEDIDO_LABELS } from '@utils/constants'

/**
 * Componente de filtros para la lista de pedidos
 *
 * NOTA: El filtro por sede se maneja globalmente mediante el SedeSelector
 * en el Navbar (para SUPERADMINISTRADOR). No se duplica aquí.
 */
const PedidosFiltros = ({
  filtroEstado,
  busqueda,
  onFiltroChange,
  onBusquedaChange,
  onLimpiar
}) => {
  const estadosOptions = Object.keys(ESTADOS_PEDIDO).map(key => ({
    value: ESTADOS_PEDIDO[key],
    label: ESTADOS_PEDIDO_LABELS[ESTADOS_PEDIDO[key]]
  }))

  const hayFiltrosActivos = !!filtroEstado || !!busqueda

  return (
    <Card>
      <div className="flex gap-4 items-center flex-wrap">
        <Input
          label="Buscar por Cliente"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Nombre del cliente..."
          className="w-64"
        />

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
