import { useState } from 'react'
import { generarRutaPDFRepartidor, generarRutaPDFCompleto } from '@services/pdfGenerator'

/**
 * Hook para gestión del modal de exportación de ruta
 * INTEGRADO CON API REAL - getPedidosDeRuta es async
 *
 * @param {Object} params
 * @param {Function} params.getPedidosDeRuta - Función para obtener pedidos de una ruta
 * @param {Function} params.getChoferById - Función para obtener datos del chofer
 * @param {Object} params.colores - Colores por número de ruta
 * @param {Object} params.labels - Labels para estados
 * @param {Object} params.empresaConfig - Configuración de empresa para PDFs
 */
export const useModalExportacion = ({ getPedidosDeRuta, getChoferById, colores, labels, empresaConfig }) => {
  const [showModal, setShowModal] = useState(false)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [pedidosConMonto, setPedidosConMonto] = useState({})
  const [pedidosRuta, setPedidosRuta] = useState([])
  const [loadingPedidos, setLoadingPedidos] = useState(false)

  const openModal = async (ruta) => {
    setRutaSeleccionada(ruta)
    setShowModal(true)
    setLoadingPedidos(true)

    try {
      // Cargar pedidos de la ruta desde API (async)
      const pedidos = await getPedidosDeRuta(ruta.id)
      setPedidosRuta(pedidos)

      // Inicializar todos los pedidos con monto visible por defecto
      const estadoInicial = {}
      pedidos.forEach(p => {
        estadoInicial[p.id] = true
      })
      setPedidosConMonto(estadoInicial)
    } catch (error) {
      console.error('Error cargando pedidos de ruta:', error)
      setPedidosRuta([])
    } finally {
      setLoadingPedidos(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setRutaSeleccionada(null)
    setPedidosConMonto({})
    setPedidosRuta([])
  }

  const toggleMostrarMonto = (pedidoId) => {
    setPedidosConMonto(prev => ({
      ...prev,
      [pedidoId]: !prev[pedidoId]
    }))
  }

  const exportarRepartidor = () => {
    if (!rutaSeleccionada) return

    if (!empresaConfig) {
      console.error('No se puede generar PDF: configuración de empresa no disponible')
      return
    }

    const chofer = rutaSeleccionada.choferId
      ? getChoferById(rutaSeleccionada.choferId)
      : null

    generarRutaPDFRepartidor({
      ruta: rutaSeleccionada,
      pedidos: pedidosRuta,
      pedidosConMonto,
      chofer,
      colores,
      labels,
      empresaConfig
    })

    closeModal()
  }

  const exportarCompleto = () => {
    if (!rutaSeleccionada) return

    if (!empresaConfig) {
      console.error('No se puede generar PDF: configuración de empresa no disponible')
      return
    }

    generarRutaPDFCompleto({
      ruta: rutaSeleccionada,
      pedidos: pedidosRuta,
      colores,
      labels,
      empresaConfig
    })

    closeModal()
  }

  return {
    modalExportacion: {
      isOpen: showModal,
      ruta: rutaSeleccionada,
      pedidosConMonto,
      pedidos: pedidosRuta,
      loadingPedidos
    },
    openModal,
    closeModal,
    toggleMostrarMonto,
    exportarRepartidor,
    exportarCompleto
  }
}
