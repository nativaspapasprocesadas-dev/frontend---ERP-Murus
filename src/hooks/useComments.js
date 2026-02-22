/**
 * useComments Hook - ELM-015
 * Hook para manejar comentarios con APIs reales
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCommentsByEntity,
  createComment as createCommentAPI,
  updateComment as updateCommentAPI,
  deleteComment as deleteCommentAPI
} from '@services/commentsService';
import { onEvent, offEvent, joinBranch, joinGlobal } from '@services/socketService';
import useAuthStore from '@features/auth/useAuthStore';
import { ROLES } from '@utils/constants';

/**
 * Configuración de permisos por entidad
 */
const PERMISOS_POR_ENTIDAD = {
  'PEDIDO': [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.PRODUCCION],
  'RUTA': [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR],
  'PRODUCCION': [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR],
  'CLIENTE': [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR],
  'DEFAULT': [ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]
};

/**
 * Hook principal para comentarios
 * @param {string} entidadTipo - Tipo de entidad
 * @param {string|number} entidadId - ID de la entidad
 * @returns {Object} Estado y funciones del hook
 */
export const useComments = (entidadTipo, entidadId) => {
  const { user, getSedeIdParaFiltro } = useAuthStore();
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Obtener roles permitidos para una entidad
   */
  const getRolesPermitidos = useCallback((tipo) => {
    const tipoUpper = tipo?.toUpperCase();
    return PERMISOS_POR_ENTIDAD[tipoUpper] || PERMISOS_POR_ENTIDAD['DEFAULT'];
  }, []);

  /**
   * Verificar si el usuario puede comentar
   */
  const puedeComentcar = useCallback(() => {
    const rolesPermitidos = getRolesPermitidos(entidadTipo);
    return rolesPermitidos.includes(user?.rol);
  }, [entidadTipo, user, getRolesPermitidos]);

  /**
   * Cargar comentarios
   */
  const loadComments = useCallback(async () => {
    if (!entidadTipo || !entidadId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getCommentsByEntity(entidadTipo, entidadId);

      // Expandir comentarios con datos de permisos
      const comentariosExpandidos = (response.data || []).map(comentario => ({
        ...comentario,
        puedeEditar: comentario.usuarioId === user?.id,
        puedeEliminar: comentario.usuarioId === user?.id
      }));

      setComentarios(comentariosExpandidos);
    } catch (err) {
      console.error('Error cargando comentarios:', err);
      setError('Error al cargar comentarios');
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  }, [entidadTipo, entidadId, user]);

  /**
   * Crear comentario
   */
  const createComentario = useCallback(async (texto, permisosConfig = null) => {
    // Validaciones
    if (!texto || texto.trim().length === 0) {
      return {
        success: false,
        error: 'El comentario no puede estar vacío'
      };
    }

    if (texto.trim().length > 1000) {
      return {
        success: false,
        error: 'El comentario no puede exceder los 1000 caracteres'
      };
    }

    // Verificar permisos
    if (permisosConfig) {
      const tienePermiso = permisosConfig.rolesPermitidos.includes(user?.rol);
      if (!tienePermiso) {
        return {
          success: false,
          error: 'No tienes permisos para agregar comentarios'
        };
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await createCommentAPI({
        entidadTipo,
        entidadId,
        texto: texto.trim()
      });

      // Recargar comentarios
      await loadComments();

      return {
        success: true,
        message: 'Comentario agregado exitosamente',
        data: response.data
      };
    } catch (err) {
      console.error('Error creando comentario:', err);
      const errorMsg = err.response?.data?.error || 'Error al crear el comentario';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  }, [entidadTipo, entidadId, user, loadComments]);

  /**
   * Actualizar comentario
   */
  const updateComentario = useCallback(async (comentarioId, nuevoTexto) => {
    const comentario = comentarios.find(c => c.id === comentarioId);

    if (!comentario) {
      return {
        success: false,
        error: 'Comentario no encontrado'
      };
    }

    // Validar que es el propietario
    if (comentario.usuarioId !== user?.id) {
      return {
        success: false,
        error: 'Solo puedes editar tus propios comentarios'
      };
    }

    // Validaciones
    if (!nuevoTexto || nuevoTexto.trim().length === 0) {
      return {
        success: false,
        error: 'El comentario no puede estar vacío'
      };
    }

    if (nuevoTexto.trim().length > 1000) {
      return {
        success: false,
        error: 'El comentario no puede exceder los 1000 caracteres'
      };
    }

    setLoading(true);
    setError(null);

    try {
      const response = await updateCommentAPI(comentarioId, nuevoTexto.trim());

      // Recargar comentarios
      await loadComments();

      return {
        success: true,
        message: 'Comentario actualizado exitosamente',
        data: response.data
      };
    } catch (err) {
      console.error('Error actualizando comentario:', err);
      const errorMsg = err.response?.data?.error || 'Error al actualizar el comentario';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  }, [comentarios, user, loadComments]);

  /**
   * Eliminar comentario
   */
  const deleteComentario = useCallback(async (comentarioId) => {
    const comentario = comentarios.find(c => c.id === comentarioId);

    if (!comentario) {
      return {
        success: false,
        error: 'Comentario no encontrado'
      };
    }

    // Validar que es el propietario
    if (comentario.usuarioId !== user?.id) {
      return {
        success: false,
        error: 'Solo puedes eliminar tus propios comentarios'
      };
    }

    setLoading(true);
    setError(null);

    try {
      await deleteCommentAPI(comentarioId);

      // Recargar comentarios
      await loadComments();

      return {
        success: true,
        message: 'Comentario eliminado exitosamente'
      };
    } catch (err) {
      console.error('Error eliminando comentario:', err);
      const errorMsg = err.response?.data?.error || 'Error al eliminar el comentario';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg
      };
    } finally {
      setLoading(false);
    }
  }, [comentarios, user, loadComments]);

  /**
   * Obtener último comentario
   */
  const getUltimoComentario = useCallback(() => {
    return comentarios.length > 0 ? comentarios[0] : null;
  }, [comentarios]);

  /**
   * Obtener configuración de permisos
   */
  const getPermisosConfig = useCallback((tipo) => {
    const rolesPermitidos = getRolesPermitidos(tipo);
    return { rolesPermitidos };
  }, [getRolesPermitidos]);

  // Cargar comentarios al montar o cuando cambien las dependencias
  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Suscribirse a eventos Socket.IO para actualizacion en tiempo real
  const loadCommentsRef = useRef(loadComments);
  loadCommentsRef.current = loadComments;

  useEffect(() => {
    if (!entidadTipo || !entidadId) return;

    // Asegurar que el socket este unido a la sala correcta
    // Usa getSedeIdParaFiltro() que para SUPERADMIN retorna sedeIdActiva
    const sedeId = getSedeIdParaFiltro()
    if (sedeId) {
      joinBranch(sedeId)
    } else {
      joinGlobal()
    }

    const handleComentarioChange = (payload) => {
      // Solo recargar si el evento es para la misma entidad que estamos viendo
      if (
        payload.entidadTipo === entidadTipo.toUpperCase() &&
        String(payload.entidadId) === String(entidadId)
      ) {
        console.log('[Comentarios Socket] Evento recibido, recargando...', payload);
        loadCommentsRef.current();
      }
    };

    onEvent('comentario:creado', handleComentarioChange);
    onEvent('comentario:actualizado', handleComentarioChange);
    onEvent('comentario:eliminado', handleComentarioChange);

    return () => {
      offEvent('comentario:creado', handleComentarioChange);
      offEvent('comentario:actualizado', handleComentarioChange);
      offEvent('comentario:eliminado', handleComentarioChange);
    };
  }, [entidadTipo, entidadId, user]);

  return {
    comentarios,
    loading,
    error,
    puedeComentcar: puedeComentcar(),
    getComentariosByEntidad: () => comentarios,
    getUltimoComentario,
    createComentario,
    updateComentario,
    deleteComentario,
    getPermisosConfig,
    reload: loadComments
  };
};
