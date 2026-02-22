/**
 * ConfiguracionRedesSociales Component
 * Configuración de redes sociales integrada con API real
 * Reemplaza localStorage por API /api/v1/configurations
 */
import { useState, useEffect } from 'react'
import { Card, Button, Input, Modal } from '@components/common'
import { useSocialConfiguration } from '@hooks/useConfiguration'

const ConfiguracionRedesSociales = () => {
  const { config, loading, saving, saveConfig } = useSocialConfiguration()

  const [formData, setFormData] = useState({
    facebook: '',
    instagram: '',
    tiktok: ''
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Sincronizar formData cuando config cambia
  useEffect(() => {
    if (config) {
      setFormData({
        facebook: config.facebook || '',
        instagram: config.instagram || '',
        tiktok: config.tiktok || ''
      })
    }
  }, [config])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const result = await saveConfig(formData)

    if (result.success) {
      setShowSuccessModal(true)
    }
  }

  const redesConfiguradas = [
    formData.facebook && 'Facebook',
    formData.instagram && 'Instagram',
    formData.tiktok && 'TikTok'
  ].filter(Boolean)

  if (loading) {
    return (
      <Card title="Redes Sociales">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Cargando configuración...</span>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card title="Redes Sociales">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-gray-600">
            Configura los enlaces a tus redes sociales. Estos se mostrarán en la página de inicio de sesión.
          </p>

          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div className="flex-1">
                <Input
                  label="Facebook"
                  name="facebook"
                  type="url"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/tu-pagina"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="flex-1">
                <Input
                  label="Instagram"
                  name="instagram"
                  type="url"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/tu-cuenta"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <div className="flex-1">
                <Input
                  label="TikTok"
                  name="tiktok"
                  type="url"
                  value={formData.tiktok}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@tu-cuenta"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-900 mb-2">Nota</h4>
            <p className="text-sm text-amber-800">
              Deja en blanco los campos de las redes sociales que no uses. Solo se mostrarán las que tengan URL configurada.
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Redes Sociales'}
          </Button>
        </form>
      </Card>

      {/* Modal de éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        showCloseButton={false}
        size="sm"
      >
        <div className="text-center py-6 px-4">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-200 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-200 rounded-full opacity-30 animate-pulse"></div>
          </div>

          {/* Contenido */}
          <div className="relative z-10">
            {/* Ícono animado */}
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-orange-300/50 animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {/* Círculos decorativos */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white text-xs">OK</span>
              </div>
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Guardado!
            </h3>

            <p className="text-gray-600 mb-6">
              Tu configuración de redes sociales se actualizó correctamente
            </p>

            {/* Redes configuradas */}
            {redesConfiguradas.length > 0 && (
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 mb-6 border border-orange-100">
                <p className="text-sm text-gray-500 mb-3">Redes activas:</p>
                <div className="flex justify-center gap-4">
                  {formData.facebook && (
                    <a
                      href={formData.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform cursor-pointer">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500">Facebook</span>
                    </a>
                  )}
                  {formData.instagram && (
                    <a
                      href={formData.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform cursor-pointer">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500">Instagram</span>
                    </a>
                  )}
                  {formData.tiktok && (
                    <a
                      href={formData.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform cursor-pointer">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                      </div>
                      <span className="text-xs text-gray-500">TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {redesConfiguradas.length === 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <p className="text-sm text-gray-500">
                  No tienes redes sociales configuradas. Los íconos no se mostrarán en el login.
                </p>
              </div>
            )}

            {/* Mensaje adicional */}
            <p className="text-xs text-gray-400 mb-6">
              Los cambios se reflejarán en la página de inicio de sesión
            </p>

            {/* Botón */}
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              ¡Perfecto!
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default ConfiguracionRedesSociales
