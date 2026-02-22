/**
 * ConfigurationService - Servicio para configuraciones del sistema
 * Integración con API /api/v1/configurations
 * Reemplaza el uso de localStorage por API real
 */
import apiClient from '@/lib/api'

/**
 * Mapeo de claves frontend a claves de BD
 */
const KEY_MAPPING = {
  // WhatsApp
  whatsappNumero: 'whatsapp_numero_empresa',
  whatsappHabilitado: 'whatsapp_habilitado',
  whatsappMensajeHeader: 'whatsapp_mensaje_header',
  whatsappMensajePedido: 'whatsapp_mensaje_pedido',
  whatsappMensajeModificaciones: 'whatsapp_mensaje_modificaciones',
  whatsappMensajeRutaSalida: 'whatsapp_mensaje_ruta_salida',
  // Redes Sociales
  facebook: 'social_facebook',
  instagram: 'social_instagram',
  tiktok: 'social_tiktok',
  // Creditos
  montoAltoGlobal: 'credito_monto_alto_global',
  creditoAlertaDias: 'credito_alerta_dias_vencimiento',
  creditoInteresMora: 'credito_interes_mora',
  // General
  empresaNombre: 'empresa_nombre',
  empresaRuc: 'empresa_ruc',
  empresaDireccion: 'empresa_direccion',
  empresaTelefono: 'empresa_telefono',
  empresaCelular: 'empresa_celular',
  empresaEmail: 'empresa_email',
  empresaRegistroSanitario: 'empresa_registro_sanitario',
  empresaRazonSocial: 'empresa_razon_social',
  empresaNombreComercial: 'empresa_nombre_comercial',
  empresaLogoUrl: 'empresa_logo_url',
  monedaSimbolo: 'moneda_simbolo',
  igvPorcentaje: 'igv_porcentaje',
  horarioInicio: 'horario_inicio',
  horarioFin: 'horario_fin'
}

/**
 * Mapeo inverso de claves de BD a frontend
 */
const REVERSE_KEY_MAPPING = Object.fromEntries(
  Object.entries(KEY_MAPPING).map(([k, v]) => [v, k])
)

/**
 * Convertir clave frontend a clave BD
 */
const toDbKey = (frontendKey) => KEY_MAPPING[frontendKey] || frontendKey

/**
 * Convertir clave BD a clave frontend
 */
const toFrontendKey = (dbKey) => REVERSE_KEY_MAPPING[dbKey] || dbKey

export const configurationService = {
  /**
   * Obtener todas las configuraciones
   * GET /api/v1/configurations
   */
  async getAll() {
    try {
      const response = await apiClient.get('/configurations')

      if (response.data.success) {
        // Convertir a formato más simple {clave: valor}
        const configs = {}
        response.data.data.forEach(config => {
          const frontendKey = toFrontendKey(config.clave)
          configs[frontendKey] = config.valor
        })
        return { success: true, data: configs }
      }

      return { success: false, error: 'Error al obtener configuraciones' }
    } catch (error) {
      console.error('Error en configurationService.getAll:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener configuraciones'
      }
    }
  },

  /**
   * Obtener configuraciones por modulo
   * GET /api/v1/configurations/module/:modulo
   * @param {string} modulo - general, creditos, whatsapp, social
   */
  async getByModule(modulo) {
    try {
      const response = await apiClient.get(`/configurations/module/${modulo}`)

      if (response.data.success) {
        const configs = {}
        response.data.data.forEach(config => {
          const frontendKey = toFrontendKey(config.clave)
          configs[frontendKey] = config.valor
        })
        return { success: true, data: configs }
      }

      return { success: false, error: 'Error al obtener configuraciones del módulo' }
    } catch (error) {
      console.error('Error en configurationService.getByModule:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener configuraciones del módulo'
      }
    }
  },

  /**
   * Obtener una configuración específica
   * GET /api/v1/configurations/:clave
   * @param {string} clave - Clave de la configuración (frontend)
   */
  async get(clave) {
    try {
      const dbKey = toDbKey(clave)
      const response = await apiClient.get(`/configurations/${dbKey}`)

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data.valor
        }
      }

      return { success: false, error: 'Configuración no encontrada' }
    } catch (error) {
      console.error('Error en configurationService.get:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener configuración'
      }
    }
  },

  /**
   * Actualizar una configuración
   * PUT /api/v1/configurations/:clave
   * @param {string} clave - Clave de la configuración (frontend)
   * @param {any} valor - Nuevo valor
   */
  async update(clave, valor) {
    try {
      const dbKey = toDbKey(clave)
      const response = await apiClient.put(`/configurations/${dbKey}`, { valor })

      if (response.data.success) {
        return { success: true, data: response.data.data }
      }

      return { success: false, error: 'Error al actualizar configuración' }
    } catch (error) {
      console.error('Error en configurationService.update:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar configuración'
      }
    }
  },

  /**
   * Actualizar múltiples configuraciones
   * PUT /api/v1/configurations/batch
   * @param {Object} configs - Objeto con {clave: valor} (claves frontend)
   */
  async updateBatch(configs) {
    try {
      // Convertir a formato de array con claves de BD
      const configurations = Object.entries(configs).map(([key, value]) => ({
        clave: toDbKey(key),
        valor: value
      }))

      const response = await apiClient.put('/configurations/batch', { configurations })

      if (response.data.success) {
        return { success: true, data: response.data.data }
      }

      return { success: false, error: 'Error al actualizar configuraciones' }
    } catch (error) {
      console.error('Error en configurationService.updateBatch:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar configuraciones'
      }
    }
  },

  /**
   * Obtener configuración de WhatsApp
   * Conveniencia para componente ConfiguracionWhatsApp
   */
  async getWhatsAppConfig() {
    const result = await this.getByModule('whatsapp')
    if (result.success) {
      // Mapear a formato esperado por el componente
      return {
        success: true,
        data: {
          whatsappNumero: result.data.whatsappNumero || '',
          whatsappHabilitado: result.data.whatsappHabilitado !== false,
          whatsappMensajeHeader: result.data.whatsappMensajeHeader || '',
          whatsappMensajePedido: result.data.whatsappMensajePedido || '',
          whatsappMensajeModificaciones: result.data.whatsappMensajeModificaciones || '',
          whatsappMensajeRutaSalida: result.data.whatsappMensajeRutaSalida || ''
        }
      }
    }
    return result
  },

  /**
   * Guardar configuración de WhatsApp
   * @param {Object} config - Configuración de WhatsApp
   */
  async saveWhatsAppConfig(config) {
    const mappedConfig = {}

    if (config.whatsappNumero !== undefined) {
      mappedConfig.whatsappNumero = config.whatsappNumero
    }
    if (config.whatsappHabilitado !== undefined) {
      mappedConfig.whatsappHabilitado = String(config.whatsappHabilitado)
    }
    if (config.whatsappMensajeHeader !== undefined) {
      mappedConfig.whatsappMensajeHeader = config.whatsappMensajeHeader
    }
    if (config.whatsappMensajePedido !== undefined) {
      mappedConfig.whatsappMensajePedido = config.whatsappMensajePedido
    }
    if (config.whatsappMensajeModificaciones !== undefined) {
      mappedConfig.whatsappMensajeModificaciones = config.whatsappMensajeModificaciones
    }
    if (config.whatsappMensajeRutaSalida !== undefined) {
      mappedConfig.whatsappMensajeRutaSalida = config.whatsappMensajeRutaSalida
    }

    return this.updateBatch(mappedConfig)
  },

  /**
   * Obtener configuración de redes sociales
   */
  async getSocialConfig() {
    const result = await this.getByModule('social')
    if (result.success) {
      return {
        success: true,
        data: {
          facebook: result.data.facebook || '',
          instagram: result.data.instagram || '',
          tiktok: result.data.tiktok || ''
        }
      }
    }
    return result
  },

  /**
   * Obtener configuración de redes sociales (público, sin autenticación)
   * Para usar en la página de login
   * GET /api/v1/configurations/public/social
   */
  async getPublicSocialConfig() {
    try {
      const response = await apiClient.get('/configurations/public/social')

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        }
      }

      return { success: false, error: 'Error al obtener redes sociales' }
    } catch (error) {
      console.error('Error en configurationService.getPublicSocialConfig:', error)
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener redes sociales'
      }
    }
  },

  /**
   * Guardar configuración de redes sociales
   * @param {Object} config - Configuración de redes sociales
   */
  async saveSocialConfig(config) {
    const mappedConfig = {}

    if (config.facebook !== undefined) {
      mappedConfig.facebook = config.facebook
    }
    if (config.instagram !== undefined) {
      mappedConfig.instagram = config.instagram
    }
    if (config.tiktok !== undefined) {
      mappedConfig.tiktok = config.tiktok
    }

    return this.updateBatch(mappedConfig)
  },

  /**
   * Obtener configuración de créditos
   */
  async getCreditConfig() {
    const result = await this.getByModule('creditos')
    if (result.success) {
      return {
        success: true,
        data: {
          montoAltoGlobal: parseFloat(result.data.montoAltoGlobal) || 0,
          creditoAlertaDias: parseInt(result.data.creditoAlertaDias) || 7,
          creditoInteresMora: parseFloat(result.data.creditoInteresMora) || 0
        }
      }
    }
    return result
  },

  /**
   * Guardar configuración de créditos
   * @param {Object} config - Configuración de créditos
   */
  async saveCreditConfig(config) {
    const mappedConfig = {}

    if (config.montoAltoGlobal !== undefined) {
      mappedConfig.montoAltoGlobal = String(config.montoAltoGlobal)
    }
    if (config.creditoAlertaDias !== undefined) {
      mappedConfig.creditoAlertaDias = String(config.creditoAlertaDias)
    }
    if (config.creditoInteresMora !== undefined) {
      mappedConfig.creditoInteresMora = String(config.creditoInteresMora)
    }

    return this.updateBatch(mappedConfig)
  },

  /**
   * Obtener configuración de empresa
   * Incluye todos los datos necesarios para PDFs y documentos
   */
  async getCompanyConfig() {
    const result = await this.getByModule('general')
    if (result.success) {
      const whatsappResult = await this.getByModule('whatsapp')
      const socialResult = await this.getByModule('social')

      return {
        success: true,
        data: {
          // Datos básicos de la empresa
          nombreEmpresa: result.data.empresaNombre || result.data.empresaNombreComercial || 'MURU\'S',
          razonSocial: result.data.empresaRazonSocial || 'PROCESADORA DEL SUR E.I.R.L.',
          nombreComercial: result.data.empresaNombreComercial || 'MURU\'S',
          ruc: result.data.empresaRuc || '20609333074',
          direccion: result.data.empresaDireccion || 'Arequipa, Perú',
          telefonoPlanta: result.data.empresaTelefono || '908822812',
          celularPlanta: result.data.empresaCelular || result.data.empresaTelefono || '908822812',
          email: result.data.empresaEmail || 'ventas@murus.com',
          registroSanitario: result.data.empresaRegistroSanitario || 'N0404624NDAPODL',
          logoUrl: result.data.empresaLogoUrl || '/logoPapas.png',

          // Configuración general
          monedaSimbolo: result.data.monedaSimbolo || 'S/.',
          igvPorcentaje: parseFloat(result.data.igvPorcentaje) || 18,

          // WhatsApp
          whatsappNumero: whatsappResult?.data?.whatsappNumero || '+51987654321',
          whatsappMensajeHeader: whatsappResult?.data?.whatsappMensajeHeader || 'Hola, necesito ayuda con el sistema de pedidos',
          whatsappMensajeModificaciones: whatsappResult?.data?.whatsappMensajeModificaciones || 'Hola, necesito modificar un pedido',
          whatsappMensajeRutaSalida: whatsappResult?.data?.whatsappMensajeRutaSalida || 'Hola, mi ruta ya salió y necesito hacer un pedido',

          // Redes Sociales
          redesSociales: {
            facebook: socialResult?.data?.facebook || '',
            instagram: socialResult?.data?.instagram || '',
            tiktok: socialResult?.data?.tiktok || ''
          }
        }
      }
    }
    return result
  }
}

export default configurationService
