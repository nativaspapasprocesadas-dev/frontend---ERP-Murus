import { useState } from 'react'
import { Card } from '@components/common'
import { Button } from '@components/common'
import { Badge } from '@components/common'
import { useComments } from '@hooks/useComments'
import { formatearFecha } from '@utils/formatters'
import useAuthStore from '@features/auth/useAuthStore'

/**
 * Componente reutilizable para sistema de comentarios
 *
 * Principios SOLID:
 * - Single Responsibility: Solo renderiza y maneja comentarios
 * - Open/Closed: Extensible vía props, no requiere modificación
 * - Liskov Substitution: Puede usarse en cualquier vista
 * - Interface Segregation: Props específicas y necesarias
 * - Dependency Inversion: Depende de abstracciones (props)
 *
 * @param {string} entidadTipo - Tipo de entidad (pedido, ruta, produccion, etc.)
 * @param {number} entidadId - ID de la entidad
 * @param {string} titulo - Título de la sección (opcional)
 * @param {boolean} mostrarUltimoDestacado - Mostrar último comentario destacado (default: true)
 */
const ComentariosSection = ({
  entidadTipo,
  entidadId,
  titulo = 'Comentarios',
  mostrarUltimoDestacado = true
}) => {
  const { user } = useAuthStore()
  const {
    comentarios,
    loading: loadingComentarios,
    error: errorComentarios,
    puedeComentcar,
    getUltimoComentario,
    createComentario,
    updateComentario,
    deleteComentario,
    getPermisosConfig
  } = useComments(entidadTipo, entidadId)

  // Estado local
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [comentarioEditando, setComentarioEditando] = useState(null)
  const [textoEditando, setTextoEditando] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarTodos, setMostrarTodos] = useState(true)

  // Obtener comentarios
  const ultimoComentario = getUltimoComentario()

  // Configuración de permisos
  const permisosConfig = getPermisosConfig(entidadTipo)

  /**
   * Agregar nuevo comentario
   */
  const handleAgregarComentario = async () => {
    if (!nuevoComentario.trim()) {
      setError('El comentario no puede estar vacío')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createComentario(
      nuevoComentario,
      permisosConfig
    )

    setLoading(false)

    if (result.success) {
      setNuevoComentario('')
      setError(null)
    } else {
      setError(result.error)
    }
  }

  /**
   * Iniciar edición de comentario
   */
  const handleIniciarEdicion = (comentario) => {
    setComentarioEditando(comentario.id)
    setTextoEditando(comentario.texto)
    setError(null)
  }

  /**
   * Cancelar edición
   */
  const handleCancelarEdicion = () => {
    setComentarioEditando(null)
    setTextoEditando('')
    setError(null)
  }

  /**
   * Guardar comentario editado
   */
  const handleGuardarEdicion = async (comentarioId) => {
    if (!textoEditando.trim()) {
      setError('El comentario no puede estar vacío')
      return
    }

    setLoading(true)
    setError(null)

    const result = await updateComentario(comentarioId, textoEditando)

    setLoading(false)

    if (result.success) {
      setComentarioEditando(null)
      setTextoEditando('')
      setError(null)
    } else {
      setError(result.error)
    }
  }

  /**
   * Eliminar comentario
   */
  const handleEliminarComentario = async (comentarioId) => {
    if (!window.confirm('¿Estás seguro de eliminar este comentario?')) {
      return
    }

    setLoading(true)
    setError(null)

    const result = await deleteComentario(comentarioId)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
    }
  }

  /**
   * Renderizar comentario individual
   */
  const renderComentario = (comentario, esUltimo = false) => {
    const estaEditando = comentarioEditando === comentario.id

    return (
      <div
        key={comentario.id}
        className={`p-4 rounded-lg border ${
          esUltimo && mostrarUltimoDestacado
            ? 'bg-blue-50 border-blue-300 shadow-md'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        {/* Header: Usuario, fecha y acciones */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">
                {comentario.nombreUsuario}
              </span>
              <Badge variant="info" className="text-xs">
                {comentario.rolUsuario}
              </Badge>
              {esUltimo && mostrarUltimoDestacado && (
                <Badge variant="success" className="text-xs">
                  Último
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span>
                {formatearFecha(comentario.fechaCreacion, 'dd/MM/yyyy HH:mm')}
              </span>
              {comentario.editado && (
                <>
                  <span>•</span>
                  <span className="italic">
                    Editado {formatearFecha(comentario.fechaActualizacion, 'dd/MM/yyyy HH:mm')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Acciones (solo para comentarios propios) */}
          {comentario.puedeEditar && !estaEditando && (
            <div className="flex gap-2">
              <button
                onClick={() => handleIniciarEdicion(comentario)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                title="Editar"
              >
                Editar
              </button>
              <button
                onClick={() => handleEliminarComentario(comentario.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                title="Eliminar"
              >
                Eliminar
              </button>
            </div>
          )}
        </div>

        {/* Contenido del comentario */}
        {estaEditando ? (
          <div className="space-y-3">
            <textarea
              value={textoEditando}
              onChange={(e) => setTextoEditando(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {textoEditando.length}/1000 caracteres
              </span>
              <div className="flex gap-2">
                {textoEditando.trim() && textoEditando !== comentario.texto && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setTextoEditando(comentario.texto)}
                    disabled={loading}
                  >
                    Restaurar
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleGuardarEdicion(comentario.id)}
                  loading={loading}
                  disabled={!textoEditando.trim() || textoEditando === comentario.texto}
                >
                  Guardar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancelarEdicion}
                  disabled={loading}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{comentario.texto}</p>
        )}
      </div>
    )
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Título */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {titulo} ({comentarios.length})
          </h3>
          {comentarios.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setMostrarTodos(!mostrarTodos)}
            >
              {mostrarTodos ? 'Ocultar historial' : 'Ver historial completo'}
            </Button>
          )}
        </div>

        {/* Formulario para nuevo comentario (solo si tiene permisos) */}
        {puedeComentcar && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700">
              Agregar comentario
            </label>
            <textarea
              value={nuevoComentario}
              onChange={(e) => setNuevoComentario(e.target.value)}
              placeholder="Escribe tu comentario aquí..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {nuevoComentario.length}/1000 caracteres
              </span>
              <div className="flex gap-2">
                {nuevoComentario.trim() && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setNuevoComentario('')}
                    disabled={loading}
                  >
                    Limpiar
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAgregarComentario}
                  loading={loading}
                  disabled={!nuevoComentario.trim()}
                >
                  Agregar Comentario
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Lista de comentarios */}
        <div className="space-y-3">
          {comentarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {puedeComentcar
                  ? 'No hay comentarios aún. Sé el primero en agregar uno.'
                  : 'No hay comentarios disponibles.'}
              </p>
            </div>
          ) : mostrarTodos ? (
            // Mostrar todos los comentarios
            comentarios.map((comentario, index) =>
              renderComentario(comentario, index === 0)
            )
          ) : (
            // Mostrar solo el último comentario
            ultimoComentario && renderComentario(ultimoComentario, true)
          )}
        </div>        
      </div>
    </Card>
  )
}

export default ComentariosSection
