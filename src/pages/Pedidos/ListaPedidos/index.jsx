import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast } from '@components/common'
import { ModalPedidoAdicional } from '@components/Pedidos'
import { useBranches } from '@hooks/useBranches'
import { useClienteActual, useHorarioRuta } from '@hooks'
import { useToast } from '@hooks/useToast'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'
import configurationService from '@services/configurationService'

// Hooks locales
import {
  usePedidosData,
  usePedidosStats,
  usePedidosActions,
  useWhatsAppConfig,
  useModalAsignarRuta,
  useModalMarcarEntregado,
  useModalEditarPedido,
  useModalCancelar,
  useModalAlerta,
  useModalAprobarVoucher
} from './hooks'

// Componentes locales
import {
  PedidosHeader,
  PedidosBanner,
  PedidosStats,
  PedidosFiltros,
  PedidosTable
} from './components'

// Modales
import {
  ModalAsignarRuta,
  ModalMarcarEntregado,
  ModalEditarPedido,
  ModalCancelar,
  ModalAlertaModificacion,
  ModalAprobarVoucher
} from './components/Modals'

const ListaPedidos = () => {
  const navigate = useNavigate()
  const { user, isRole } = useAuthStore()
  const { getById: getSedeById } = useBranches()
  const isSuperAdmin = isRole(ROLES.SUPERADMINISTRADOR)
  const clienteActual = useClienteActual()
  const { estadoHorario } = useHorarioRuta(clienteActual?.ruta)
  const { toast, showToast, hideToast } = useToast()

  // Estado de filtros (filtro por sede se maneja globalmente via SedeSelector)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [modalPedidoAdicional, setModalPedidoAdicional] = useState(false)

  // Estado para configuración de empresa
  const [empresaConfig, setEmpresaConfig] = useState(null)

  // Cargar configuración de empresa al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      const result = await configurationService.getCompanyConfig()
      if (result.success) {
        // Incluir el código de sede del usuario para usarlo en documentos
        setEmpresaConfig({
          ...result.data,
          sedeCode: user?.sedeCode || 'NV'
        })
      }
    }
    loadConfig()
  }, [user?.sedeCode])

  // Hooks de datos (filtro por sede se maneja automáticamente via sedeIdActiva del store global)
  const {
    pedidosExpandidos,
    pedidosFiltrados,
    loading,
    update,
    cancelPedido,
    refreshPedidos,
    pagination,
    goToPage,
    nextPage,
    prevPage
  } = usePedidosData({
    user, isRole, filtroEstado
  })

  const { stats } = usePedidosStats({})
  const { whatsappMensajeModificaciones } = useWhatsAppConfig()

  // Hooks de acciones
  const { handleVerDetalle, handleNuevoPedido, handleImprimirPedido } = usePedidosActions({
    update, showToast, user, empresaConfig
  })

  // Hooks de modales
  const modalAsignarRuta = useModalAsignarRuta({ refreshPedidos, showToast })
  const modalEntregado = useModalMarcarEntregado({ pedidosExpandidos, refreshPedidos, showToast })
  const modalEditar = useModalEditarPedido({ pedidosExpandidos, refreshPedidos, showToast })
  const modalCancelar = useModalCancelar({ pedidosExpandidos, cancelPedido, showToast })
  const modalAlerta = useModalAlerta()
  const modalVoucher = useModalAprobarVoucher({ pedidosExpandidos, refreshPedidos, showToast })

  // Handlers para acciones de tabla
  const handleEditar = (pedidoId) => {
    modalEditar.openModal(pedidoId)
  }

  const handleCancelar = (pedidoId) => {
    modalCancelar.openModal(pedidoId)
  }

  const handleAlertaModificacion = (pedidoId) => {
    modalAlerta.openModal(pedidoId)
  }

  const handlePedidoAdicional = () => {
    setModalPedidoAdicional(true)
  }

  const handleVerVoucher = (pedidoId) => {
    modalVoucher.openModal(pedidoId)
  }

  return (
    <div className="space-y-6">
      <PedidosHeader
        isRole={isRole}
        onNuevoPedido={handleNuevoPedido}
        onPedidoAdicional={handlePedidoAdicional}
        showToast={showToast}
      />

      {isRole(ROLES.CLIENTE) && clienteActual && (
        <PedidosBanner estadoHorario={estadoHorario} />
      )}

      <PedidosStats stats={stats} />

      <PedidosFiltros
        filtroEstado={filtroEstado}
        onFiltroChange={setFiltroEstado}
        onLimpiar={() => setFiltroEstado('')}
      />

      <PedidosTable
        pedidos={pedidosFiltrados}
        loading={loading}
        isSuperAdmin={isSuperAdmin}
        getSedeById={getSedeById}
        isRole={isRole}
        onVerDetalle={handleVerDetalle}
        onImprimir={handleImprimirPedido}
        onEditar={handleEditar}
        onCancelar={handleCancelar}
        onAlertaModificacion={handleAlertaModificacion}
        onVerVoucher={handleVerVoucher}
        pagination={pagination}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        onGoToPage={goToPage}
      />

      {/* Modales */}
      <ModalAsignarRuta
        isOpen={modalAsignarRuta.modalAsignarRuta.isOpen}
        onClose={modalAsignarRuta.closeModal}
        rutaSeleccionada={modalAsignarRuta.rutaSeleccionada}
        onRutaChange={modalAsignarRuta.setRutaSeleccionada}
        onConfirmar={modalAsignarRuta.confirmarAsignacion}
      />

      <ModalMarcarEntregado
        isOpen={modalEntregado.modalEntregado.isOpen}
        onClose={modalEntregado.closeModal}
        pedido={modalEntregado.modalEntregado.pedido}
        pagoFormData={modalEntregado.pagoFormData}
        aceptarExcedente={modalEntregado.aceptarExcedente}
        onChangeTipoPago={modalEntregado.handleChangeTipoPago}
        onChangeMontoContado={modalEntregado.handleChangeMontoContado}
        onChangeMontoCredito={modalEntregado.handleChangeMontoCredito}
        onChangeAceptarExcedente={modalEntregado.setAceptarExcedente}
        onConfirmar={modalEntregado.confirmarEntrega}
      />

      <ModalEditarPedido
        isOpen={modalEditar.modalEditar.isOpen}
        onClose={modalEditar.closeModal}
        pedido={modalEditar.modalEditar.pedido}
        detallesEditados={modalEditar.modalEditar.detallesEditados}
        onChangeCantidad={modalEditar.handleChangeCantidad}
        onEliminarDetalle={modalEditar.handleEliminarDetalle}
        onConfirmar={modalEditar.confirmarEdicion}
      />

      <ModalCancelar
        isOpen={modalCancelar.modalCancelar.isOpen}
        onClose={modalCancelar.closeModal}
        pedido={modalCancelar.modalCancelar.pedido}
        affectedModules={modalCancelar.modalCancelar.affectedModules}
        onConfirmar={modalCancelar.confirmarCancelacion}
      />

      <ModalAlertaModificacion
        isOpen={modalAlerta.modalAlertaModificacion.isOpen}
        onClose={modalAlerta.closeModal}
        whatsappMensaje={whatsappMensajeModificaciones}
      />

      <ModalPedidoAdicional
        isOpen={modalPedidoAdicional}
        onClose={() => setModalPedidoAdicional(false)}
        onSuccess={async () => {
          await refreshPedidos()
          setModalPedidoAdicional(false)
        }}
        showToast={showToast}
      />

      <ModalAprobarVoucher
        isOpen={modalVoucher.modalVoucher.isOpen}
        onClose={modalVoucher.closeModal}
        pedido={modalVoucher.modalVoucher.pedido}
        loading={modalVoucher.loading}
        onAprobar={modalVoucher.handleAprobar}
        onRechazar={modalVoucher.handleRechazar}
      />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
          duration={toast.duration}
        />
      )}
    </div>
  )
}

export default ListaPedidos
