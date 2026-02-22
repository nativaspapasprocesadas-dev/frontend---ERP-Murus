import { useState } from 'react'
import { Card, Button, Input, Modal } from '@components/common'
import { useProfile } from '@hooks/useProfile'
import { useToast } from '@hooks/useToast'
import useAuthStore from '@features/auth/useAuthStore'

/**
 * Vista de Perfil de Usuario
 * Permite ver información personal y cambiar contraseña
 */
const Perfil = () => {
  const { user } = useAuthStore()
  const { profile, loading, changePassword } = useProfile()
  const toast = useToast()

  // Datos del perfil: usar profile de API-075 si está disponible, sino usar user del store
  const profileData = profile || user

  const [formData, setFormData] = useState({
    contraseñaActual: '',
    nuevaContraseña: '',
    confirmarContraseña: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  })
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isChanging, setIsChanging] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const validate = () => {
    const errors = {}

    if (!formData.contraseñaActual) {
      errors.contraseñaActual = 'Ingresa tu contraseña actual'
    }

    if (!formData.nuevaContraseña) {
      errors.nuevaContraseña = 'Ingresa una nueva contraseña'
    } else if (formData.nuevaContraseña.length < 6) {
      errors.nuevaContraseña = 'La contraseña debe tener al menos 6 caracteres'
    }

    if (!formData.confirmarContraseña) {
      errors.confirmarContraseña = 'Confirma tu nueva contraseña'
    } else if (formData.confirmarContraseña !== formData.nuevaContraseña) {
      errors.confirmarContraseña = 'Las contraseñas no coinciden'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    // Mostrar modal de confirmación antes de cambiar
    setShowConfirmModal(true)
  }

  const handleConfirmChange = async () => {
    setIsChanging(true)
    setShowConfirmModal(false)

    // Cambiar contraseña via API real
    const result = await changePassword(
      formData.contraseñaActual,
      formData.nuevaContraseña,
      formData.confirmarContraseña
    )

    setIsChanging(false)

    if (result.success) {
      // Mostrar modal de éxito
      setShowSuccessModal(true)

      // Limpiar formulario
      setFormData({
        contraseñaActual: '',
        nuevaContraseña: '',
        confirmarContraseña: ''
      })
    } else {
      toast.error(result.error || 'Error al cambiar la contraseña')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-1">Administra tu información personal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Usuario - ELM-106 integrado con API-075 */}
        <Card title="Información Personal">
          {loading && !profileData ? (
            <div className="text-center py-4 text-gray-500">Cargando perfil...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <p className="text-gray-900 font-semibold">{profileData?.name || profileData?.nombre}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{profileData?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <p className="text-gray-900 capitalize">{profileData?.role || profileData?.rol}</p>
              </div>

              {profileData?.branch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sede
                  </label>
                  <p className="text-gray-900">{profileData.branch}</p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Cambiar Contraseña */}
        <Card title="Cambiar Contraseña">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showPasswords.actual ? 'text' : 'password'}
                  name="contraseñaActual"
                  value={formData.contraseñaActual}
                  onChange={handleChange}
                  className={`input pr-10 ${formErrors.contraseñaActual ? 'border-red-500' : ''}`}
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('actual')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.actual ? '🙈' : '👁️'}
                </button>
              </div>
              {formErrors.contraseñaActual && (
                <p className="text-sm text-red-500 mt-1">{formErrors.contraseñaActual}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswords.nueva ? 'text' : 'password'}
                  name="nuevaContraseña"
                  value={formData.nuevaContraseña}
                  onChange={handleChange}
                  className={`input pr-10 ${formErrors.nuevaContraseña ? 'border-red-500' : ''}`}
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('nueva')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.nueva ? '🙈' : '👁️'}
                </button>
              </div>
              {formErrors.nuevaContraseña && (
                <p className="text-sm text-red-500 mt-1">{formErrors.nuevaContraseña}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmar ? 'text' : 'password'}
                  name="confirmarContraseña"
                  value={formData.confirmarContraseña}
                  onChange={handleChange}
                  className={`input pr-10 ${formErrors.confirmarContraseña ? 'border-red-500' : ''}`}
                  placeholder="Confirma tu nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmar')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirmar ? '🙈' : '👁️'}
                </button>
              </div>
              {formErrors.confirmarContraseña && (
                <p className="text-sm text-red-500 mt-1">{formErrors.confirmarContraseña}</p>
              )}
            </div>

            <Button type="submit" className="w-full">
              Cambiar Contraseña
            </Button>
          </form>
        </Card>
      </div>

      {/* Información de Seguridad */}
      <Card title="Consejos de Seguridad">
        <div className="space-y-2 text-sm text-gray-600">
          <p>🔒 Usa una contraseña fuerte que sea única para esta cuenta</p>
          <p>📝 Combina letras mayúsculas, minúsculas, números y símbolos</p>
          <p>🔄 Cambia tu contraseña regularmente</p>
          <p>❌ No compartas tu contraseña con nadie</p>
        </div>
      </Card>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmar cambio de contraseña"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-center text-gray-700">
            ¿Estás seguro de que deseas cambiar tu contraseña?
          </p>
          <p className="text-center text-sm text-gray-500">
            Asegúrate de recordar tu nueva contraseña antes de continuar.
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleConfirmChange}
              disabled={isChanging}
            >
              {isChanging ? 'Cambiando...' : 'Sí, cambiar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Contraseña actualizada!"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <p className="text-center text-gray-700 font-medium">
            Tu contraseña ha sido cambiada exitosamente
          </p>
          <p className="text-center text-sm text-gray-500">
            La próxima vez que inicies sesión, usa tu nueva contraseña.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setShowSuccessModal(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Perfil
