import React from 'react'
import { BannerRecordatorio } from '@components/common'

const PedidosBanner = ({ estadoHorario }) => {
  if (!estadoHorario?.mostrarBanner) return null

  const titulo = estadoHorario.estado === 'proximo-a-cerrar'
    ? 'Próximo a cerrar'
    : estadoHorario.estado === 'fuera-de-horario'
    ? 'Horario cerrado'
    : 'Recordatorio'

  return (
    <BannerRecordatorio
      titulo={titulo}
      mensaje={estadoHorario.mensaje}
      variant={estadoHorario.tipo}
    />
  )
}

export default PedidosBanner
