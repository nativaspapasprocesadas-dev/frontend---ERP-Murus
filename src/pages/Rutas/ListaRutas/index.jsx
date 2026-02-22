import React, { useState, useEffect } from 'react'
import useAuthStore from '@features/auth/useAuthStore'
import { ROLES } from '@utils/constants'
import { useBranches } from '@hooks/useBranches'
import configurationService from '@services/configurationService'
import { Button, Card } from '@components/common'

// Hooks locales
import {
  useRutasData,
  useRutasActions,
  useModalExportacion,
  useModalChofer,
  useModalConfigRutas
} from './hooks'

// Componentes locales
import { RutasHeader, RutasTable, RutasProgramadasTable, HistorialRutasTable } from './components'

// Modales
import {
  ModalExportacion,
  ModalConfigRutas,
  ModalFormularioRuta,
  ModalAsignarChofer
} from './components/Modals'

const ListaRutas = () => {
  const { user, isRole } = useAuthStore()
  const isSuperAdmin = isRole(ROLES.SUPERADMINISTRADOR)

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

  // Hook de sedes
  const { sedesDisponibles } = useBranches()

  // Hook de datos
  const {
    rutasHoy,
    rutasFuturas,
    rutasHistorial,
    update,
    getPedidosDeRuta,
    choferesOptions,
    getChoferById,
    getChoferesOptionsPorSede,
    getSedeById,
    rutasConfig,
    coloresPorNumero,
    nombresPorNumero,
    createRutaConfig,
    updateRutaConfig,
    desactivarRuta,
    activarRuta,
    loadMoreHistorial,
    historialLimit
  } = useRutasData()

  // Hook de modal chofer (necesario para actions)
  const modalChofer = useModalChofer({ update })

  // Hook de acciones
  const { handleCambiarEstado, handleImprimirTicket } = useRutasActions({
    update,
    rutasHoy,
    user,
    abrirModalChofer: modalChofer.openModal,
    empresaConfig
  })

  // Hook de modal exportación
  const modalExportacion = useModalExportacion({
    getPedidosDeRuta,
    getChoferById,
    colores: coloresPorNumero,
    labels: nombresPorNumero,
    empresaConfig
  })

  // Hook de modal config rutas
  const modalConfig = useModalConfigRutas({
    createRutaConfig,
    updateRutaConfig,
    desactivarRuta,
    activarRuta,
    isSuperAdmin
  })

  // Datos para modal exportación (ahora los pedidos vienen del modal, no se cargan aquí)
  const pedidosParaExportar = modalExportacion.modalExportacion.pedidos || []

  const choferExportacion = modalExportacion.modalExportacion.ruta?.choferId
    ? getChoferById(modalExportacion.modalExportacion.ruta.choferId)
    : null

  // Filtrar choferes por sede de la ruta seleccionada
  const rutaParaChofer = modalChofer.modalChofer.ruta
  const choferesOptionsFiltrados = rutaParaChofer?.sedeId
    ? getChoferesOptionsPorSede(rutaParaChofer.sedeId)
    : choferesOptions

  return (
    <div className="space-y-6">
      <RutasHeader onConfiguracion={modalConfig.openConfigModal} />

      <RutasTable
        title="Rutas de Hoy"
        rutas={rutasHoy}
        colores={coloresPorNumero}
        labels={nombresPorNumero}
        isSuperAdmin={isSuperAdmin}
        getSedeById={getSedeById}
        getChoferById={getChoferById}
        onExportar={modalExportacion.openModal}
        onCambiarEstado={handleCambiarEstado}
      />

      <RutasProgramadasTable
        rutas={rutasFuturas}
        colores={coloresPorNumero}
        labels={nombresPorNumero}
        isSuperAdmin={isSuperAdmin}
        getSedeById={getSedeById}
        getChoferById={getChoferById}
      />

      <HistorialRutasTable
        rutas={rutasHistorial}
        rutasConfig={rutasConfig}
        colores={coloresPorNumero}
        labels={nombresPorNumero}
        isSuperAdmin={isSuperAdmin}
        getSedeById={getSedeById}
        getChoferById={getChoferById}
        onExportar={modalExportacion.openModal}
      />

      {/* Botón para cargar más historial */}
      {rutasHistorial.length >= historialLimit && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => loadMoreHistorial(20)}
          >
            Cargar mas historial
          </Button>
        </div>
      )}

      {/* Modales */}
      <ModalExportacion
        isOpen={modalExportacion.modalExportacion.isOpen}
        onClose={modalExportacion.closeModal}
        ruta={modalExportacion.modalExportacion.ruta}
        pedidos={pedidosParaExportar}
        pedidosConMonto={modalExportacion.modalExportacion.pedidosConMonto}
        chofer={choferExportacion}
        colores={coloresPorNumero}
        labels={nombresPorNumero}
        onToggleMonto={modalExportacion.toggleMostrarMonto}
        onExportarRepartidor={modalExportacion.exportarRepartidor}
        onExportarCompleto={modalExportacion.exportarCompleto}
        onImprimirTicket={handleImprimirTicket}
      />

      <ModalConfigRutas
        isOpen={modalConfig.showConfigModal}
        onClose={modalConfig.closeConfigModal}
        rutasConfig={rutasConfig}
        onNuevaRuta={modalConfig.openFormNueva}
        onEditarRuta={modalConfig.openFormEditar}
        onCambiarEstado={modalConfig.cambiarEstadoRuta}
      />

      <ModalFormularioRuta
        isOpen={modalConfig.showFormModal}
        onClose={modalConfig.closeFormModal}
        editando={modalConfig.editando}
        formulario={modalConfig.formulario}
        onChange={modalConfig.handleChangeFormulario}
        onGuardar={modalConfig.guardarRuta}
        isSuperAdmin={isSuperAdmin}
        sedes={sedesDisponibles}
      />

      <ModalAsignarChofer
        isOpen={modalChofer.modalChofer.isOpen}
        onClose={modalChofer.closeModal}
        ruta={modalChofer.modalChofer.ruta}
        labels={nombresPorNumero}
        choferesOptions={choferesOptionsFiltrados}
        choferSeleccionado={modalChofer.choferSeleccionado}
        onChoferChange={modalChofer.setChoferSeleccionado}
        onConfirmar={modalChofer.confirmarEnvio}
      />
    </div>
  )
}

export default ListaRutas
