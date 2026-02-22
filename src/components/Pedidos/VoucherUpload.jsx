import React, { useState, useRef } from 'react'
import { Button } from '@components/common'

/**
 * VoucherUpload - Componente reutilizable para subir voucher de pago
 *
 * Permite:
 * - Seleccionar archivo (jpg, png, pdf)
 * - Preview de imagen seleccionada
 * - Eliminar imagen seleccionada
 * - Drag & drop (opcional)
 * - Validacion de tipos de archivo
 *
 * @param {Function} onFileSelect - Callback cuando se selecciona archivo (file)
 * @param {Function} onRemove - Callback para eliminar archivo
 * @param {File|string} value - Archivo actual o URL de preview
 * @param {boolean} disabled - Si esta deshabilitado
 * @param {boolean} required - Si es obligatorio
 * @param {string} error - Mensaje de error
 */
const VoucherUpload = ({
  onFileSelect,
  onRemove,
  value,
  disabled = false,
  required = false,
  error = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  // Tipos de archivo permitidos
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']

  // Validar archivo
  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No se selecciono archivo' }

    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido. Solo JPG, PNG o PDF'
      }
    }

    // Validar tamaño (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es muy grande. Maximo 5MB'
      }
    }

    return { valid: true }
  }

  // Manejar seleccion de archivo
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    // Crear preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    onFileSelect(file)
  }

  // Manejar click en zona de drop
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  // Manejar drag events
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const validation = validateFile(file)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    // Crear preview si es imagen
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    onFileSelect(file)
  }

  // Manejar eliminacion
  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onRemove()
  }

  // Determinar si hay archivo seleccionado
  const hasFile = value || preview

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Voucher de Pago {required && <span className="text-red-500">*</span>}
      </label>

      {/* Zona de upload */}
      {!hasFile ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-500' : ''}
          `}
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-blue-600">Click para subir</span> o arrastra y suelta
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG o PDF (max. 5MB)
          </p>
        </div>
      ) : (
        // Preview del archivo
        <div className="border-2 border-gray-300 rounded-lg p-4">
          {preview ? (
            // Preview de imagen
            <div className="relative">
              <img
                src={preview}
                alt="Voucher preview"
                className="max-h-64 mx-auto rounded"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  type="button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ) : value instanceof File ? (
            // Archivo PDF o sin preview
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">{value.name}</p>
                  <p className="text-xs text-gray-500">{(value.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  type="button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ) : typeof value === 'string' ? (
            // URL de imagen existente
            <div className="relative">
              <img
                src={value}
                alt="Voucher"
                className="max-h-64 mx-auto rounded"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={allowedExtensions.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Mensaje de error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Informacion adicional */}
      <p className="text-xs text-gray-500">
        Sube el comprobante de pago (transferencia, Yape, Plin, etc.)
      </p>
    </div>
  )
}

export default VoucherUpload
