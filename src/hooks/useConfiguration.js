/**
 * useConfiguration Hook
 * Hook para gestionar configuraciones del sistema desde la API
 * Reemplaza el uso de localStorage por API real
 */
import { useState, useCallback, useEffect } from 'react'
import { configurationService } from '@services/configurationService'
import { toast } from 'react-toastify'

/**
 * Hook para configuración de WhatsApp
 */
export const useWhatsAppConfiguration = () => {
  const [config, setConfig] = useState({
    whatsappNumero: '',
    whatsappHabilitado: true,
    whatsappMensajeHeader: '',
    whatsappMensajePedido: '',
    whatsappMensajeModificaciones: '',
    whatsappMensajeRutaSalida: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await configurationService.getWhatsAppConfig()

    if (result.success) {
      setConfig(result.data)
    } else {
      setError(result.error)
      // Fallback a localStorage si la API falla
      const stored = localStorage.getItem('whatsapp_config')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setConfig(prev => ({ ...prev, ...parsed }))
        } catch (e) {
          console.error('Error parsing localStorage fallback:', e)
        }
      }
    }

    setLoading(false)
  }, [])

  const saveConfig = useCallback(async (newConfig) => {
    setSaving(true)
    setError(null)

    const result = await configurationService.saveWhatsAppConfig(newConfig)

    if (result.success) {
      setConfig(prev => ({ ...prev, ...newConfig }))
      toast.success('Configuración de WhatsApp guardada correctamente')

      // Emitir evento para compatibilidad con componentes que escuchan
      window.dispatchEvent(new CustomEvent('whatsappConfigUpdate', {
        detail: newConfig
      }))
    } else {
      setError(result.error)
      toast.error(result.error || 'Error al guardar configuración')
    }

    setSaving(false)
    return result
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    saving,
    error,
    saveConfig,
    refresh: fetchConfig
  }
}

/**
 * Hook para configuración de redes sociales
 */
export const useSocialConfiguration = () => {
  const [config, setConfig] = useState({
    facebook: '',
    instagram: '',
    tiktok: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await configurationService.getSocialConfig()

    if (result.success) {
      setConfig(result.data)
    } else {
      setError(result.error)
      // Fallback a localStorage si la API falla
      const stored = localStorage.getItem('redes_sociales_config')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setConfig(prev => ({ ...prev, ...parsed }))
        } catch (e) {
          console.error('Error parsing localStorage fallback:', e)
        }
      }
    }

    setLoading(false)
  }, [])

  const saveConfig = useCallback(async (newConfig) => {
    setSaving(true)
    setError(null)

    const result = await configurationService.saveSocialConfig(newConfig)

    if (result.success) {
      setConfig(prev => ({ ...prev, ...newConfig }))
      toast.success('Configuración de redes sociales guardada correctamente')

      // Emitir evento para compatibilidad
      window.dispatchEvent(new CustomEvent('redesSocialesConfigUpdate', {
        detail: newConfig
      }))
    } else {
      setError(result.error)
      toast.error(result.error || 'Error al guardar configuración')
    }

    setSaving(false)
    return result
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    saving,
    error,
    saveConfig,
    refresh: fetchConfig
  }
}

/**
 * Hook para configuración de créditos/alertas
 */
export const useCreditConfiguration = () => {
  const [config, setConfig] = useState({
    montoAltoGlobal: 0,
    creditoAlertaDias: 7,
    creditoInteresMora: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await configurationService.getCreditConfig()

    if (result.success) {
      setConfig(result.data)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }, [])

  const saveConfig = useCallback(async (newConfig) => {
    setSaving(true)
    setError(null)

    const result = await configurationService.saveCreditConfig(newConfig)

    if (result.success) {
      setConfig(prev => ({ ...prev, ...newConfig }))
      toast.success('Configuración de alertas guardada correctamente')
    } else {
      setError(result.error)
      toast.error(result.error || 'Error al guardar configuración')
    }

    setSaving(false)
    return result
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    saving,
    error,
    saveConfig,
    refresh: fetchConfig
  }
}

/**
 * Hook general para todas las configuraciones
 */
export const useConfiguration = () => {
  const [config, setConfig] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await configurationService.getAll()

    if (result.success) {
      setConfig(result.data)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }, [])

  const updateConfig = useCallback(async (key, value) => {
    const result = await configurationService.update(key, value)

    if (result.success) {
      setConfig(prev => ({ ...prev, [key]: value }))
      toast.success('Configuración actualizada')
    } else {
      toast.error(result.error || 'Error al actualizar configuración')
    }

    return result
  }, [])

  const updateBatch = useCallback(async (configs) => {
    const result = await configurationService.updateBatch(configs)

    if (result.success) {
      setConfig(prev => ({ ...prev, ...configs }))
      toast.success('Configuraciones actualizadas')
    } else {
      toast.error(result.error || 'Error al actualizar configuraciones')
    }

    return result
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    error,
    updateConfig,
    updateBatch,
    refresh: fetchConfig
  }
}

export default useConfiguration
