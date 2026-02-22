/**
 * Configuracion Page
 * Página principal de configuración del sistema
 * Integrada con API real /api/v1/configurations
 */
import { useState, useEffect } from 'react'
import { Card, Button, Input } from '@components/common'
import { useCreditConfiguration } from '@hooks/useConfiguration'
import ConfiguracionEmpresa from '@components/Configuracion/ConfiguracionEmpresa'
import ConfiguracionWhatsApp from '@components/Configuracion/ConfiguracionWhatsApp'
import ConfiguracionRedesSociales from '@components/Configuracion/ConfiguracionRedesSociales'

const Configuracion = () => {
  const { config, loading, saving, saveConfig } = useCreditConfiguration()

  const [formData, setFormData] = useState({
    montoAltoGlobal: 1000
  })

  // Sincronizar formData cuando config cambia
  useEffect(() => {
    if (config) {
      setFormData({
        montoAltoGlobal: config.montoAltoGlobal || 1000
      })
    }
  }, [config])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: Number(value)
    }))
  }

  const handleSaveAlertas = async (e) => {
    e.preventDefault()

    await saveConfig({
      montoAltoGlobal: formData.montoAltoGlobal
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600 mt-1">Configura los parámetros del sistema</p>
      </div>

      {/* Información */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> La configuración de rutas se encuentra ahora en el módulo de Rutas.
          Ve a <strong>Rutas - Configurar Rutas</strong> para gestionar las rutas del sistema.
        </p>
      </div>

      {/* Configuración de Empresa (Ticket de Venta) */}
      <ConfiguracionEmpresa />

      {/* Configuración de WhatsApp */}
      <ConfiguracionWhatsApp />

      {/* Configuración de Redes Sociales */}
      <ConfiguracionRedesSociales />

      {/* Configuración de Alertas */}
      <Card title="Configuración de Alertas de Crédito" id="alertas-section">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">Cargando configuración...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveAlertas} className="space-y-6">
            <div className="max-w-md">
              <Input
                label="Monto Alto Global (S/.)"
                name="montoAltoGlobal"
                type="number"
                value={formData.montoAltoGlobal}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
              <p className="text-sm text-gray-600 mt-2">
                Los créditos que superen este monto generarán una alerta automática.
              </p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Información</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>El monto alto se aplica globalmente a todos los clientes</li>
                <li>Los días de crédito se configuran por cada venta individual</li>
                <li>Las alertas aparecen automáticamente en el Dashboard y módulo de Créditos</li>
              </ul>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
          </form>
        )}
      </Card>

    </div>
  )
}

export default Configuracion
