import { useState } from 'react'

/**
 * Hook para gestión del modal de configuración de rutas
 */
export const useModalConfigRutas = ({ createRutaConfig, updateRutaConfig, desactivarRuta, activarRuta, isSuperAdmin }) => {
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editando, setEditando] = useState(false)
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [formulario, setFormulario] = useState({
    numero: '',
    nombre: '',
    color: '#3b82f6',
    descripcion: '',
    sedeId: null,
    horaLimiteRecepcion: ''
  })

  const openConfigModal = () => {
    setShowConfigModal(true)
  }

  const closeConfigModal = () => {
    setShowConfigModal(false)
  }

  const openFormNueva = () => {
    setEditando(false)
    setRutaSeleccionada(null)
    setFormulario({
      numero: '',
      nombre: '',
      color: '#3b82f6',
      descripcion: '',
      sedeId: null,
      horaLimiteRecepcion: ''
    })
    setShowFormModal(true)
  }

  const openFormEditar = (ruta) => {
    setEditando(true)
    setRutaSeleccionada(ruta)
    setFormulario({
      numero: ruta.numero,
      nombre: ruta.nombre,
      color: ruta.color,
      descripcion: ruta.descripcion || '',
      horaLimiteRecepcion: ruta.horaLimiteRecepcion || ''
    })
    setShowFormModal(true)
  }

  const closeFormModal = () => {
    setShowFormModal(false)
    setRutaSeleccionada(null)
  }

  const handleChangeFormulario = (e) => {
    const { name, value } = e.target
    setFormulario(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const guardarRuta = async () => {
    // Validaciones
    if (!formulario.numero || formulario.numero < 1) {
      alert('El número de ruta debe ser mayor a 0')
      return
    }

    if (!formulario.nombre.trim()) {
      alert('El nombre de la ruta es obligatorio')
      return
    }

    if (!formulario.color) {
      alert('Debes seleccionar un color para la ruta')
      return
    }

    // Validar sede para SUPERADMIN al crear nueva ruta
    if (!editando && isSuperAdmin) {
      if (!formulario.sedeId || formulario.sedeId === '' || formulario.sedeId === null) {
        alert('Debes seleccionar una sede para la ruta')
        return
      }
    }

    try {
      let resultado

      if (editando) {
        resultado = await updateRutaConfig(rutaSeleccionada.id, {
          numero: parseInt(formulario.numero),
          nombre: formulario.nombre.trim(),
          color: formulario.color,
          descripcion: formulario.descripcion.trim(),
          horaLimiteRecepcion: formulario.horaLimiteRecepcion || null
        })
      } else {
        resultado = await createRutaConfig({
          numero: parseInt(formulario.numero),
          nombre: formulario.nombre.trim(),
          color: formulario.color,
          descripcion: formulario.descripcion.trim(),
          sedeId: formulario.sedeId ? parseInt(formulario.sedeId) : null,
          horaLimiteRecepcion: formulario.horaLimiteRecepcion || null
        })
      }

      if (resultado.success) {
        alert(editando ? '✅ Ruta actualizada exitosamente' : '✅ Ruta creada exitosamente')
        closeFormModal()
      } else {
        alert(`❌ ${resultado.error}`)
      }
    } catch (error) {
      alert('❌ Error al guardar la ruta')
      console.error(error)
    }
  }

  const cambiarEstadoRuta = async (ruta) => {
    const accion = ruta.activo ? 'desactivar' : 'activar'
    if (window.confirm(`¿Estás seguro de ${accion} la ruta "${ruta.nombre}"?`)) {
      const resultado = ruta.activo
        ? await desactivarRuta(ruta.id)
        : await activarRuta(ruta.id)

      if (resultado.success) {
        alert(`✅ Ruta ${accion === 'desactivar' ? 'desactivada' : 'activada'} exitosamente`)
      } else {
        alert(`❌ Error al ${accion} la ruta`)
      }
    }
  }

  return {
    // Estado de modales
    showConfigModal,
    showFormModal,
    editando,
    formulario,

    // Acciones modal config
    openConfigModal,
    closeConfigModal,

    // Acciones modal form
    openFormNueva,
    openFormEditar,
    closeFormModal,
    handleChangeFormulario,
    guardarRuta,

    // Acciones de estado
    cambiarEstadoRuta
  }
}
