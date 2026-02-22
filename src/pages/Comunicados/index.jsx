import { useState, useEffect } from 'react'
import { Card, Button, Input, Modal, Badge, ImageUpload } from '@components/common'
import { useAnnouncements } from '@hooks/useAnnouncements'
import { CustomersService } from '@services/CustomersService'
import { formatearFecha } from '@utils/formatters'
import {
  PRIORIDADES_COMUNICADO,
  PRIORIDADES_COMUNICADO_LABELS,
  PRIORIDADES_COMUNICADO_COLORS,
  PRIORIDADES_COMUNICADO_EMOJIS
} from '@utils/constants'

/**
 * Vista de Comunicados - ELM-060, ELM-061 (modal), ELM-062 (formulario), ELM-068 (boton eliminar)
 * Admin/Coordinador: Crear, editar, eliminar comunicados
 * Cliente: Solo visualizar comunicados dirigidos a ellos
 *
 * INTEGRACIÓN REAL (sin mocks):
 * - API-027 (GET /api/v1/announcements): Listar comunicados
 * - API-028 (POST /api/v1/announcements): Crear comunicado
 * - API-029 (PUT /api/v1/announcements/:id): Actualizar comunicado
 * - API-030 (DELETE /api/v1/announcements/:id): Eliminar comunicado
 * - API-016 (GET /api/v1/customers): Listar clientes para destinatarios (reemplaza useMockClientes)
 */
const Comunicados = () => {
  const {
    comunicados,
    loading,
    puedeGestionar,
    crearComunicado,
    actualizarComunicado,
    eliminarComunicado
  } = useAnnouncements()

  // Estado para clientes reales (API-016)
  const [clientes, setClientes] = useState([])
  const [loadingClientes, setLoadingClientes] = useState(false)

  const [mostrarModal, setMostrarModal] = useState(false)
  const [comunicadoEditando, setComunicadoEditando] = useState(null)
  const [mostrarImagenModal, setMostrarImagenModal] = useState(false)
  const [imagenVisualizando, setImagenVisualizando] = useState(null)

  // Modal de notificaciones
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false)
  const [notificacion, setNotificacion] = useState({ tipo: 'success', mensaje: '' })

  // Modal de confirmación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)
  const [accionConfirmacion, setAccionConfirmacion] = useState(null)

  const [formData, setFormData] = useState({
    titulo: '',
    mensaje: '',
    prioridad: PRIORIDADES_COMUNICADO.MEDIA,
    destinatarios: 'todos',
    clientesSeleccionados: [],
    imagenFile: null,      // Archivo File para subir
    imagenPreview: null,   // URL o base64 para mostrar
    imagenUrl: null        // URL del servidor (para edición)
  })
  const [formErrors, setFormErrors] = useState({})

  // Cargar clientes desde API-016 cuando el usuario pueda gestionar
  useEffect(() => {
    const cargarClientes = async () => {
      if (!puedeGestionar) return

      setLoadingClientes(true)
      try {
        const response = await CustomersService.listCustomers({ pageSize: 1000 })
        if (response.success && response.data) {
          // Mapear campos de API a formato del frontend
          const clientesMapeados = response.data.map(c => ({
            id: c.id,
            nombre: c.name,
            email: c.email,
            phone: c.phone
          }))
          setClientes(clientesMapeados)
        }
      } catch (error) {
        console.error('Error cargando clientes:', error)
        setClientes([])
      } finally {
        setLoadingClientes(false)
      }
    }

    cargarClientes()
  }, [puedeGestionar])

  // Helper para mostrar notificaciones
  const mostrarNotificacionExito = (mensaje) => {
    setNotificacion({ tipo: 'success', mensaje })
    setMostrarNotificacion(true)
  }

  const mostrarNotificacionError = (mensaje) => {
    setNotificacion({ tipo: 'error', mensaje })
    setMostrarNotificacion(true)
  }

  // Helper para solicitar confirmación
  const solicitarConfirmacion = (mensaje, accion) => {
    setNotificacion({ tipo: 'warning', mensaje })
    setAccionConfirmacion(() => accion)
    setMostrarConfirmacion(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleDestinatariosChange = (e) => {
    const { value } = e.target
    setFormData(prev => ({
      ...prev,
      destinatarios: value,
      clientesSeleccionados: value === 'todos' ? [] : prev.clientesSeleccionados
    }))
  }

  const handleClienteToggle = (clienteId) => {
    setFormData(prev => {
      const seleccionados = prev.clientesSeleccionados.includes(clienteId)
        ? prev.clientesSeleccionados.filter(id => id !== clienteId)
        : [...prev.clientesSeleccionados, clienteId]

      return { ...prev, clientesSeleccionados: seleccionados }
    })
  }

  const handleImageUpload = (imageData) => {
    if (imageData === null) {
      // Se elimino la imagen
      setFormData(prev => ({
        ...prev,
        imagenFile: null,
        imagenPreview: null,
        removeImage: prev.imagenUrl ? true : false // Marcar para eliminar si habia imagen del servidor
      }))
    } else {
      // Nueva imagen subida
      setFormData(prev => ({
        ...prev,
        imagenFile: imageData.file,
        imagenPreview: imageData.preview,
        removeImage: false
      }))
    }
  }

  const validate = () => {
    const errors = {}

    if (!formData.titulo || formData.titulo.trim().length < 3) {
      errors.titulo = 'El título debe tener al menos 3 caracteres'
    }

    if (!formData.mensaje || formData.mensaje.trim().length < 10) {
      errors.mensaje = 'El mensaje debe tener al menos 10 caracteres'
    }

    if (formData.destinatarios === 'especificos' && formData.clientesSeleccionados.length === 0) {
      errors.destinatarios = 'Selecciona al menos un cliente'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNuevoComunicado = () => {
    setComunicadoEditando(null)
    setFormData({
      titulo: '',
      mensaje: '',
      prioridad: PRIORIDADES_COMUNICADO.MEDIA,
      destinatarios: 'todos',
      clientesSeleccionados: [],
      imagenFile: null,
      imagenPreview: null,
      imagenUrl: null,
      removeImage: false
    })
    setFormErrors({})
    setMostrarModal(true)
  }

  const handleEditarComunicado = (comunicado) => {
    setComunicadoEditando(comunicado)
    setFormData({
      titulo: comunicado.titulo,
      mensaje: comunicado.mensaje,
      prioridad: comunicado.prioridad,
      destinatarios: comunicado.destinatarios === 'todos' ? 'todos' : 'especificos',
      clientesSeleccionados: Array.isArray(comunicado.destinatarios) ? comunicado.destinatarios : [],
      imagenFile: null,
      imagenPreview: null,
      imagenUrl: comunicado.imagen, // URL del servidor
      removeImage: false
    })
    setFormErrors({})
    setMostrarModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const datosFinales = {
      titulo: formData.titulo.trim(),
      mensaje: formData.mensaje.trim(),
      prioridad: formData.prioridad,
      destinatarios: formData.destinatarios === 'todos' ? 'todos' : formData.clientesSeleccionados,
      imagenFile: formData.imagenFile, // Archivo File para subir
      removeImage: formData.removeImage // Para eliminar imagen existente
    }

    let resultado
    if (comunicadoEditando) {
      resultado = await actualizarComunicado(comunicadoEditando.id, datosFinales)
    } else {
      resultado = await crearComunicado(datosFinales)
    }

    if (!resultado.success) {
      mostrarNotificacionError(resultado.error)
      return
    }

    setMostrarModal(false)
    mostrarNotificacionExito(`Comunicado ${comunicadoEditando ? 'actualizado' : 'creado'} exitosamente`)
  }

  const handleEliminar = (id) => {
    solicitarConfirmacion(
      '¿Estás seguro de que deseas eliminar este comunicado? Esta acción no se puede deshacer.',
      async () => {
        const resultado = await eliminarComunicado(id)
        if (!resultado.success) {
          mostrarNotificacionError(resultado.error)
          return
        }
        mostrarNotificacionExito('Comunicado eliminado exitosamente')
      }
    )
  }

  const confirmarAccion = async () => {
    setMostrarConfirmacion(false)
    if (accionConfirmacion) {
      await accionConfirmacion()
      setAccionConfirmacion(null)
    }
  }

  const cancelarAccion = () => {
    setMostrarConfirmacion(false)
    setAccionConfirmacion(null)
  }

  const handleVerImagen = (imagen) => {
    setImagenVisualizando(imagen)
    setMostrarImagenModal(true)
  }

  const getDestinatariosTexto = (comunicado) => {
    if (comunicado.destinatarios === 'todos') {
      return `Todos los clientes (${clientes.length})`
    }
    if (Array.isArray(comunicado.destinatarios)) {
      return `${comunicado.destinatarios.length} cliente${comunicado.destinatarios.length > 1 ? 's' : ''} seleccionado${comunicado.destinatarios.length > 1 ? 's' : ''}`
    }
    return 'Sin destinatarios'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📢 Comunicados</h1>
          <p className="text-gray-600 mt-1">
            {puedeGestionar
              ? 'Envía comunicados e información importante a tus clientes'
              : 'Revisa los comunicados y avisos importantes'}
          </p>
        </div>
        {puedeGestionar && (
          <Button onClick={handleNuevoComunicado}>
            ➕ Nuevo Comunicado
          </Button>
        )}
      </div>

      {/* Lista de Comunicados */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-lg">Cargando comunicados...</p>
            </div>
          </Card>
        ) : comunicados.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">No hay comunicados disponibles</p>
            </div>
          </Card>
        ) : (
          comunicados.map(comunicado => (
            <Card key={comunicado.id}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={PRIORIDADES_COMUNICADO_COLORS[comunicado.prioridad]}>
                        {PRIORIDADES_COMUNICADO_EMOJIS[comunicado.prioridad]}{' '}
                        {PRIORIDADES_COMUNICADO_LABELS[comunicado.prioridad]}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {comunicado.titulo}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        📅 {formatearFecha(comunicado.fechaCreacion, 'dd/MM/yyyy HH:mm')}
                      </span>
                      {puedeGestionar && (
                        <>
                          <span>•</span>
                          <span>Por: {comunicado.creadorNombre}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {puedeGestionar && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEditarComunicado(comunicado)}
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleEliminar(comunicado.id)}
                      >
                        🗑️ Eliminar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mensaje */}
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {comunicado.mensaje}
                </div>

                {/* Imagen adjunta */}
                {comunicado.imagen && (
                  <div>
                    <img
                      src={comunicado.imagen.startsWith('/uploads/')
                        ? `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'}${comunicado.imagen}`
                        : comunicado.imagen
                      }
                      alt="Imagen del comunicado"
                      className="max-w-md w-full h-48 object-cover rounded-lg border-2 border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleVerImagen(
                        comunicado.imagen.startsWith('/uploads/')
                          ? `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'}${comunicado.imagen}`
                          : comunicado.imagen
                      )}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      📷 Haz clic para ver la imagen completa
                    </p>
                  </div>
                )}

                {/* Destinatarios (solo visible para admin/coordinador) */}
                {puedeGestionar && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">
                      👥 Destinatarios: <span className="font-semibold">{getDestinatariosTexto(comunicado)}</span>
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal de Formulario */}
      <Modal
        isOpen={mostrarModal}
        onClose={() => setMostrarModal(false)}
        title={comunicadoEditando ? 'Editar Comunicado' : 'Nuevo Comunicado'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            error={formErrors.titulo}
            required
            placeholder="Ej: Nuevos horarios de entrega"
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Prioridad <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {Object.values(PRIORIDADES_COMUNICADO).map(prioridad => (
                <label
                  key={prioridad}
                  className={`flex-1 border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    formData.prioridad === prioridad
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="prioridad"
                    value={prioridad}
                    checked={formData.prioridad === prioridad}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {PRIORIDADES_COMUNICADO_EMOJIS[prioridad]}
                    </div>
                    <div className="text-sm font-medium">
                      {PRIORIDADES_COMUNICADO_LABELS[prioridad]}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Mensaje <span className="text-red-500">*</span>
            </label>
            <textarea
              name="mensaje"
              value={formData.mensaje}
              onChange={handleChange}
              className="input min-h-[120px]"
              placeholder="Escribe el mensaje del comunicado..."
            />
            {formErrors.mensaje && (
              <p className="text-sm text-red-500">{formErrors.mensaje}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Destinatarios <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDestinatarios"
                  value="todos"
                  checked={formData.destinatarios === 'todos'}
                  onChange={handleDestinatariosChange}
                  className="w-4 h-4"
                />
                <span>Todos los clientes ({clientes.length})</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipoDestinatarios"
                  value="especificos"
                  checked={formData.destinatarios === 'especificos'}
                  onChange={handleDestinatariosChange}
                  className="w-4 h-4"
                />
                <span>Clientes específicos</span>
              </label>

              {formData.destinatarios === 'especificos' && (
                <div className="ml-6 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {loadingClientes ? (
                    <div className="text-center text-sm text-gray-500 py-2">Cargando clientes...</div>
                  ) : clientes.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-2">No hay clientes disponibles</div>
                  ) : (
                    <div className="space-y-2">
                      {clientes.map(cliente => (
                      <label
                        key={cliente.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.clientesSeleccionados.includes(cliente.id)}
                          onChange={() => handleClienteToggle(cliente.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{cliente.nombre}</span>
                      </label>
                    ))}
                    </div>
                  )}
                </div>
              )}
              {formErrors.destinatarios && (
                <p className="text-sm text-red-500">{formErrors.destinatarios}</p>
              )}
            </div>
          </div>

          <ImageUpload
            label="Imagen"
            onImageUpload={handleImageUpload}
            currentImage={formData.imagenPreview || formData.imagenUrl}
            required={false}
          />

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setMostrarModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {comunicadoEditando ? 'Actualizar' : 'Publicar'} Comunicado
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Visualización de Imagen */}
      <Modal
        isOpen={mostrarImagenModal}
        onClose={() => setMostrarImagenModal(false)}
        title="Imagen del Comunicado"
        size="xl"
      >
        {imagenVisualizando && (
          <div className="flex justify-center">
            <img
              src={imagenVisualizando}
              alt="Imagen completa"
              className="max-w-full h-auto rounded-lg"
            />
          </div>
        )}
      </Modal>

      {/* Modal de Notificación */}
      <Modal
        isOpen={mostrarNotificacion}
        onClose={() => setMostrarNotificacion(false)}
        title={notificacion.tipo === 'success' ? '✅ Éxito' : notificacion.tipo === 'error' ? '❌ Error' : '⚠️ Atención'}
      >
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            notificacion.tipo === 'success' ? 'bg-green-50 border border-green-200' :
            notificacion.tipo === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`text-sm ${
              notificacion.tipo === 'success' ? 'text-green-800' :
              notificacion.tipo === 'error' ? 'text-red-800' :
              'text-yellow-800'
            }`}>
              {notificacion.mensaje}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setMostrarNotificacion(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={mostrarConfirmacion}
        onClose={cancelarAccion}
        title="⚠️ Confirmación"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              {notificacion.mensaje}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={cancelarAccion}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarAccion}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Comunicados
