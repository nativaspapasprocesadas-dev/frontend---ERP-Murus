import { useState } from 'react'

/**
 * Hook para gestión del modal de alerta de modificación (clientes)
 */
export const useModalAlerta = () => {
  const [modalAlertaModificacion, setModalAlertaModificacion] = useState({
    isOpen: false,
    pedidoId: null
  })

  const openModal = (pedidoId) => {
    setModalAlertaModificacion({ isOpen: true, pedidoId })
  }

  const closeModal = () => {
    setModalAlertaModificacion({ isOpen: false, pedidoId: null })
  }

  return {
    modalAlertaModificacion,
    openModal,
    closeModal
  }
}
