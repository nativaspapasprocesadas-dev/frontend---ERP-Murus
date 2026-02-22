import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Table, Badge, Modal, Select, Input } from '@components/common'
import { UsersService } from '@services/UsersService'
import { BranchesService } from '@services/BranchesService'
import { formatearFecha } from '@utils/formatters'
import { ROLES, ROLES_LABELS, ROLE_IDS, ROLE_NAMES_BY_ID } from '@utils/constants'

/**
 * Helper para comparar roles de forma case-insensitive
 * La API devuelve nombres con mayúsculas, las constantes usan minúsculas
 */
const isRole = (userRole, expectedRole) => {
  return userRole?.toLowerCase() === expectedRole?.toLowerCase()
}

/**
 * Página de Gestión de Usuarios
 * Solo accesible para SUPERADMINISTRADOR
 *
 * Funcionalidades:
 * - Ver todos los usuarios del sistema (API-067)
 * - Asignar/cambiar sede a usuarios internos (API-069)
 * - Crear nuevos usuarios (API-068)
 * - Eliminar usuarios (API-070)
 * - Activar/desactivar usuarios (API-069)
 *
 * Elementos integrados:
 * - ELM-128: Modal Nuevo Usuario / Editar Usuario
 * - ELM-130: Modal Confirmar Eliminacion
 * - ELM-131: Boton Activar/Desactivar Usuario
 */
const Usuarios = () => {
  // Estados de datos
  const [usuarios, setUsuarios] = useState([])
  const [sedes, setSedes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estados de filtros
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroSede, setFiltroSede] = useState('')

  // Estados de modales
  const [modalAsignarSede, setModalAsignarSede] = useState({ isOpen: false, usuario: null })
  const [sedeSeleccionada, setSedeSeleccionada] = useState('')
  const [modalCrear, setModalCrear] = useState(false)
  const [modalEliminar, setModalEliminar] = useState({ isOpen: false, usuario: null })
  const [nuevoUsuario, setNuevoUsuario] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
    phone: '',
    branchId: ''
  })

  // Cargar usuarios y sedes al montar componente
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)

    try {
      // Cargar usuarios (API-067)
      const resultUsuarios = await UsersService.listUsers({ pageSize: 1000 })
      if (resultUsuarios.success) {
        setUsuarios(resultUsuarios.data)
      } else {
        setError(resultUsuarios.error)
      }

      // Cargar sedes (API-071)
      const resultSedes = await BranchesService.listBranches({ pageSize: 100, isActive: true })
      if (resultSedes.success) {
        setSedes(resultSedes.data)
      }
    } catch (err) {
      setError('Error al cargar datos: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Set de IDs de sedes activas para verificación rápida
  const sedesActivasIds = useMemo(() => {
    return new Set(sedes.map(s => s.id))
  }, [sedes])

  // Verificar si un usuario tiene sede efectiva (activa)
  const tieneSedeActiva = (usuario) => {
    if (isRole(usuario.role, ROLES.SUPERADMINISTRADOR)) return true // SUPERADMIN tiene todas
    if (isRole(usuario.role, ROLES.CLIENTE)) return false // Clientes no tienen sede directa
    return usuario.branchId && sedesActivasIds.has(usuario.branchId)
  }

  // Usuarios filtrados
  const usuariosFiltrados = useMemo(() => {
    let resultado = usuarios

    if (filtroRol) {
      resultado = resultado.filter(u => isRole(u.role, filtroRol))
    }

    if (filtroSede) {
      if (filtroSede === 'sin-sede') {
        // Filtrar usuarios sin sede efectiva:
        // - CLIENTE: Todos (los clientes solo tienen ruta, no sede directa)
        // - Otros roles: Si no tienen branchId O si su sede está desactivada
        // - SUPERADMIN: Excluido (tiene acceso a todas las sedes)
        resultado = resultado.filter(u => !tieneSedeActiva(u))
      } else {
        // Al filtrar por sede específica, EXCLUIR clientes ya que ellos no tienen sede directa
        // (su relación con sede es a través de la ruta, no del campo branchId)
        // DEBUG: Log clientes que tienen branchId asignado (no deberían tenerlo)
        const clientesConBranchId = resultado.filter(u =>
          isRole(u.role, ROLES.CLIENTE) && u.branchId !== null && u.branchId !== undefined
        )
        if (clientesConBranchId.length > 0) {
          console.warn('[Usuarios] ADVERTENCIA: Clientes con branchId asignado (no debería ocurrir):', clientesConBranchId.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            branchId: c.branchId
          })))
        }

        // Filtrar: incluir solo usuarios NO-CLIENTE que tengan el branchId seleccionado
        // Los clientes se excluyen porque no tienen relación directa con sede
        resultado = resultado.filter(u =>
          !isRole(u.role, ROLES.CLIENTE) && u.branchId === parseInt(filtroSede)
        )
      }
    }

    return resultado
  }, [usuarios, filtroRol, filtroSede])

  // Usuarios internos (todos excepto clientes)
  const usuariosInternos = useMemo(() => {
    return usuarios.filter(u => !isRole(u.role, ROLES.CLIENTE))
  }, [usuarios])

  // Sedes activas
  const sedesActivas = useMemo(() => {
    return sedes.filter(s => s.isActive)
  }, [sedes])

  // Opciones para filtros
  const rolesOptions = [
    { value: '', label: 'Todos los roles' },
    { value: ROLES.SUPERADMINISTRADOR, label: 'Super Administrador' },
    { value: ROLES.ADMINISTRADOR, label: 'Administrador' },
    { value: ROLES.COORDINADOR, label: 'Coordinador' },
    { value: ROLES.PRODUCCION, label: 'Producción' },
    { value: ROLES.CLIENTE, label: 'Cliente' }
  ]

  const sedesOptions = [
    { value: '', label: 'Todas las sedes' },
    { value: 'sin-sede', label: 'Sin sede asignada' },
    ...sedesActivas.map(s => ({ value: s.id, label: s.name }))
  ]

  const sedesParaAsignar = sedesActivas.map(s => ({
    value: s.id,
    label: s.name
  }))

  // Manejar asignación de sede (API-069)
  const handleAsignarSede = async () => {
    if (!modalAsignarSede.usuario || !sedeSeleccionada) return

    setLoading(true)
    const resultado = await UsersService.assignBranch(
      modalAsignarSede.usuario.id,
      parseInt(sedeSeleccionada)
    )

    if (resultado.success) {
      await cargarDatos() // Recargar datos
      setModalAsignarSede({ isOpen: false, usuario: null })
      setSedeSeleccionada('')
    } else {
      alert(resultado.error)
    }
    setLoading(false)
  }

  // Manejar creación de usuario (API-068 - ELM-128)
  const handleCrearUsuario = async (e) => {
    e.preventDefault()

    const datosUsuario = {
      name: nuevoUsuario.name.trim(),
      email: nuevoUsuario.email.trim().toLowerCase(),
      password: nuevoUsuario.password,
      roleId: parseInt(nuevoUsuario.roleId),
      branchId: nuevoUsuario.branchId ? parseInt(nuevoUsuario.branchId) : null,
      phone: nuevoUsuario.phone.trim() || null
    }

    setLoading(true)
    const resultado = await UsersService.createUser(datosUsuario)

    if (resultado.success) {
      await cargarDatos() // Recargar datos
      setModalCrear(false)
      setNuevoUsuario({
        name: '',
        email: '',
        password: '',
        roleId: '',
        phone: '',
        branchId: ''
      })
    } else {
      alert(resultado.error)
    }
    setLoading(false)
  }

  // Manejar eliminación de usuario (API-070 - ELM-130)
  const handleEliminarUsuario = async () => {
    if (!modalEliminar.usuario) return

    setLoading(true)
    const resultado = await UsersService.deleteUser(modalEliminar.usuario.id)

    if (resultado.success) {
      await cargarDatos() // Recargar datos
      setModalEliminar({ isOpen: false, usuario: null })
    } else {
      alert(resultado.error)
    }
    setLoading(false)
  }

  // Manejar activar/desactivar usuario (API-069 - ELM-131)
  const handleToggleEstado = async (usuario) => {
    setLoading(true)
    const resultado = await UsersService.toggleUserStatus(usuario.id, !usuario.isActive)

    if (resultado.success) {
      await cargarDatos() // Recargar datos
    } else {
      alert(resultado.error)
    }
    setLoading(false)
  }

  // Obtener sede por ID
  const getSedeById = (sedeId) => {
    return sedes.find(s => s.id === sedeId)
  }

  // Obtener color del badge según rol
  const getRolColor = (rolName) => {
    const colores = {
      [ROLES.SUPERADMINISTRADOR]: 'purple',
      [ROLES.ADMINISTRADOR]: 'blue',
      [ROLES.COORDINADOR]: 'green',
      [ROLES.PRODUCCION]: 'yellow',
      [ROLES.CLIENTE]: 'gray'
    }
    return colores[rolName] || 'gray'
  }

  // Columnas de la tabla
  const columns = [
    {
      key: 'name',
      title: 'Nombre',
      render: (_, row) => {
        if (!row) return null
        return (
          <div>
            <p className="font-medium text-gray-900">{row.name}</p>
            <p className="text-sm text-gray-500">{row.email}</p>
          </div>
        )
      }
    },
    {
      key: 'role',
      title: 'Rol',
      render: (_, row) => {
        if (!row) return null
        return (
          <Badge color={getRolColor(row.role)}>
            {ROLES_LABELS[row.role] || row.role}
          </Badge>
        )
      }
    },
    {
      key: 'branch',
      title: 'Sede Asignada',
      render: (_, row) => {
        if (!row) return null
        if (isRole(row.role, ROLES.SUPERADMINISTRADOR)) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Todas las sedes
            </span>
          )
        }
        if (isRole(row.role, ROLES.CLIENTE)) {
          return (
            <span className="text-gray-400 text-sm italic">N/A (Cliente)</span>
          )
        }
        const sede = row.branchId ? getSedeById(row.branchId) : null
        if (sede) {
          return (
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: sede.color || '#6366f1' }}
            >
              {sede.name}
            </span>
          )
        }
        return (
          <span className="text-red-500 text-sm">Sin sede</span>
        )
      }
    },
    {
      key: 'phone',
      title: 'Teléfono',
      render: (_, row) => row?.phone || '-'
    },
    {
      key: 'isActive',
      title: 'Estado',
      render: (_, row) => {
        if (!row) return null
        return (
          <Badge color={row.isActive ? 'green' : 'red'}>
            {row.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        )
      }
    },
    {
      key: 'createdAt',
      title: 'Creado',
      render: (_, row) => row ? formatearFecha(row.createdAt) : '-'
    },
    {
      key: 'acciones',
      title: 'Acciones',
      render: (_, row) => {
        if (!row) return null
        return (
          <div className="flex gap-2">
            {/* Botón asignar sede - solo para usuarios internos (no SUPERADMIN ni CLIENTE) */}
            {!isRole(row.role, ROLES.SUPERADMINISTRADOR) && !isRole(row.role, ROLES.CLIENTE) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setModalAsignarSede({ isOpen: true, usuario: row })
                  setSedeSeleccionada(row.branchId?.toString() || '')
                }}
              >
                Cambiar Sede
              </Button>
            )}
            {/* Botón activar/desactivar (ELM-131) */}
            {!isRole(row.role, ROLES.SUPERADMINISTRADOR) && (
              <Button
                variant={row.isActive ? 'danger' : 'success'}
                size="sm"
                onClick={() => handleToggleEstado(row)}
                disabled={loading}
              >
                {row.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            )}
            {/* Botón eliminar */}
            {!isRole(row.role, ROLES.SUPERADMINISTRADOR) && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setModalEliminar({ isOpen: true, usuario: row })}
                disabled={loading}
              >
                Eliminar
              </Button>
            )}
          </div>
        )
      }
    }
  ]

  // Estadísticas
  const stats = useMemo(() => {
    // Contar usuarios sin sede efectiva:
    // - CLIENTE: Todos (los clientes solo tienen ruta, no sede directa)
    // - Otros roles: Si no tienen branchId O si su sede está desactivada
    // - SUPERADMIN: Excluido (tiene acceso a todas las sedes)
    const sinSede = usuarios.filter(u => !tieneSedeActiva(u)).length

    return {
      total: usuarios.length,
      internos: usuariosInternos.length,
      activos: usuarios.filter(u => u.isActive).length,
      sinSede
    }
  }, [usuarios, usuariosInternos, sedesActivasIds])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">Administra usuarios y asigna sedes</p>
        </div>
        <Button onClick={() => setModalCrear(true)} disabled={loading}>
          + Nuevo Usuario
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-l-4 border-red-500 bg-red-50">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Usuarios</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <span className="text-3xl">👥</span>
          </div>
        </Card>

        <Card className="border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Usuarios Internos</p>
              <p className="text-2xl font-bold">{stats.internos}</p>
            </div>
            <span className="text-3xl">🏢</span>
          </div>
        </Card>

        <Card className="border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold">{stats.activos}</p>
            </div>
            <span className="text-3xl">✅</span>
          </div>
        </Card>

        <Card className="border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sin Sede Asignada</p>
              <p className="text-2xl font-bold">{stats.sinSede}</p>
            </div>
            <span className="text-3xl">⚠️</span>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex gap-4 flex-wrap">
          <div className="w-48">
            <Select
              label="Filtrar por Rol"
              options={rolesOptions}
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              label="Filtrar por Sede"
              options={sedesOptions}
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Tabla de usuarios */}
      <Card title={`Usuarios (${usuariosFiltrados.length})`}>
        {loading && <p className="text-gray-500">Cargando...</p>}
        {!loading && (
          <Table
            columns={columns}
            data={usuariosFiltrados}
            emptyMessage="No se encontraron usuarios"
          />
        )}
      </Card>

      {/* Modal Asignar Sede */}
      <Modal
        isOpen={modalAsignarSede.isOpen}
        onClose={() => {
          setModalAsignarSede({ isOpen: false, usuario: null })
          setSedeSeleccionada('')
        }}
        title="Asignar Sede"
      >
        {modalAsignarSede.usuario && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{modalAsignarSede.usuario.name}</p>
              <p className="text-sm text-gray-600">{modalAsignarSede.usuario.email}</p>
              <Badge color={getRolColor(modalAsignarSede.usuario.role)} className="mt-2">
                {ROLES_LABELS[modalAsignarSede.usuario.role]}
              </Badge>
            </div>

            <Select
              label="Seleccionar Sede"
              options={[
                { value: '', label: 'Seleccione una sede...' },
                ...sedesParaAsignar
              ]}
              value={sedeSeleccionada}
              onChange={(e) => setSedeSeleccionada(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setModalAsignarSede({ isOpen: false, usuario: null })
                  setSedeSeleccionada('')
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAsignarSede}
                disabled={!sedeSeleccionada || loading}
              >
                Asignar Sede
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Crear Usuario (ELM-128) */}
      <Modal
        isOpen={modalCrear}
        onClose={() => {
          setModalCrear(false)
          setNuevoUsuario({
            name: '',
            email: '',
            password: '',
            roleId: '',
            phone: '',
            branchId: ''
          })
        }}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleCrearUsuario} className="space-y-4">
          <Input
            label="Nombre"
            value={nuevoUsuario.name}
            onChange={(e) => setNuevoUsuario(prev => ({ ...prev, name: e.target.value }))}
            required
          />

          <Input
            label="Email"
            type="email"
            value={nuevoUsuario.email}
            onChange={(e) => setNuevoUsuario(prev => ({ ...prev, email: e.target.value }))}
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={nuevoUsuario.password}
            onChange={(e) => setNuevoUsuario(prev => ({ ...prev, password: e.target.value }))}
            required
            minLength={6}
          />

          <Input
            label="Teléfono"
            value={nuevoUsuario.phone}
            onChange={(e) => setNuevoUsuario(prev => ({ ...prev, phone: e.target.value }))}
          />

          <Select
            label="Rol"
            options={[
              { value: '', label: 'Seleccione un rol...' },
              { value: ROLE_IDS.administrador, label: 'Administrador' },
              { value: ROLE_IDS.coordinador, label: 'Coordinador' },
              { value: ROLE_IDS.produccion, label: 'Producción' }
            ]}
            value={nuevoUsuario.roleId}
            onChange={(e) => setNuevoUsuario(prev => ({ ...prev, roleId: e.target.value }))}
            required
          />

          {/* Selector de sede obligatorio para usuarios internos */}
          {nuevoUsuario.roleId && (
            <Select
              label="Sede"
              options={[
                { value: '', label: 'Seleccione una sede...' },
                ...sedesParaAsignar
              ]}
              value={nuevoUsuario.branchId}
              onChange={(e) => setNuevoUsuario(prev => ({ ...prev, branchId: e.target.value }))}
              required
            />
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setModalCrear(false)
                setNuevoUsuario({
                  name: '',
                  email: '',
                  password: '',
                  roleId: '',
                  phone: '',
                  branchId: ''
                })
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminacion (ELM-130) */}
      <Modal
        isOpen={modalEliminar.isOpen}
        onClose={() => setModalEliminar({ isOpen: false, usuario: null })}
        title="Confirmar Eliminación"
      >
        {modalEliminar.usuario && (
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-yellow-800">
                ¿Está seguro que desea eliminar este usuario?
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{modalEliminar.usuario.name}</p>
              <p className="text-sm text-gray-600">{modalEliminar.usuario.email}</p>
              <Badge color={getRolColor(modalEliminar.usuario.role)} className="mt-2">
                {ROLES_LABELS[modalEliminar.usuario.role]}
              </Badge>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setModalEliminar({ isOpen: false, usuario: null })}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleEliminarUsuario}
                disabled={loading}
              >
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Usuarios
