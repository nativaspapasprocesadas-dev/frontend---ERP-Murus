/**
 * Socket Service - Conexion Socket.IO para tiempo real
 *
 * Singleton que gestiona la conexion WebSocket con el backend.
 * Se conecta automaticamente al iniciar y se reconecta si se pierde la conexion.
 * Re-une a las salas automaticamente al reconectar.
 *
 * Uso:
 *   import { getSocket, onEvent, offEvent } from '@services/socketService'
 *
 *   // Escuchar evento
 *   onEvent('pedido:creado', (data) => { ... })
 *
 *   // Dejar de escuchar
 *   offEvent('pedido:creado', handler)
 */

import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '')
  : 'http://localhost:4020'

let socket = null

// Guardar salas activas para re-unirse al reconectar
const activeRooms = {
  branchId: null,
  isGlobal: false
}

/**
 * Re-unirse a las salas activas (se llama al conectar/reconectar)
 */
const rejoinRooms = (s) => {
  if (activeRooms.branchId) {
    s.emit('join-branch', activeRooms.branchId)
    console.log(`[Socket.IO] Re-unido a sala branch-${activeRooms.branchId}`)
  }
  if (activeRooms.isGlobal) {
    s.emit('join-global')
    console.log('[Socket.IO] Re-unido a sala global')
  }
}

/**
 * Obtener o crear la instancia del socket
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    })

    socket.on('connect', () => {
      console.log('[Socket.IO] Conectado:', socket.id)
      // Re-unirse a salas al conectar (incluye reconexion)
      rejoinRooms(socket)
    })

    socket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Desconectado:', reason)
    })

    socket.on('connect_error', (err) => {
      console.log('[Socket.IO] Error de conexion:', err.message)
    })
  }

  return socket
}

/**
 * Unirse a la sala de una sede (para recibir solo eventos de esa sede)
 * @param {number} branchId - ID de la sede
 */
export const joinBranch = (branchId) => {
  if (!branchId) return
  activeRooms.branchId = branchId
  const s = getSocket()
  s.emit('join-branch', branchId)
}

/**
 * Unirse a la sala global (SUPERADMINISTRADOR - recibe eventos de todas las sedes)
 */
export const joinGlobal = () => {
  activeRooms.isGlobal = true
  const s = getSocket()
  s.emit('join-global')
}

/**
 * Escuchar un evento del socket
 * @param {string} event - Nombre del evento
 * @param {Function} handler - Callback
 */
export const onEvent = (event, handler) => {
  const s = getSocket()
  s.on(event, handler)
}

/**
 * Dejar de escuchar un evento
 * @param {string} event - Nombre del evento
 * @param {Function} handler - Callback a remover
 */
export const offEvent = (event, handler) => {
  const s = getSocket()
  s.off(event, handler)
}

/**
 * Escuchar reconexion del socket (para recuperar eventos perdidos)
 * Usa el Manager (.io) que emite 'reconnect' solo en reconexiones, no en conexion inicial
 * @param {Function} handler - Callback
 */
export const onReconnect = (handler) => {
  const s = getSocket()
  s.io.on('reconnect', handler)
}

/**
 * Dejar de escuchar reconexion
 * @param {Function} handler - Callback a remover
 */
export const offReconnect = (handler) => {
  const s = getSocket()
  s.io.off('reconnect', handler)
}

/**
 * Desconectar el socket (para logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  activeRooms.branchId = null
  activeRooms.isGlobal = false
}

export default { getSocket, joinBranch, joinGlobal, onEvent, offEvent, onReconnect, offReconnect, disconnectSocket }
