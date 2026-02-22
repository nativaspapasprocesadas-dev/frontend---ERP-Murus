/**
 * ConfiguracionEmpresa Component
 * Permite configurar los datos de la empresa que aparecen en tickets y documentos
 */
import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Input } from '@components/common'
import { configurationService } from '@services/configurationService'
import { toast } from 'react-toastify'

const ConfiguracionEmpresa = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    empresaRuc: '',
    empresaRazonSocial: '',
    empresaTelefono: '',
    empresaRegistroSanitario: ''
  })

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const result = await configurationService.getByModule('general')
      if (result.success) {
        setFormData({
          empresaRuc: result.data.empresaRuc || '',
          empresaRazonSocial: result.data.empresaRazonSocial || '',
          empresaTelefono: result.data.empresaTelefono || '',
          empresaRegistroSanitario: result.data.empresaRegistroSanitario || ''
        })
      }
    } catch (error) {
      console.error('Error al cargar configuración de empresa:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const result = await configurationService.updateBatch(formData)
      if (result.success) {
        toast.success('Datos de empresa guardados correctamente')
      } else {
        toast.error(result.error || 'Error al guardar configuración')
      }
    } catch (error) {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Datos de Empresa (Ticket de Venta)" id="empresa-section">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">Cargando configuración...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="N° de RUC"
              name="empresaRuc"
              type="text"
              value={formData.empresaRuc}
              onChange={handleChange}
              placeholder="20609333074"
              maxLength={11}
            />
            <Input
              label="Razón Social"
              name="empresaRazonSocial"
              type="text"
              value={formData.empresaRazonSocial}
              onChange={handleChange}
              placeholder="PROCESADORA DEL SUR E.I.R.L."
            />
            <Input
              label="Teléfono"
              name="empresaTelefono"
              type="text"
              value={formData.empresaTelefono}
              onChange={handleChange}
              placeholder="908822812"
            />
            <Input
              label="Registro Sanitario"
              name="empresaRegistroSanitario"
              type="text"
              value={formData.empresaRegistroSanitario}
              onChange={handleChange}
              placeholder="N0404624NDAPODL"
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Información</h4>
            <p className="text-sm text-blue-800">
              Estos datos aparecerán en los tickets de venta (Nota de Venta) y otros documentos generados por el sistema.
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Datos de Empresa'}
          </Button>
        </form>
      )}
    </Card>
  )
}

export default ConfiguracionEmpresa
