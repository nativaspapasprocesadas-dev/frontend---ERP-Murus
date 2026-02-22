import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { FORMATO_MONEDA } from './constants'

/**
 * Formatea un número como moneda en soles peruanos
 * @param {number} valor - Valor a formatear
 * @returns {string} Valor formateado como "S/. 100.00"
 */
export const formatearMoneda = (valor) => {
  if (valor === null || valor === undefined || isNaN(valor)) {
    return `${FORMATO_MONEDA} 0.00`
  }
  return `${FORMATO_MONEDA} ${Number(valor).toFixed(2)}`
}

/**
 * Formatea una fecha en el formato especificado
 * @param {string|Date} fecha - Fecha a formatear
 * @param {string} formato - Formato de salida (por defecto: 'dd/MM/yyyy')
 * @returns {string} Fecha formateada
 */
export const formatearFecha = (fecha, formato = 'dd/MM/yyyy') => {
  if (!fecha) return '-'

  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha
    return format(fechaObj, formato, { locale: es })
  } catch (error) {
    return '-'
  }
}

/**
 * Calcula los días transcurridos desde una fecha
 * @param {string|Date} fecha - Fecha inicial
 * @returns {number} Días transcurridos
 */
export const diasTranscurridos = (fecha) => {
  if (!fecha) return 0

  try {
    const fechaObj = typeof fecha === 'string' ? parseISO(fecha) : fecha
    return differenceInDays(new Date(), fechaObj)
  } catch (error) {
    return 0
  }
}

/**
 * Formatea un número con separadores de miles
 * @param {number} numero - Número a formatear
 * @returns {string} Número formateado
 */
export const formatearNumero = (numero) => {
  if (numero === null || numero === undefined || isNaN(numero)) {
    return '0'
  }
  return Number(numero).toLocaleString('es-PE')
}

/**
 * Formatea kilos con su unidad
 * @param {number} kilos - Cantidad de kilos
 * @returns {string} Kilos formateados con unidad
 */
export const formatearKilos = (kilos) => {
  if (kilos === null || kilos === undefined || isNaN(kilos)) {
    return '0 kg'
  }
  return `${formatearNumero(kilos)} kg`
}

/**
 * Calcula el porcentaje de un valor respecto a un total
 * @param {number} valor - Valor parcial
 * @param {number} total - Valor total
 * @returns {number} Porcentaje (0-100)
 */
export const calcularPorcentaje = (valor, total) => {
  if (!total || total === 0) return 0
  return Math.round((valor / total) * 100)
}

/**
 * Formatea un porcentaje
 * @param {number} porcentaje - Porcentaje a formatear
 * @returns {string} Porcentaje formateado con símbolo
 */
export const formatearPorcentaje = (porcentaje) => {
  if (porcentaje === null || porcentaje === undefined || isNaN(porcentaje)) {
    return '0%'
  }
  return `${Number(porcentaje).toFixed(1)}%`
}

/**
 * Formatea un teléfono peruano
 * @param {string} telefono - Número de teléfono
 * @returns {string} Teléfono formateado
 */
export const formatearTelefono = (telefono) => {
  if (!telefono) return '-'

  // Eliminar espacios y caracteres especiales
  const limpio = telefono.replace(/\D/g, '')

  // Formato: 999 999 999
  if (limpio.length === 9) {
    return `${limpio.substring(0, 3)} ${limpio.substring(3, 6)} ${limpio.substring(6, 9)}`
  }

  return telefono
}
