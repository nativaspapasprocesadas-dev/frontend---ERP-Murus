import { useState, useMemo, useEffect } from 'react'
import { Card, Button, Input, Select, ComboBox, Table, Badge, SignaturePad } from '@components/common'
import { usePayments } from '@hooks/usePayments'
import { useCustomers } from '@hooks/useCustomers'
import { useToast } from '@hooks/useToast'
import useAuthStore from '@features/auth/useAuthStore'
import { formatearMoneda, formatearFecha } from '@utils/formatters'
import { METODOS_PAGO, METODOS_PAGO_LABELS } from '@utils/constants'
import { getLocalDate } from '@utils/dateUtils'

/**
 * Vista de Registro de Pagos
 *
 * Responsabilidad única: Registrar pagos de clientes (movimientos tipo ABONO)
 * Integrado con APIs reales de pagos y clientes
 */
const Pagos = () => {
  const { user } = useAuthStore()
  const { data: clientes, loading: loadingClientes, fetchCustomers } = useCustomers()
  const { data: pagos, create, loading: loadingPagos } = usePayments()

  // Cargar todos los clientes al montar el componente
  useEffect(() => {
    fetchCustomers({ pageSize: 0 })
  }, [])
  const toast = useToast()

  const [formData, setFormData] = useState({
    clienteId: '',
    monto: '',
    metodoPago: '',
    notas: '',
    firma: null
  })
  const [formErrors, setFormErrors] = useState({})
  const [selectedCliente, setSelectedCliente] = useState(null)

  // Clientes con deuda pendiente
  const clientesOptions = useMemo(() => {
    return clientes
      .filter(c => c.totalDeuda > 0 && c.activo)
      .map(c => ({
        value: c.id,
        label: `${c.nombre} - Deuda: ${formatearMoneda(c.totalDeuda)}`
      }))
  }, [clientes])

  const metodosOptions = Object.keys(METODOS_PAGO).map(key => ({
    value: METODOS_PAGO[key],
    label: METODOS_PAGO_LABELS[METODOS_PAGO[key]]
  }))

  const handleClienteChange = (e) => {
    const clienteId = Number(e.target.value)
    setFormData(prev => ({ ...prev, clienteId }))

    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId)
      setSelectedCliente(cliente)
    } else {
      setSelectedCliente(null)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSignatureSave = (signatureData) => {
    setFormData(prev => ({ ...prev, firma: signatureData }))
    if (formErrors.firma) {
      setFormErrors(prev => ({ ...prev, firma: null }))
    }
  }

  const validate = () => {
    const errors = {}

    if (!formData.clienteId) {
      errors.clienteId = 'Selecciona un cliente'
    }

    if (!formData.monto || formData.monto <= 0) {
      errors.monto = 'Ingresa un monto válido'
    } else if (selectedCliente && Number(formData.monto) > selectedCliente.totalDeuda) {
      errors.monto = `El monto no puede ser mayor a la deuda actual (${formatearMoneda(selectedCliente.totalDeuda)})`
    }

    if (!formData.metodoPago) {
      errors.metodoPago = 'Selecciona un método de pago'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    if (!selectedCliente) {
      toast.error('No se pudo obtener el estado de cuenta del cliente')
      return
    }

    // Crear el pago vía API real con datos adicionales para mostrar inmediatamente
    const result = await create(
      {
        clienteId: Number(formData.clienteId),
        monto: Number(formData.monto),
        metodoPago: formData.metodoPago,
        notas: formData.notas || '',
        referencia: formData.referencia || ''
      },
      {
        nombreCliente: selectedCliente.nombre,
        registradoPorNombre: user?.nombre || user?.name || 'Sistema',
        registradoPorRol: user?.rol || user?.role || '',
        firma: formData.firma
      }
    )

    if (result.success) {
      toast.success(`Pago registrado exitosamente. Nuevo saldo: ${formatearMoneda(result.newBalance || 0)}`)

      // Actualizar lista de clientes para reflejar el nuevo saldo
      await fetchCustomers({ pageSize: 0 })

      // Limpiar formulario
      setFormData({
        clienteId: '',
        monto: '',
        metodoPago: '',
        notas: '',
        firma: null
      })
      setSelectedCliente(null)
    } else {
      toast.error(result.error || 'Error al registrar el pago')
    }
  }

  const columnasPagos = [
    {
      title: 'Fecha Pago',
      key: 'fechaPago',
      render: (value) => formatearFecha(value, 'dd/MM/yyyy HH:mm')
    },
    {
      title: 'Cliente',
      key: 'nombreCliente',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      title: 'Monto',
      key: 'monto',
      render: (value) => (
        <span className="font-bold text-green-600">{formatearMoneda(value)}</span>
      )
    },
    {
      title: 'Método',
      key: 'metodoPago',
      render: (value) => (
        <Badge variant="info">{METODOS_PAGO_LABELS[value]}</Badge>
      )
    },
    {
      title: 'Registrado Por',
      key: 'registradoPorNombre',
      render: (value, row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{value}</span>
          <span className="text-xs text-gray-500 capitalize">{row.registradoPorRol}</span>
        </div>
      )
    },
    {
      title: 'Fecha Registro',
      key: 'fechaCreacion',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatearFecha(value, 'dd/MM/yyyy HH:mm')}
        </span>
      )
    },
    {
      title: 'Firma',
      key: 'firma',
      render: (value) => (
        value ? (
          <img
            src={value}
            alt="Firma"
            className="h-12 w-24 object-contain border border-gray-300 rounded cursor-pointer hover:scale-150 transition-transform"
            onClick={() => window.open(value, '_blank')}
            title="Clic para ver firma completa"
          />
        ) : (
          <span className="text-gray-400 text-xs">Sin firma</span>
        )
      )
    },
    {
      title: 'Notas',
      key: 'notas',
      render: (value) => value || '-'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Pagos</h1>
        <p className="text-gray-600 mt-1">Registra los pagos de los clientes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario */}
        <Card title="Nuevo Pago">
          <form onSubmit={handleSubmit} className="space-y-4">
            <ComboBox
              label="Cliente"
              name="clienteId"
              value={formData.clienteId}
              onChange={handleClienteChange}
              options={clientesOptions}
              error={formErrors.clienteId}
              required
              placeholder="Buscar cliente con deuda..."
            />

            {selectedCliente && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Estado de Cuenta</h4>
                <div className="space-y-1 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Saldo Actual:</span>
                    <span className="font-bold text-red-600">
                      {formatearMoneda(selectedCliente.totalDeuda)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Días de Crédito:</span>
                    <span>{selectedCliente.diasCredito} días</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Tipo Cliente:</span>
                    <span className="capitalize">{selectedCliente.tipoCliente.toLowerCase()}</span>
                  </p>
                </div>
              </div>
            )}

            <Input
              label="Monto a Pagar"
              name="monto"
              type="number"
              value={formData.monto}
              onChange={handleChange}
              error={formErrors.monto}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />

            <Select
              label="Método de Pago"
              name="metodoPago"
              value={formData.metodoPago}
              onChange={handleChange}
              options={metodosOptions}
              error={formErrors.metodoPago}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notas (Opcional)</label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Observaciones del pago..."
              />
            </div>

            <SignaturePad
              onSave={handleSignatureSave}
              required={false}
            />

            {formErrors.firma && (
              <p className="text-sm text-red-500 -mt-2">
                {formErrors.firma}
              </p>
            )}

            <Button type="submit" className="w-full">
              Registrar Pago
            </Button>
          </form>
        </Card>

        {/* Resumen */}
        <div className="space-y-4">
          <Card title="Resumen">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Pagos Hoy</span>
                <span className="font-bold text-lg">
                  {pagos.filter(p => {
                    const hoy = getLocalDate()
                    return p.fechaPago.startsWith(hoy)
                  }).length}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-gray-600">Monto Recaudado Hoy</span>
                <span className="font-bold text-lg text-green-600">
                  {formatearMoneda(
                    pagos
                      .filter(p => {
                        const hoy = getLocalDate()
                        return p.fechaPago.startsWith(hoy)
                      })
                      .reduce((sum, p) => sum + p.monto, 0)
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-gray-600">Clientes con Deuda</span>
                <span className="font-bold text-lg text-blue-600">
                  {clientes.filter(c => c.totalDeuda > 0).length}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Historial de pagos */}
      <Card title="Historial de Pagos Recientes">
        <Table
          columns={columnasPagos}
          data={pagos.sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago)).slice(0, 20)}
          emptyMessage="No hay pagos registrados"
          loading={loadingPagos || loadingClientes}
        />
      </Card>
    </div>
  )
}

export default Pagos
