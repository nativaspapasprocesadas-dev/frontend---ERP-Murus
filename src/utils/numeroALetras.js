/**
 * Convierte un número a su representación en letras (español)
 * Útil para tickets de venta y facturas
 *
 * @param {number} numero - Número a convertir
 * @returns {string} Número en letras
 */

const unidades = [
  '', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'
]

const decenas = [
  '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
  'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
]

const especiales = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
]

const centenas = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
]

function convertirGrupo(numero) {
  const centena = Math.floor(numero / 100)
  const decena = Math.floor((numero % 100) / 10)
  const unidad = numero % 10

  let resultado = ''

  // Centenas
  if (centena === 1 && decena === 0 && unidad === 0) {
    resultado = 'CIEN'
  } else if (centena > 0) {
    resultado = centenas[centena]
  }

  // Decenas y unidades
  if (decena === 1 && unidad !== 0) {
    // Casos especiales 11-19
    resultado += (resultado ? ' ' : '') + especiales[unidad]
  } else {
    // Decenas normales
    if (decena > 1) {
      resultado += (resultado ? ' ' : '') + decenas[decena]
    } else if (decena === 1) {
      resultado += (resultado ? ' ' : '') + 'DIEZ'
    }

    // Unidades
    if (unidad > 0 && decena !== 1) {
      if (decena >= 2) {
        resultado += ' Y ' + unidades[unidad]
      } else {
        resultado += (resultado ? ' ' : '') + unidades[unidad]
      }
    }
  }

  return resultado
}

function convertirMiles(numero) {
  const miles = Math.floor(numero / 1000)
  const resto = numero % 1000

  let resultado = ''

  if (miles > 0) {
    if (miles === 1) {
      resultado = 'MIL'
    } else {
      resultado = convertirGrupo(miles) + ' MIL'
    }
  }

  if (resto > 0) {
    resultado += (resultado ? ' ' : '') + convertirGrupo(resto)
  }

  return resultado
}

function convertirMillones(numero) {
  const millones = Math.floor(numero / 1000000)
  const resto = numero % 1000000

  let resultado = ''

  if (millones > 0) {
    if (millones === 1) {
      resultado = 'UN MILLON'
    } else {
      resultado = convertirMiles(millones) + ' MILLONES'
    }
  }

  if (resto > 0) {
    resultado += (resultado ? ' ' : '') + convertirMiles(resto)
  }

  return resultado
}

/**
 * Convierte un número decimal a letras con centavos
 * @param {number} numero - Número a convertir
 * @returns {string} Número en letras con formato de moneda
 */
export function numeroALetras(numero) {
  if (numero === 0) return 'CERO SOLES CON 00/100'

  const parteEntera = Math.floor(numero)
  const centavos = Math.round((numero - parteEntera) * 100)

  let resultado = ''

  if (parteEntera >= 1000000) {
    resultado = convertirMillones(parteEntera)
  } else if (parteEntera >= 1000) {
    resultado = convertirMiles(parteEntera)
  } else {
    resultado = convertirGrupo(parteEntera)
  }

  // Agregar "SOLES" y centavos
  const centavosStr = centavos.toString().padStart(2, '0')
  resultado += ` SOLES CON ${centavosStr}/100`

  return resultado
}
