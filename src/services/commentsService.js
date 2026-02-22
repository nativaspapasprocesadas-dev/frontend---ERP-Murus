/**
 * Comments Service - ELM-015
 * Servicio para manejar comentarios polimórficos
 */
import apiClient from '@lib/api';

/**
 * Obtener comentarios de una entidad
 * @param {string} entidadTipo - Tipo de entidad (PEDIDO, PRODUCCION, CLIENTE, RUTA)
 * @param {string|number} entidadId - ID de la entidad
 * @returns {Promise<Array>} Lista de comentarios
 */
export const getCommentsByEntity = async (entidadTipo, entidadId) => {
  try {
    const response = await apiClient.get(`/comments/${entidadTipo}/${entidadId}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    throw error;
  }
};

/**
 * Crear comentario
 * @param {Object} data - Datos del comentario
 * @param {string} data.entidadTipo - Tipo de entidad
 * @param {string|number} data.entidadId - ID de la entidad
 * @param {string} data.texto - Contenido del comentario
 * @returns {Promise<Object>} Comentario creado
 */
export const createComment = async (data) => {
  try {
    const response = await apiClient.post('/comments', data);
    return response.data;
  } catch (error) {
    console.error('Error creando comentario:', error);
    throw error;
  }
};

/**
 * Actualizar comentario
 * @param {number} id - ID del comentario
 * @param {string} texto - Nuevo contenido
 * @returns {Promise<Object>} Comentario actualizado
 */
export const updateComment = async (id, texto) => {
  try {
    const response = await apiClient.put(`/comments/${id}`, { texto });
    return response.data;
  } catch (error) {
    console.error('Error actualizando comentario:', error);
    throw error;
  }
};

/**
 * Eliminar comentario
 * @param {number} id - ID del comentario
 * @returns {Promise<Object>} Confirmación
 */
export const deleteComment = async (id) => {
  try {
    const response = await apiClient.delete(`/comments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando comentario:', error);
    throw error;
  }
};
