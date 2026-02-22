import { useState, useRef, useEffect } from 'react'
import Button from './Button'

/**
 * Componente para subir imágenes con drag & drop
 * Pasa tanto el File object como el preview base64/URL
 * @param {Function} onImageUpload - Callback que recibe { file, preview } o null
 * @param {string} currentImage - URL o base64 de imagen actual (para edición)
 */
const ImageUpload = ({ onImageUpload, currentImage, label = 'Imagen', required = false }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  // Inicializar preview con currentImage si existe (para edición)
  useEffect(() => {
    if (currentImage) {
      // Si es una URL del servidor, construir URL completa
      if (currentImage.startsWith('/uploads/')) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
        setPreview(`${baseUrl}${currentImage}`)
      } else {
        setPreview(currentImage)
      }
    } else {
      setPreview(null)
    }
  }, [currentImage])

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const processFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido (JPG, PNG, etc.)')
      return
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('La imagen es demasiado grande. El tamaño máximo es 5MB.')
      return
    }

    // Crear preview base64 para visualización
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Preview = reader.result
      setPreview(base64Preview)
      if (onImageUpload) {
        // Pasar tanto el archivo como el preview
        onImageUpload({ file, preview: base64Preview })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onImageUpload) {
      onImageUpload(null)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-gray-500">(Opcional)</span>}
      </label>

      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
        >
          <div className="space-y-2">
            <div className="text-4xl">📷</div>
            <p className="text-sm text-gray-600">
              Arrastra una imagen aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-gray-500">
              Formatos: JPG, PNG, GIF (máx 5MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-64 object-contain bg-gray-50"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleClickUpload}
              className="flex-1"
            >
              🔄 Cambiar imagen
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              className="flex-1"
            >
              🗑️ Eliminar
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}

export default ImageUpload
