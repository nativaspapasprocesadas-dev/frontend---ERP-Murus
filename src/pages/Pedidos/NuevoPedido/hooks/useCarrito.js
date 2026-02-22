import { useState, useMemo } from 'react'

/**
 * Hook para gestión del carrito de compras
 *
 * @param {Object} params
 * @param {Object} params.cliente - Cliente seleccionado (para obtener productos)
 * @param {Array} params.productos - Lista de productos disponibles (viene de useProducts)
 * @returns {Object} Estado y acciones del carrito
 */
export const useCarrito = ({ cliente, productos = [] } = {}) => {

  // Estado del carrito
  const [carrito, setCarrito] = useState([])

  // Estados para edición de items del carrito
  const [editandoIndex, setEditandoIndex] = useState(null)
  const [productoEditando, setProductoEditando] = useState({
    especieId: '',
    medidaId: '',
    presentacionId: '',
    cantidad: 1
  })

  // Agregar producto al carrito
  const agregarAlCarrito = (productoSeleccionado, cantidad, subtotal) => {
    if (!productoSeleccionado || cantidad < 1) {
      return false
    }

    const itemCarrito = {
      productoId: productoSeleccionado.id,
      nombreProducto: productoSeleccionado.nombreCompleto,
      cantidad: parseInt(cantidad),
      kilosPorBolsa: productoSeleccionado.presentacion.kilos,
      precioKg: productoSeleccionado.precioKg,
      fotoUrl: productoSeleccionado.fotoUrl,
      subtotal: subtotal
    }

    setCarrito(prev => [...prev, itemCarrito])
    return true
  }

  // Eliminar producto del carrito
  const eliminarDelCarrito = (index) => {
    setCarrito(prev => prev.filter((_, i) => i !== index))
  }

  // Iniciar edición de un item del carrito
  const iniciarEdicion = (index) => {
    const item = carrito[index]

    // Buscar el producto original para obtener sus IDs
    const productoOriginal = productos.find(p => p.id === item.productoId)

    if (productoOriginal) {
      setProductoEditando({
        especieId: productoOriginal.especieId.toString(),
        medidaId: productoOriginal.medidaId.toString(),
        presentacionId: productoOriginal.presentacionId.toString(),
        cantidad: item.cantidad
      })
    }

    setEditandoIndex(index)
  }

  // Actualizar campos durante edición
  const actualizarProductoEditando = (cambios) => {
    setProductoEditando(prev => ({
      ...prev,
      ...cambios
    }))
  }

  // Guardar cambios de edición
  const guardarEdicion = (index, productoEditandoSeleccionado) => {
    if (!productoEditandoSeleccionado || !productoEditando.cantidad || productoEditando.cantidad < 1) {
      return false
    }

    const kilosTotales = productoEditandoSeleccionado.presentacion.kilos * productoEditando.cantidad
    const subtotal = kilosTotales * productoEditandoSeleccionado.precioKg

    // Actualizar el item del carrito
    const nuevoCarrito = [...carrito]
    nuevoCarrito[index] = {
      productoId: productoEditandoSeleccionado.id,
      nombreProducto: productoEditandoSeleccionado.nombreCompleto,
      cantidad: parseInt(productoEditando.cantidad),
      kilosPorBolsa: productoEditandoSeleccionado.presentacion.kilos,
      precioKg: productoEditandoSeleccionado.precioKg,
      fotoUrl: productoEditandoSeleccionado.fotoUrl,
      subtotal: subtotal
    }

    setCarrito(nuevoCarrito)
    cancelarEdicion()
    return true
  }

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditandoIndex(null)
    setProductoEditando({
      especieId: '',
      medidaId: '',
      presentacionId: '',
      cantidad: 1
    })
  }

  // Vaciar carrito
  const vaciarCarrito = () => {
    setCarrito([])
  }

  // Calcular totales del pedido
  const totales = useMemo(() => {
    const totalMonto = carrito.reduce((sum, item) => sum + item.subtotal, 0)
    const totalKilos = carrito.reduce((sum, item) => sum + (item.cantidad * item.kilosPorBolsa), 0)
    return { totalMonto, totalKilos }
  }, [carrito])

  return {
    // Estado
    carrito,
    editandoIndex,
    productoEditando,
    totales,
    cantidadItems: carrito.length,

    // Setters
    setProductoEditando,

    // Acciones
    agregarAlCarrito,
    eliminarDelCarrito,
    iniciarEdicion,
    actualizarProductoEditando,
    guardarEdicion,
    cancelarEdicion,
    vaciarCarrito
  }
}
