import { useState } from 'react'
import { Card, Button, Table, Badge, Modal, Input, Toast } from '@components/common'
import { useBranches } from '@hooks/useBranches'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'

/**
 * Página de Gestión de Sedes
 * Solo accesible para SUPERADMINISTRADOR
 * Integrado con API-071, API-072, API-073, API-074
 */
const Sedes = () => {
  const { user } = useAuthStore()
  const { sedes, sedesActivas, loading, createSede, updateSede, desactivarSede, deleteSede } = useBranches()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSede, setSelectedSede] = useState(null)
  const [toast, setToast] = useState(null)

  // Form data para crear/editar
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
    color: '#6366f1'
  })

  // Verificar permisos
  const isSuperAdmin = user?.rol === ROLES.SUPERADMINISTRADOR

  const mostrarToast = (type, message) => {
    setToast({ type, message })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      direccion: '',
      telefono: '',
      color: '#6366f1'
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!formData.nombre || !formData.codigo) {
      mostrarToast('error', 'El nombre y código son requeridos')
      return
    }

    const result = await createSede(formData)

    if (result.success) {
      mostrarToast('success', 'Sede creada exitosamente')
      setShowCreateModal(false)
      resetForm()
    } else {
      mostrarToast('error', result.error || 'Error al crear la sede')
    }
  }

  const handleEdit = (sede) => {
    setSelectedSede(sede)
    setFormData({
      nombre: sede.nombre,
      codigo: sede.codigo,
      direccion: sede.direccion || '',
      telefono: sede.telefono || '',
      color: sede.color || '#6366f1'
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    if (!formData.nombre) {
      mostrarToast('error', 'El nombre es requerido')
      return
    }

    const result = await updateSede(selectedSede.id, {
      nombre: formData.nombre,
      direccion: formData.direccion,
      telefono: formData.telefono,
      color: formData.color
    })

    if (result.success) {
      mostrarToast('success', 'Sede actualizada exitosamente')
      setShowEditModal(false)
      setSelectedSede(null)
      resetForm()
    } else {
      mostrarToast('error', result.error || 'Error al actualizar la sede')
    }
  }

  const handleToggleActive = async (sede) => {
    if (sede.activo) {
      const result = await desactivarSede(sede.id)
      if (result.success) {
        mostrarToast('success', 'Sede desactivada exitosamente')
      } else {
        mostrarToast('error', result.error || 'Error al desactivar la sede')
      }
    } else {
      const result = await updateSede(sede.id, { activo: true })
      if (result.success) {
        mostrarToast('success', 'Sede activada exitosamente')
      } else {
        mostrarToast('error', result.error || 'Error al activar la sede')
      }
    }
  }

  const handleOpenDeleteModal = (sede) => {
    setSelectedSede(sede)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!selectedSede) return

    const result = await deleteSede(selectedSede.id)

    if (result.success) {
      mostrarToast('success', 'Sede eliminada exitosamente')
      setShowDeleteModal(false)
      setSelectedSede(null)
    } else {
      mostrarToast('error', result.error || 'Error al eliminar la sede')
    }
  }

  const columns = [
    {
      title: 'Sede',
      key: 'nombre',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: row.color || '#6366f1' }}
          >
            {row.codigo?.charAt(0) || value.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{row.codigo}</p>
          </div>
        </div>
      )
    },
    {
      title: 'Dirección',
      key: 'direccion',
      render: (value) => value || <span className="text-gray-400">No especificada</span>
    },
    {
      title: 'Teléfono',
      key: 'telefono',
      render: (value) => value || <span className="text-gray-400">-</span>
    },
    {
      title: 'Estado',
      key: 'activo',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Badge variant={value ? 'success' : 'gray'}>
            {value ? 'Activa' : 'Inactiva'}
          </Badge>
          {row.esPrincipal && (
            <Badge variant="warning">Principal</Badge>
          )}
        </div>
      )
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
            Editar
          </Button>
          {!row.esPrincipal && (
            <>
              <Button
                size="sm"
                variant={row.activo ? 'danger' : 'primary'}
                onClick={() => handleToggleActive(row)}
              >
                {row.activo ? 'Desactivar' : 'Activar'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleOpenDeleteModal(row)}
              >
                Eliminar
              </Button>
            </>
          )}
        </div>
      )
    }
  ]

  // Si no es SUPERADMIN, mostrar mensaje de acceso denegado
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600">Solo el Super Administrador puede gestionar las sedes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Sedes</h1>
          <p className="text-gray-600 mt-1">Administra las sucursales del sistema</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Nueva Sede
        </Button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sedes</p>
              <p className="text-2xl font-bold text-gray-900">{sedes.length}</p>
            </div>
            <span className="text-3xl">🏢</span>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sedes Activas</p>
              <p className="text-2xl font-bold text-green-600">{sedesActivas.length}</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </Card>

        <Card className="border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sedes Inactivas</p>
              <p className="text-2xl font-bold text-gray-600">
                {sedes.length - sedesActivas.length}
              </p>
            </div>
            <span className="text-3xl">🚫</span>
          </div>
        </Card>
      </div>

      {/* Información */}
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <p className="text-sm text-indigo-900">
          <strong>ℹ️ Multi-Sede:</strong> Cada sede opera de forma independiente con sus propios pedidos, rutas y producción.
          Los usuarios internos (Admin, Coordinador, Producción) están asignados a una sede específica.
          Como Super Administrador, puedes ver datos de todas las sedes usando el selector en la barra superior.
        </p>
      </div>

      {/* Tabla de Sedes */}
      <Card>
        <Table columns={columns} data={sedes} loading={loading} />
      </Card>

      {/* Modal Crear Sede */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Crear Nueva Sede"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nombre de la Sede"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Sede Lima Norte"
            required
          />

          <Input
            label="Código"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            placeholder="Ej: LN"
            maxLength={5}
            required
          />
          <p className="text-xs text-gray-500 -mt-2">
            Código corto para identificar la sede (máx. 5 caracteres)
          </p>

          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Dirección de la sede"
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Teléfono de contacto"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Identificador
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-sm text-gray-600">{formData.color}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => {
              setShowCreateModal(false)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Sede
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Sede */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedSede(null)
          resetForm()
        }}
        title={`Editar Sede: ${selectedSede?.nombre}`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input
            label="Nombre de la Sede"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            placeholder="Ej: Sede Lima Norte"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              value={formData.codigo}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">El código no puede ser modificado</p>
          </div>

          <Input
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Dirección de la sede"
          />

          <Input
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Teléfono de contacto"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color Identificador
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-12 h-10 rounded cursor-pointer border border-gray-300"
              />
              <span className="text-sm text-gray-600">{formData.color}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => {
              setShowEditModal(false)
              setSelectedSede(null)
              resetForm()
            }}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminacion - ELM-124 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedSede(null)
        }}
        title="Confirmar Eliminacion"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-900">
                  Esta accion es permanente y no se puede deshacer
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Se eliminara la sede <strong>{selectedSede?.nombre}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>Nota:</strong> No se puede eliminar una sede que tenga usuarios asignados.
              El sistema validara esto antes de proceder.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedSede(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
            >
              Eliminar Sede
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
          duration={4000}
        />
      )}
    </div>
  )
}

export default Sedes
