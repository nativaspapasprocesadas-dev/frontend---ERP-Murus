import { useState } from 'react'
import { Card, Button, Table, Modal, Input, Badge, Toast } from '@components/common'
import { useSpecies } from '@hooks/useSpecies'
import { formatearFecha } from '@utils/formatters'
import { useToast } from '@hooks/useToast'

/**
 * Vista de Gestion de Especies
 *
 * INTEGRACIÓN:
 * - ELM-087 (Vista contenedora): INTEGRADO con API-045, API-046, API-047, API-048
 * - ELM-088 (Tabla Lista de Especies): INTEGRADO con API-045 GET /api/v1/species
 * - ELM-089 (Modal Nueva/Editar Especie): INTEGRADO con API-046 POST y API-047 PUT
 * - ELM-091 (Modal Confirmar Eliminacion): INTEGRADO con API-048 DELETE /api/v1/species/:id
 * - Eliminado uso de mocks: mockEspecies y useMock reemplazados por useSpecies con APIs reales
 */
const Especies = () => {
  const {
    especies,
    loading,
    crearEspecie,
    actualizarEspecie,
    eliminarEspecie,
    toggleEstado,
    puedeGestionar
  } = useSpecies()
  const { success: toastSuccess, error: toastError, toast: toastState, hideToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activa: true
  })
  const [formErrors, setFormErrors] = useState({})

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        nombre: item.nombre,
        descripcion: item.descripcion,
        activa: item.activa
      })
    } else {
      setEditingItem(null)
      setFormData({
        nombre: '',
        descripcion: '',
        activa: true
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      nombre: '',
      descripcion: '',
      activa: true
    })
    setFormErrors({})
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const errors = {}
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    if (!puedeGestionar) {
      toastError('No tienes permisos para gestionar especies')
      return
    }

    let result
    if (editingItem) {
      result = await actualizarEspecie(editingItem.id, formData)
    } else {
      result = await crearEspecie(formData)
    }

    if (result.success) {
      toastSuccess(editingItem ? 'Especie actualizada correctamente' : 'Especie creada correctamente')
      handleCloseModal()
    } else {
      toastError(result.error || 'Error al guardar la especie')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta especie?')) {
      return
    }

    if (!puedeGestionar) {
      toastError('No tienes permisos para eliminar especies')
      return
    }

    const result = await eliminarEspecie(id)

    if (result.success) {
      toastSuccess('Especie eliminada correctamente')
    } else {
      toastError(result.error || 'Error al eliminar la especie')
    }
  }

  const handleToggleEstado = async (id, estadoActual) => {
    const result = await toggleEstado(id, estadoActual)
    if (result.success) {
      toastSuccess(estadoActual ? 'Especie desactivada' : 'Especie activada')
    } else {
      toastError(result.error || 'Error al cambiar el estado')
    }
  }

  const columns = [
    {
      title: 'Nombre',
      key: 'nombre',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      title: 'Descripción',
      key: 'descripcion'
    },
    {
      title: 'Estado',
      key: 'activa',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      title: 'Fecha Creación',
      key: 'fechaCreacion',
      render: (value) => formatearFecha(value)
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={row.activa ? 'warning' : 'success'}
            onClick={() => handleToggleEstado(row.id, row.activa)}
            title={row.activa ? 'Desactivar especie' : 'Activar especie'}
          >
            {row.activa ? 'Desactivar' : 'Activar'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Eliminar
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Especies de Papa</h1>
          <p className="text-gray-600 mt-1">Gestiona las especies de papa disponibles</p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nueva Especie</Button>
      </div>

      <Card>
        <Table columns={columns} data={especies} loading={loading} emptyMessage="No hay especies registradas" />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Editar Especie' : 'Nueva Especie'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={formErrors.nombre}
            required
            placeholder="Ej: Única"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Descripción de la especie"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activa"
              name="activa"
              checked={formData.activa}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="activa" className="text-sm font-medium text-gray-700">
              Activa
            </label>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast de notificaciones */}
      {toastState && (
        <Toast
          type={toastState.type}
          message={toastState.message}
          onClose={hideToast}
          duration={toastState.duration}
        />
      )}
    </div>
  )
}

export default Especies
