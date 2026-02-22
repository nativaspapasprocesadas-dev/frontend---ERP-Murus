import { useState } from 'react'
import { Card, Button, Table, Modal, Input, Select, Badge, Toast } from '@components/common'
import { useMeasures } from '@hooks/useMeasures'
import { TIPOS_MEDIDA, TIPOS_MEDIDA_LABELS } from '@utils/constants'
import { formatearFecha } from '@utils/formatters'
import { useToast } from '@hooks/useToast'

const Medidas = () => {
  const { data: medidas, loading, create, update, remove, toggleStatus, error } = useMeasures()
  const { success: toastSuccess, error: toastError, warning: toastWarning, toast: toastState, hideToast } = useToast()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: '',
    activa: true,
    orden: 1
  })
  const [formErrors, setFormErrors] = useState({})

  const tiposOptions = Object.keys(TIPOS_MEDIDA).map((key) => ({
    value: TIPOS_MEDIDA[key],
    label: TIPOS_MEDIDA_LABELS[TIPOS_MEDIDA[key]]
  }))

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        nombre: item.nombre,
        tipo: item.tipo,
        activa: item.activa,
        orden: item.orden
      })
    } else {
      setEditingItem(null)
      setFormData({
        nombre: '',
        tipo: '',
        activa: true,
        orden: medidas.length + 1
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
    if (!formData.nombre.trim()) errors.nombre = 'El nombre es requerido'
    if (!formData.tipo) errors.tipo = 'El tipo es requerido'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    let result
    if (editingItem) {
      result = await update(editingItem.id, formData)
    } else {
      result = await create(formData)
    }

    if (result.success) {
      toastSuccess(editingItem ? 'Medida actualizada correctamente' : 'Medida creada correctamente')
      handleCloseModal()
    } else {
      toastError(result.error || 'Error al guardar la medida')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta medida?')) {
      const result = await remove(id)
      if (result.success) {
        toastSuccess('Medida eliminada correctamente')
      } else {
        toastError(result.error || 'Error al eliminar la medida')
      }
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const result = await toggleStatus(id, currentStatus)
    if (result.success) {
      toastSuccess(currentStatus ? 'Medida desactivada' : 'Medida activada')
    } else {
      toastError(result.error || 'Error al cambiar el estado')
    }
  }

  const columns = [
    {
      title: 'Orden',
      key: 'orden',
      render: (value) => <span className="font-semibold text-gray-500">#{value}</span>
    },
    {
      title: 'Nombre',
      key: 'nombre',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      title: 'Tipo',
      key: 'tipo',
      render: (value) => (
        <Badge variant="info">{TIPOS_MEDIDA_LABELS[value]}</Badge>
      )
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
            onClick={() => handleToggleStatus(row.id, row.activa)}
            title={row.activa ? 'Desactivar medida' : 'Activar medida'}
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
          <h1 className="text-3xl font-bold text-gray-900">Medidas de Corte</h1>
          <p className="text-gray-600 mt-1">Gestiona las medidas de corte disponibles</p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nueva Medida</Button>
      </div>

      <Card>
        <Table columns={columns} data={medidas.sort((a, b) => a.orden - b.orden)} loading={loading} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Editar Medida' : 'Nueva Medida'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={formErrors.nombre}
            required
            placeholder="Ej: #14"
          />

          <Select
            label="Tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            options={tiposOptions}
            error={formErrors.tipo}
            required
          />

          <Input
            label="Orden"
            name="orden"
            type="number"
            value={formData.orden}
            onChange={handleChange}
            min="1"
          />

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

export default Medidas
