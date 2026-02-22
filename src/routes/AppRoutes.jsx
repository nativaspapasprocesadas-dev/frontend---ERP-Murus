import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './PrivateRoute'
import MainLayout from '@components/layout/MainLayout'
import Login from '@pages/Login'
import Dashboard from '@pages/Dashboard'
import Especies from '@pages/Especies'
import Medidas from '@pages/Medidas'
import Presentaciones from '@pages/Presentaciones'
import Productos from '@pages/Productos'
import CatalogoProductos from '@pages/CatalogoProductos'
import DetalleProducto from '@pages/CatalogoProductos/DetalleProducto'
import Clientes from '@pages/Clientes'
import Pedidos from '@pages/Pedidos'
import NuevoPedido from '@pages/Pedidos/NuevoPedido'
import DetallePedido from '@pages/Pedidos/DetallePedido'
import Rutas from '@pages/Rutas'
import PizarraProduccion from '@pages/Produccion/Pizarra'
import Creditos from '@pages/Creditos'
import Pagos from '@pages/Pagos'
import Reportes from '@pages/Reportes'
import ReporteVentasDiarias from '@pages/ReporteVentasDiarias'
import ReporteRutas from '@pages/ReporteRutas'
import ReporteKilosPorEspecie from '@pages/ReporteKilosPorEspecie'
import ReporteClientes from '@pages/ReporteClientes'
import Configuracion from '@pages/Configuracion'
import Perfil from '@pages/Perfil'
import Choferes from '@pages/Choferes'
import Comunicados from '@pages/Comunicados'
import Sedes from '@pages/Sedes'
import Usuarios from '@pages/Usuarios'
import { ROLES } from '@utils/constants'

// Placeholder components (se crearán después)
const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">Esta página está en construcción</p>
    </div>
  </div>
)

const AppRoutes = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Productos - Admin y SuperAdmin */}
          <Route
            path="especies"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <Especies />
              </PrivateRoute>
            }
          />
          <Route
            path="medidas"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <Medidas />
              </PrivateRoute>
            }
          />
          <Route
            path="presentaciones"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <Presentaciones />
              </PrivateRoute>
            }
          />
          <Route
            path="productos"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <Productos />
              </PrivateRoute>
            }
          />

          {/* Catálogo de Productos - Solo Clientes */}
          <Route
            path="catalogo"
            element={
              <PrivateRoute requiredRoles={[ROLES.CLIENTE]}>
                <CatalogoProductos />
              </PrivateRoute>
            }
          />
          <Route
            path="catalogo/:id"
            element={
              <PrivateRoute requiredRoles={[ROLES.CLIENTE]}>
                <DetalleProducto />
              </PrivateRoute>
            }
          />

          {/* Clientes - SuperAdmin, Admin y Coordinador */}
          <Route
            path="clientes"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                <Clientes />
              </PrivateRoute>
            }
          />
          <Route
            path="clientes/:id"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                <PlaceholderPage title="Detalle Cliente" />
              </PrivateRoute>
            }
          />

          {/* Pedidos */}
          <Route
            path="pedidos"
            element={
              <PrivateRoute
                requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]}
              >
                <Pedidos />
              </PrivateRoute>
            }
          />
          <Route
            path="pedidos/nuevo"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.CLIENTE, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                <NuevoPedido />
              </PrivateRoute>
            }
          />
          <Route
            path="pedidos/:id"
            element={
              <PrivateRoute
                requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]}
              >
                <DetallePedido />
              </PrivateRoute>
            }
          />

          {/* Rutas - SuperAdmin, Admin y Coordinador */}
          <Route
            path="rutas"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                <Rutas />
              </PrivateRoute>
            }
          />

          {/* Choferes - SuperAdmin y Admin */}
          <Route
            path="choferes"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <Choferes />
              </PrivateRoute>
            }
          />

          {/* Producción */}
          <Route
            path="produccion/pizarra"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.PRODUCCION]}>
                <PizarraProduccion />
              </PrivateRoute>
            }
          />

          {/* Créditos */}
          <Route
            path="creditos"
            element={
              <PrivateRoute
                requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]}
              >
                <Creditos />
              </PrivateRoute>
            }
          />

          {/* Pagos - SuperAdmin, Admin y Coordinador */}
          <Route
            path="pagos"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR]}>
                <Pagos />
              </PrivateRoute>
            }
          />

          {/* Reportes - SuperAdmin y Admin */}
          <Route
            path="reportes"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <Reportes />
              </PrivateRoute>
            }
          />
          <Route
            path="reportes/ventas-diarias"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <ReporteVentasDiarias />
              </PrivateRoute>
            }
          />
          <Route
            path="reportes/rutas"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <ReporteRutas />
              </PrivateRoute>
            }
          />
          <Route
            path="reportes/kilos-especie"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <ReporteKilosPorEspecie />
              </PrivateRoute>
            }
          />
          <Route
            path="reportes/clientes"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR]}>
                <ReporteClientes />
              </PrivateRoute>
            }
          />

          {/* Comunicados - SuperAdmin, Admin, Coordinador y Cliente */}
          <Route
            path="comunicados"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR, ROLES.ADMINISTRADOR, ROLES.COORDINADOR, ROLES.CLIENTE]}>
                <Comunicados />
              </PrivateRoute>
            }
          />

          {/* Perfil - Todos los roles */}
          <Route path="perfil" element={<Perfil />} />

          {/* Configuración - Solo Admin */}
          <Route
            path="configuracion"
            element={
              <PrivateRoute requiredRoles={[ROLES.ADMINISTRADOR, ROLES.SUPERADMINISTRADOR]}>
                <Configuracion />
              </PrivateRoute>
            }
          />

          {/* Sedes - Solo Super Admin */}
          <Route
            path="sedes"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR]}>
                <Sedes />
              </PrivateRoute>
            }
          />

          {/* Usuarios - Solo Super Admin */}
          <Route
            path="usuarios"
            element={
              <PrivateRoute requiredRoles={[ROLES.SUPERADMINISTRADOR]}>
                <Usuarios />
              </PrivateRoute>
            }
          />

          {/* Ruta no encontrada */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
