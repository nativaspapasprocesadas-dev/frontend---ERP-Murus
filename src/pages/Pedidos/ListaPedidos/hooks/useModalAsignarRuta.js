import { useState } from 'react'
import { useRoutes } from '@hooks/useRoutes'
import { ESTADOS_PEDIDO } from '@utils/constants'
import { getLocalDate } from '@utils/dateUtils'

/**
 * Hook para gestión del modal de asignar ruta
 * Integrado con API-036 (GET /api/v1/routes)
 */
export const useModalAsignarRuta = ({ update, showToast }) => {
  const { rutas, getRutaById } = useRoutes()

  // Helper para buscar ruta por número y fecha
  const getRutaByNumeroYFecha = (numero, fecha) => {
    return rutas.find(r => r.numero === numero && r.fecha && r.fecha.startsWith(fecha))
  }

  const [modalAsignarRuta, setModalAsignarRuta] = useState({
    isOpen: false,
    pedidoId: null
  })
  const [rutaSeleccionada, setRutaSeleccionada] = useState('')

  const openModal = (pedidoId) => {
    setModalAsignarRuta({ isOpen: true, pedidoId })
    setRutaSeleccionada('')
  }

  const closeModal = () => {
    setModalAsignarRuta({ isOpen: false, pedidoId: null })
    setRutaSeleccionada('')
  }

  const confirmarAsignacion = async () => {
    if (!rutaSeleccionada) {
      showToast('Por favor selecciona una ruta', 'warning')
      return
    }

    const fechaHoy = getLocalDate()
    const rutaSeleccionadaObj = getRutaByNumeroYFecha(parseInt(rutaSeleccionada), fechaHoy)

    if (!rutaSeleccionadaObj) {
      showToast(
        `No se encontró la Ruta ${rutaSeleccionada} para el día de hoy. Por favor, verifica que la ruta esté creada.`,
        'warning'
      )
      return
    }

    await update(modalAsignarRuta.pedidoId, {
      estado: ESTADOS_PEDIDO.EN_PROCESO,
      rutaId: rutaSeleccionadaObj.id,
      rutaNumero: parseInt(rutaSeleccionada)
    })

    closeModal()
    showToast('Pedido asignado a ruta exitosamente', 'success')
  }

  return {
    modalAsignarRuta,
    rutaSeleccionada,
    setRutaSeleccionada,
    openModal,
    closeModal,
    confirmarAsignacion
  }
}
