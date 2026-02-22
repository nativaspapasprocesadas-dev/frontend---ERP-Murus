import { useState } from 'react'
import { ESTADOS_RUTA } from '@utils/constants'

/**
 * Hook para gestión del modal de asignación de chofer
 */
export const useModalChofer = ({ update }) => {
  const [showModal, setShowModal] = useState(false)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [choferSeleccionado, setChoferSeleccionado] = useState('')

  const openModal = (ruta) => {
    setRutaSeleccionada(ruta)
    setChoferSeleccionado(ruta.choferId || '')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setRutaSeleccionada(null)
    setChoferSeleccionado('')
  }

  const confirmarEnvio = async () => {
    if (!choferSeleccionado) {
      alert('Debes seleccionar un chofer antes de enviar la ruta')
      return
    }

    const updates = {
      estado: ESTADOS_RUTA.ENVIADA,
      choferId: Number(choferSeleccionado),
      fechaEnvio: new Date().toISOString()
    }

    await update(rutaSeleccionada.id, updates)
    closeModal()
    alert('¡Ruta enviada exitosamente!')
  }

  return {
    modalChofer: {
      isOpen: showModal,
      ruta: rutaSeleccionada
    },
    choferSeleccionado,
    setChoferSeleccionado,
    openModal,
    closeModal,
    confirmarEnvio
  }
}
