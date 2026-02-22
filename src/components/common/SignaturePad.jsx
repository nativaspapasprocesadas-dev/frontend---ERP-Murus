import { useRef, useImperativeHandle, forwardRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import Button from './Button'

/**
 * Componente de firma digital usando react-signature-canvas
 * Permite al usuario firmar con mouse o touch
 */
const SignaturePad = forwardRef(({ onSave, required = false }, ref) => {
  const sigCanvas = useRef(null)

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    clear: () => {
      sigCanvas.current?.clear()
      if (onSave) {
        onSave(null)
      }
    },
    isEmpty: () => sigCanvas.current?.isEmpty() ?? true,
    save: () => {
      if (sigCanvas.current?.isEmpty()) {
        alert('Por favor, firma antes de guardar')
        return
      }
      const signatureData = sigCanvas.current?.toDataURL('image/png')
      if (onSave && signatureData) {
        onSave(signatureData)
      }
    }
  }))

  const handleClear = () => {
    sigCanvas.current?.clear()
    if (onSave) {
      onSave(null)
    }
  }

  const handleEnd = () => {
    // Guardar automáticamente al terminar de dibujar
    if (!sigCanvas.current?.isEmpty() && onSave) {
      const signatureData = sigCanvas.current?.toDataURL('image/png')
      onSave(signatureData)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Firma Digital {required ? <span className="text-red-500">*</span> : <span className="text-gray-500">(Opcional)</span>}
        </label>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleClear}
        >
          🗑️ Limpiar
        </Button>
      </div>

      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: 600,
            height: 200,
            className: 'w-full cursor-crosshair signature-canvas'
          }}
          backgroundColor="#ffffff"
          penColor="#000000"
          onEnd={handleEnd}
        />
      </div>

      <p className="text-xs text-gray-500">
        ✍️ Firma aquí usando el mouse o el dedo (en dispositivos táctiles)
      </p>

      {required && (
        <p className="text-xs text-gray-400">
          La firma es obligatoria para registrar el pago
        </p>
      )}
    </div>
  )
})

SignaturePad.displayName = 'SignaturePad'

export default SignaturePad
