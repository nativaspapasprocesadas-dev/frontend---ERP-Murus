import { useState } from 'react'

/**
 * Hook para gestionar el upload de voucher de pago
 *
 * CASOS DE USO:
 * - Cliente NO_RECURRENTE: Voucher OBLIGATORIO
 * - Cliente RECURRENTE con pago CONTADO: Voucher OPCIONAL
 *
 * El voucher se almacena en: backend/uploads/vouchers/
 * Estado inicial del pago: PENDIENTE (requiere aprobacion del admin)
 *
 * @returns {Object} Estado y acciones del voucher
 */
export const useVoucherUpload = () => {
  const [voucherFile, setVoucherFile] = useState(null)
  const [voucherError, setVoucherError] = useState('')

  // Manejar seleccion de archivo
  const handleFileSelect = (file) => {
    setVoucherFile(file)
    setVoucherError('')
  }

  // Manejar eliminacion de archivo
  const handleFileRemove = () => {
    setVoucherFile(null)
    setVoucherError('')
  }

  // Validar que haya voucher si es requerido
  const validateVoucher = (isRequired) => {
    if (isRequired && !voucherFile) {
      setVoucherError('Debes adjuntar el voucher de pago')
      return false
    }
    setVoucherError('')
    return true
  }

  // Limpiar estado
  const resetVoucher = () => {
    setVoucherFile(null)
    setVoucherError('')
  }

  return {
    voucherFile,
    voucherError,
    handleFileSelect,
    handleFileRemove,
    validateVoucher,
    resetVoucher
  }
}
