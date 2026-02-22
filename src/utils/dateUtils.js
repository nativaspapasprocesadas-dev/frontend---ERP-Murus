/**
 * Utilidades de fecha para manejo correcto de timezone
 *
 * IMPORTANTE: Todas las funciones usan explícitamente timezone America/Lima (Perú)
 * para garantizar consistencia entre desarrollo local y producción (Railway UTC).
 *
 * Esto evita el problema de toISOString() que convierte a UTC y puede cambiar el día.
 *
 * Ejemplo del problema sin timezone explícito:
 * - Usuario en servidor UTC: 16/01/2026 01:00 (Railway)
 * - Pero en Perú son: 15/01/2026 20:00
 * - Sin timezone explícito se usaría el día 16 en vez del 15
 */

const PERU_TIMEZONE = 'America/Lima'

/**
 * Obtiene un objeto Date con la hora actual de Perú
 * @returns {Date} Date object con hora de Perú
 */
const getPeruDate = () => {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: PERU_TIMEZONE }))
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD usando timezone de Perú
 * @returns {string} Fecha en formato "YYYY-MM-DD"
 */
export const getLocalDate = () => {
  const peruDate = getPeruDate()
  const year = peruDate.getFullYear()
  const month = String(peruDate.getMonth() + 1).padStart(2, '0')
  const day = String(peruDate.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene la fecha de mañana en formato YYYY-MM-DD usando timezone de Perú
 * @returns {string} Fecha de mañana en formato "YYYY-MM-DD"
 */
export const getLocalDateTomorrow = () => {
  const tomorrow = getPeruDate()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const year = tomorrow.getFullYear()
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0')
  const day = String(tomorrow.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Convierte un objeto Date a formato YYYY-MM-DD
 * Usa sv-SE locale que devuelve formato ISO directamente
 * @param {Date} date - Objeto Date a convertir
 * @returns {string} Fecha en formato "YYYY-MM-DD"
 */
export const dateToLocalString = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return getLocalDate() // Fallback a fecha actual de Perú
  }
  // sv-SE locale devuelve YYYY-MM-DD directamente
  return date.toLocaleDateString('sv-SE')
}

/**
 * Obtiene la fecha de hace N días en formato YYYY-MM-DD usando timezone de Perú
 * @param {number} days - Número de días hacia atrás
 * @returns {string} Fecha en formato "YYYY-MM-DD"
 */
export const getLocalDateDaysAgo = (days) => {
  const date = getPeruDate()
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtiene fecha y hora actual en formato ISO usando timezone de Perú
 * Útil para timestamps que necesitan hora
 * @returns {string} Fecha y hora en formato "YYYY-MM-DDTHH:mm:ss"
 */
export const getLocalDateTime = () => {
  const peruDate = getPeruDate()
  const year = peruDate.getFullYear()
  const month = String(peruDate.getMonth() + 1).padStart(2, '0')
  const day = String(peruDate.getDate()).padStart(2, '0')
  const hours = String(peruDate.getHours()).padStart(2, '0')
  const minutes = String(peruDate.getMinutes()).padStart(2, '0')
  const seconds = String(peruDate.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}

export default {
  getLocalDate,
  getLocalDateTomorrow,
  dateToLocalString,
  getLocalDateDaysAgo,
  getLocalDateTime
}
