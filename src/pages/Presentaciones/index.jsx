/**
 * Presentaciones - Vista CRUD para gestionar presentaciones
 * ELM-109 (Vista), ELM-110 (Tabla), ELM-111 (Modal Crear/Editar), ELM-113 (Modal Eliminar)
 * Integrado con APIs reales: API-053, API-054, API-055, API-056
 */
import { useState } from 'react'
import { Card, Button, Table, Modal, Input, Badge, Toast } from '@components/common'
import { usePresentations } from '@hooks/usePresentations'
import { useToast } from '@hooks/useToast'
import { formatearFecha } from '@utils/formatters'

const Presentaciones = () => {
  const { presentations, loading, createPresentation, updatePresentation, deletePresentation, toggleStatus } = usePresentations()
  const { success: toastSuccess, error: toastError, toast: toastState, hideToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    weight: '',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState({})
  const [deleting, setDeleting] = useState(false)

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name || '',
        description: item.description || '',
        weight: item.weight || '',
        isActive: item.isActive !== undefined ? item.isActive : true
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        weight: '',
        isActive: true
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
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
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'El nombre es requerido'
    }
    if (formData.weight && (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0)) {
      errors.weight = 'El peso debe ser un numero mayor a 0'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      isActive: formData.isActive
    }

    if (editingItem) {
      const result = await updatePresentation(editingItem.id, payload)
      if (result.success) {
        toastSuccess(result.message || 'Presentación actualizada exitosamente')
        handleCloseModal()
      } else {
        toastError(result.error || 'Error al actualizar presentación')
      }
    } else {
      const result = await createPresentation(payload)
      if (result.success) {
        toastSuccess(result.message || 'Presentación creada exitosamente')
        handleCloseModal()
      } else {
        toastError(result.error || 'Error al crear presentación')
      }
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta presentación?')) {
      setDeleting(true)
      const result = await deletePresentation(id)
      setDeleting(false)

      if (result.success) {
        toastSuccess(result.message || 'Presentación eliminada exitosamente')
      } else {
        toastError(result.error || 'Error al eliminar presentación')
      }
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const result = await toggleStatus(id, currentStatus)
    if (result.success) {
      toastSuccess(result.message || (currentStatus ? 'Presentación desactivada' : 'Presentación activada'))
    } else {
      toastError(result.error || 'Error al cambiar el estado')
    }
  }

  const columns = [
    {
      title: 'Nombre',
      key: 'name',
      render: (value) => (
        <span className="font-semibold text-gray-900">{value}</span>
      )
    },
    {
      title: 'Descripción',
      key: 'description',
      render: (value) => (
        <span className="text-gray-600">{value || '—'}</span>
      )
    },
    {
      title: 'Peso (kg)',
      key: 'weight',
      render: (value) => (
        <span className="font-semibold text-primary-600">{value || 1} kg</span>
      )
    },
    {
      title: 'Estado',
      key: 'isActive',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Activa' : 'Inactiva'}
        </Badge>
      )
    },
    {
      title: 'Fecha Creación',
      key: 'createdAt',
      render: (value) => formatearFecha(value)
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={row.isActive ? 'warning' : 'success'}
            onClick={() => handleToggleStatus(row.id, row.isActive)}
            title={row.isActive ? 'Desactivar presentación' : 'Activar presentación'}
            disabled={deleting}
          >
            {row.isActive ? 'Desactivar' : 'Activar'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)} disabled={deleting}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)} disabled={deleting}>
            Eliminar
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* ELM-109: Vista Gestion de Presentaciones */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Presentaciones</h1>
          <p className="text-gray-600 mt-1">Gestiona las presentaciones de productos</p>
        </div>
        <Button onClick={() => handleOpenModal()} disabled={loading || deleting}>
          + Nueva Presentación
        </Button>
      </div>

      {/* ELM-110: Tabla Lista de Presentaciones */}
      <Card>
        <Table
          columns={columns}
          data={presentations.sort((a, b) => a.name.localeCompare(b.name))}
          loading={loading}
          emptyMessage="No hay presentaciones registradas"
        />
      </Card>

      {/* ELM-111: Modal Nueva Presentacion / Editar Presentacion */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Editar Presentación' : 'Nueva Presentación'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            required
            placeholder="Ej: Bolsa 50kg"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Descripción opcional de la presentación"
            />
          </div>

          <Input
            label="Peso (kg)"
            name="weight"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.weight}
            onChange={handleChange}
            error={formErrors.weight}
            placeholder="Ej: 50"
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
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

export default Presentaciones
