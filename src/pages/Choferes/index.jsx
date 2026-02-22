import { useState } from 'react'
import { Card, Button, Input, Table, Badge, Modal } from '@components/common'
import { useBranches } from '@hooks/useBranches'
import useDrivers from '@hooks/useDrivers'
import useAuthStore from '@features/auth/useAuthStore'
import { formatearFecha } from '@utils/formatters'
import { ROLES } from '@utils/constants'
import { getLocalDate } from '@utils/dateUtils'

/**
 * Vista de Gestión de Choferes
 * Solo accesible para Administradores
 * INTEGRADO con API-032, API-033, API-034, API-035
 */
const Choferes = () => {
  const {
    choferes,
    crearChofer,
    actualizarChofer,
    desactivarChofer,
    reactivarChofer,
    loading,
    stats
  } = useDrivers()
  const { getById: getSedeById, sedes } = useBranches()
  const { isRole, getSedeIdParaFiltro } = useAuthStore()
  const isSuperAdmin = isRole(ROLES.SUPERADMINISTRADOR)
  const sedeActiva = getSedeIdParaFiltro()

  const [mostrarModal, setMostrarModal] = useState(false)
  const [choferEditando, setChoferEditando] = useState(null)

  const [formData, setFormData] = useState({
    nombre: '',
    licencia: '',
    telefono: '',
    fechaContratacion: getLocalDate(),
    notas: '',
    sedeId: ''
  })
  const [formErrors, setFormErrors] = useState({})

  /**
   * Formatea el teléfono con espacios cada 3 dígitos: 999 999 999
   */
  const formatearTelefonoInput = (valor) => {
    // Eliminar todo excepto números
    const soloNumeros = valor.replace(/\D/g, '')
    // Limitar a 9 dígitos
    const limitado = soloNumeros.slice(0, 9)
    // Agregar espacios cada 3 dígitos
    const partes = []
    for (let i = 0; i < limitado.length; i += 3) {
      partes.push(limitado.slice(i, i + 3))
    }
    return partes.join(' ')
  }

  /**
   * Obtiene solo los números del teléfono (sin espacios)
   */
  const obtenerTelefonoLimpio = (valor) => {
    return valor.replace(/\D/g, '')
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // Manejo especial para teléfono
    if (name === 'telefono') {
      const telefonoFormateado = formatearTelefonoInput(value)
      setFormData(prev => ({ ...prev, [name]: telefonoFormateado }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const errors = {}

    if (!formData.nombre || formData.nombre.trim().length < 3) {
      errors.nombre = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!formData.licencia || formData.licencia.trim().length < 5) {
      errors.licencia = 'Ingresa un número de licencia válido'
    }

    const telefonoLimpio = obtenerTelefonoLimpio(formData.telefono)
    if (!telefonoLimpio || telefonoLimpio.length !== 9) {
      errors.telefono = 'El teléfono debe tener 9 dígitos'
    } else if (!telefonoLimpio.startsWith('9')) {
      errors.telefono = 'El teléfono debe comenzar con 9'
    }

    if (!formData.fechaContratacion) {
      errors.fechaContratacion = 'Selecciona la fecha de contratación'
    }

    // Validar sede para SUPERADMIN sin sede activa (solo al crear)
    if (isSuperAdmin && !sedeActiva && !formData.sedeId && !choferEditando) {
      errors.sedeId = 'Selecciona una sede para el chofer'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNuevoChofer = () => {
    setChoferEditando(null)
    setFormData({
      nombre: '',
      licencia: '',
      telefono: '',
      fechaContratacion: getLocalDate(),
      notas: '',
      sedeId: sedeActiva || '' // Pre-seleccionar sede activa si existe
    })
    setFormErrors({})
    setMostrarModal(true)
  }

  const handleEditarChofer = (chofer) => {
    setChoferEditando(chofer)
    setFormData({
      nombre: chofer.nombre,
      licencia: chofer.licencia,
      telefono: formatearTelefonoInput(chofer.telefono || ''),
      fechaContratacion: chofer.fechaContratacion?.split('T')[0] || getLocalDate(),
      notas: chofer.notas || '',
      sedeId: chofer.sedeId || ''
    })
    setFormErrors({})
    setMostrarModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    // Preparar datos con teléfono limpio (sin espacios)
    const datosParaEnviar = {
      ...formData,
      telefono: obtenerTelefonoLimpio(formData.telefono)
    }

    if (choferEditando) {
      // Actualizar
      const resultado = await actualizarChofer(choferEditando.id, datosParaEnviar)
      if (!resultado.success) {
        alert('Error al actualizar chofer: ' + resultado.error)
        return
      }
      alert('Chofer actualizado exitosamente')
    } else {
      // Crear nuevo
      const resultado = await crearChofer(datosParaEnviar)
      if (!resultado.success) {
        alert('Error al crear chofer: ' + resultado.error)
        return
      }
      alert('Chofer creado exitosamente')
    }

    setMostrarModal(false)
  }

  const handleDesactivar = async (chofer) => {
    if (!confirm(`¿Desactivar al chofer ${chofer.nombre}?`)) return

    const resultado = await desactivarChofer(chofer.id)
    if (!resultado.success) {
      alert('Error al desactivar chofer: ' + resultado.error)
      return
    }
    alert('Chofer desactivado exitosamente')
  }

  const handleReactivar = async (chofer) => {
    if (!confirm(`¿Reactivar al chofer ${chofer.nombre}?`)) return

    const resultado = await reactivarChofer(chofer.id)
    if (!resultado.success) {
      alert('Error al reactivar chofer: ' + resultado.error)
      return
    }
    alert('Chofer reactivado exitosamente')
  }

  const columnas = [
    {
      title: 'Nombre',
      key: 'nombre',
      render: (value) => <span className="font-semibold">{value}</span>
    },
    // Columna Sede - Solo visible para SUPERADMINISTRADOR
    ...(isSuperAdmin ? [{
      title: 'Sede',
      key: 'sedeId',
      render: (value) => {
        const sede = value ? getSedeById(value) : null
        if (!sede) return <span className="text-gray-400">-</span>
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: sede.color || '#6366f1' }}
          >
            {sede.nombre}
          </span>
        )
      }
    }] : []),
    {
      title: 'Licencia',
      key: 'licencia',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      title: 'Teléfono',
      key: 'telefono'
    },
    {
      title: 'Fecha Contratación',
      key: 'fechaContratacion',
      render: (value) => formatearFecha(value, 'dd/MM/yyyy')
    },
    {
      title: 'Estado',
      key: 'activo',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (_, chofer) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleEditarChofer(chofer)}
          >
            ✏️ Editar
          </Button>
          {chofer.activo ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDesactivar(chofer)}
            >
              ❌ Desactivar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              onClick={() => handleReactivar(chofer)}
            >
              ✅ Reactivar
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Choferes</h1>
          <p className="text-gray-600 mt-1">
            Administra los conductores para las rutas de entrega
          </p>
        </div>
        <Button onClick={handleNuevoChofer}>
          ➕ Nuevo Chofer
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Total Choferes</p>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats.total}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Choferes Activos</p>
            <p className="text-3xl font-bold text-green-600">
              {loading ? '...' : stats.active}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm">Choferes Inactivos</p>
            <p className="text-3xl font-bold text-gray-500">
              {loading ? '...' : stats.inactive}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabla de Choferes */}
      <Card title="Lista de Choferes">
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            Cargando choferes...
          </div>
        ) : (
          <Table
            columns={columnas}
            data={choferes}
            emptyMessage="No hay choferes registrados"
          />
        )}
      </Card>

      {/* Modal de Formulario */}
      <Modal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        title={choferEditando ? 'Editar Chofer' : 'Nuevo Chofer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Sede - Solo visible para SUPERADMIN sin sede activa */}
          {isSuperAdmin && !sedeActiva && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Sede <span className="text-red-500">*</span>
              </label>
              <select
                name="sedeId"
                value={formData.sedeId}
                onChange={handleChange}
                className={`input ${formErrors.sedeId ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Selecciona una sede...</option>
                {sedes.map(sede => (
                  <option key={sede.id} value={sede.id}>
                    {sede.nombre}
                  </option>
                ))}
              </select>
              {formErrors.sedeId && (
                <span className="text-sm text-red-500">{formErrors.sedeId}</span>
              )}
            </div>
          )}

          <Input
            label="Nombre Completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={formErrors.nombre}
            required
            placeholder="Ej: Juan Pérez García"
          />

          <Input
            label="Número de Licencia"
            name="licencia"
            value={formData.licencia}
            onChange={handleChange}
            error={formErrors.licencia}
            required
            placeholder="Ej: A-12345678"
          />

          <Input
            label="Teléfono"
            name="telefono"
            type="tel"
            value={formData.telefono}
            onChange={handleChange}
            error={formErrors.telefono}
            required
            placeholder="987 654 321"
            maxLength={11}
          />

          <Input
            label="Fecha de Contratación"
            name="fechaContratacion"
            type="date"
            value={formData.fechaContratacion}
            onChange={handleChange}
            error={formErrors.fechaContratacion}
            required
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Notas (Opcional)
            </label>
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Información adicional sobre el chofer..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMostrarModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {choferEditando ? 'Actualizar' : 'Crear'} Chofer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Choferes
