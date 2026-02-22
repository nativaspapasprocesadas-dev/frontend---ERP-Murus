import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

const ImageUploader = ({
  value,
  onChange,
  label = 'Imagen del producto',
  error,
  required = false,
  maxSizeMB = 2,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Actualizar preview cuando value cambia (URL del servidor)
  useEffect(() => {
    if (value) {
      // Si es una URL del servidor, construir la URL completa
      if (value.startsWith('/uploads/')) {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
        setPreview(`${baseUrl}${value}`)
      } else {
        // Si es una URL completa o data URL
        setPreview(value)
      }
    } else {
      setPreview(null)
    }
  }, [value])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar formato
    if (!acceptedFormats.includes(file.type)) {
      alert(`Formato no válido. Solo se aceptan: ${acceptedFormats.join(', ')}`)
      return
    }

    // Validar tamaño
    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > maxSizeMB) {
      alert(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`)
      return
    }

    setUploading(true)

    try {
      // Crear preview local para mostrar al usuario
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
        setUploading(false)
      }
      reader.onerror = () => {
        alert('Error al cargar la imagen')
        setUploading(false)
      }
      reader.readAsDataURL(file)

      // Pasar el archivo real al componente padre
      onChange?.(file)
    } catch (error) {
      console.error('Error al procesar imagen:', error)
      alert('Error al procesar la imagen')
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="space-y-3">
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
              title="Eliminar imagen"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={uploading}
            className="w-full max-w-xs h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
          >
            {uploading ? (
              <>
                <svg
                  className="w-12 h-12 text-primary-500 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-gray-500">Subiendo...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-500">
                  Haz clic para seleccionar una imagen
                </span>
                <span className="text-xs text-gray-400">
                  JPG, PNG o WEBP (máx. {maxSizeMB}MB)
                </span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

ImageUploader.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  label: PropTypes.string,
  error: PropTypes.string,
  required: PropTypes.bool,
  maxSizeMB: PropTypes.number,
  acceptedFormats: PropTypes.arrayOf(PropTypes.string)
}

export default ImageUploader
