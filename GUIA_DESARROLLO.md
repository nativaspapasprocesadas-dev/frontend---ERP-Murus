# 📖 Guía de Desarrollo - Módulos Pendientes

## ✅ **Módulos Completados**

1. ✅ **Productos** - Completo (Especies, Medidas, Presentaciones, Productos)
2. ✅ **Clientes** - Lista con gestión de créditos
3. ✅ **Dashboard** - Funcional con estadísticas por rol
4. ✅ **Login** - Autenticación completa
5. ✅ **Estructura Base** - Hooks, componentes, mocks, navegación

## 📋 **Módulos Pendientes**

### 1. Módulo de Pedidos

**Archivos a crear:**
- `/src/pages/Pedidos/index.jsx` - Lista de pedidos
- `/src/pages/Pedidos/NuevoPedido.jsx` - Formulario para crear pedido (Cliente)
- `/src/pages/Pedidos/DetallePedido.jsx` - Ver detalle con adiciones

**Funcionalidades clave:**
- Lista filtrable por estado y cliente
- Sistema de adiciones (registrar cambios 10→12 bolsas)
- Restricción: no permitir adiciones si ruta está "Enviada"
- Mostrar productos con precios personalizados del cliente
- Cambiar estado del pedido

**Hooks a usar:**
- `useMockPedidos()` - Para pedidos expandidos
- `useMockProductos()` - Para productos disponibles
- `useMockClientes()` - Para validar límite de crédito

**Ejemplo de estructura:**
```jsx
const Pedidos = () => {
  const { pedidosExpandidos, getPedidosByEstado } = useMockPedidos()
  const { isRole } = useAuthStore()

  // Si es cliente, mostrar solo sus pedidos
  // Si es admin/coord, mostrar todos con filtros

  return (
    <Card>
      <Table columns={columns} data={pedidos} />
    </Card>
  )
}
```

---

### 2. Módulo de Rutas

**Archivos a crear:**
- `/src/pages/Rutas/index.jsx` - Lista de rutas del día
- `/src/pages/Rutas/AsignarPedidos.jsx` - Asignar pedidos pendientes a rutas
- `/src/pages/Rutas/DetalleRuta.jsx` - Ver ruta con botón "Exportar PDF"

**Funcionalidades clave:**
- Mostrar 3 rutas del día actual
- Arrastrar y soltar pedidos pendientes a rutas (drag & drop)
- Marcar ruta como "Enviada" (bloquea nuevas adiciones)
- Exportar ruta a PDF con formato de imagen I2.jpeg

**Hooks a usar:**
- `useMockRutas()` - Rutas del día
- `useMockPedidos()` - Pedidos pendientes y por ruta

**Estructura de exportación PDF:**
```javascript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const exportarRutaPDF = (ruta, pedidos) => {
  const doc = new jsPDF()

  // Título
  doc.setFontSize(18)
  doc.text(`Ruta ${ruta.numero} - ${ruta.fecha}`, 20, 20)

  // Tabla con pedidos
  const rows = pedidos.map(p => [
    p.nombreCliente,
    p.direccionCliente,
    p.telefonoCliente,
    `${p.totalKilos} kg`,
    formatearMoneda(p.totalMonto),
    p.tipoPago
  ])

  doc.autoTable({
    head: [['Cliente', 'Dirección', 'Teléfono', 'Kilos', 'Monto', 'Pago']],
    body: rows,
    startY: 30
  })

  doc.save(`Ruta_${ruta.numero}_${ruta.fecha}.pdf`)
}
```

---

### 3. Pizarra de Producción

**Archivo a crear:**
- `/src/pages/Produccion/Pizarra.jsx`

**Funcionalidades clave:**
- Vista tipo pizarra basada en imagen I3.jpg
- Organizar por: Especie (filas) → Medida (columnas) → Ruta (3 subcolumnas)
- Checkbox para marcar productos como "Completado"
- Actualizar `mockChecklistProduccion`

**Estructura visual:**
```
┌─────────────────────────────────────────────────────┐
│                      ÚNICA                          │
├─────────┬───────────────────────────────────────────┤
│  #14    │  Ruta1  │  Ruta2  │  Ruta3               │
│  5kg    │   [10]  │   [14]  │   [7]   ← Cantidades │
│  10kg   │   [4]   │   [0]   │   [3]                │
├─────────┼─────────┼─────────┼─────────┤
│  #12    │  ...                                      │
└─────────┴───────────────────────────────────────────┘
```

**Hook a usar:**
- `useMock(mockChecklistProduccion)` - Checklist de producción
- `useMockRutas()` - Rutas del día

---

### 4. Módulo de Créditos

**Archivos a crear:**
- `/src/pages/Creditos/index.jsx` - Vista principal
- `/src/pages/Creditos/DetalleCredito.jsx` - Modal con detalles

**Funcionalidades clave:**
- Vista diferente por rol:
  - **Cliente**: Solo sus créditos (lectura)
  - **Admin/Coord**: Todos los créditos con alertas
- Filtros por: Pendiente, Vencido, Pagado
- Mostrar alertas de monto alto y días transcurridos
- Botón para registrar pago (solo admin/coord)

**Hooks a usar:**
- `useMockCreditos()` - Créditos con alertas
- `useMockClientes()` - Info de clientes

---

### 5. Módulo de Pagos

**Archivo a crear:**
- `/src/pages/Pagos/index.jsx`

**Funcionalidades clave:**
- Formulario para registrar pago
- Seleccionar cliente → Mostrar crédito más antiguo
- Ingresar monto, método de pago, notas
- Aplicar pago automáticamente al crédito más antiguo
- Actualizar `saldoPendiente` y `saldoActual` del cliente

**Hook a usar:**
- `useMockCreditos()` - Para obtener crédito más antiguo
- `useMock(mockPagos)` - Para crear nuevo pago

**Lógica de aplicación de pago:**
```javascript
const aplicarPago = (clienteId, monto) => {
  const creditoMasAntiguo = getCreditoMasAntiguoCliente(clienteId)

  if (!creditoMasAntiguo) return

  const nuevoSaldo = creditoMasAntiguo.saldoPendiente - monto

  // Actualizar crédito
  update(creditoMasAntiguo.id, {
    saldoPendiente: Math.max(0, nuevoSaldo),
    estado: nuevoSaldo <= 0 ? 'pagado_total' : 'pagado_parcial'
  })

  // Si sobra dinero, aplicar al siguiente crédito
  if (nuevoSaldo < 0) {
    aplicarPago(clienteId, Math.abs(nuevoSaldo))
  }
}
```

---

### 6. Módulo de Reportes

**Archivo a crear:**
- `/src/pages/Reportes/index.jsx`

**Reportes a implementar:**

1. **Ventas Diarias**
   - Total kilos y monto por día
   - Gráfico de línea con últimos 30 días

2. **Top Clientes**
   - Clientes con mayor volumen
   - Clientes con mayor facturación

3. **Ventas por Ruta**
   - Comparativa entre Ruta 1, 2 y 3

4. **Productos Más Vendidos**
   - Top 10 productos por cantidad

5. **Estado de Cartera**
   - Total por cobrar
   - Distribución por antigüedad

**Librerías sugeridas:**
- Chart.js + react-chartjs-2 (para gráficos)
- Exportar a Excel con xlsx

---

### 7. Configuración

**Archivo a crear:**
- `/src/pages/Configuracion/index.jsx`

**Funcionalidades:**
- Editar `montoAltoGlobal` para alertas
- Configurar plantillas de PDF
- Gestionar usuarios (crear, editar, desactivar)

**Hook a usar:**
- `useMock(mockConfiguracionAlertas)`
- `useMock(mockUsuarios)`

---

## 🛠️ **Patrón de Desarrollo**

Todos los módulos deben seguir este patrón:

```jsx
// 1. Imports
import { useState } from 'react'
import { Card, Button, Table, Modal } from '@components/common'
import { useMockEntidad } from '@hooks/useMock'

// 2. Componente
const MiModulo = () => {
  // 3. Hooks
  const { data, loading, create, update, remove } = useMockEntidad()

  // 4. Estados locales
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 5. Handlers
  const handleAction = () => {
    // Lógica
  }

  // 6. Render
  return (
    <div className="space-y-6">
      <Card>
        <Table columns={columns} data={data} />
      </Card>
    </div>
  )
}

export default MiModulo
```

---

## 📝 **Checklist de Implementación**

Para cada módulo:

- [ ] Crear archivo de página
- [ ] Importar hooks necesarios
- [ ] Definir columnas de tabla
- [ ] Implementar funcionalidad CRUD
- [ ] Agregar validaciones
- [ ] Actualizar rutas en `AppRoutes.jsx`
- [ ] Probar con diferentes roles
- [ ] Verificar sincronización de datos

---

## 🚀 **Siguiente Paso Recomendado**

1. **Pedidos** - Es el módulo más crítico
2. **Rutas** - Depende de Pedidos
3. **Pizarra** - Depende de Rutas
4. **Créditos** - Ya tiene datos
5. **Pagos** - Depende de Créditos
6. **Reportes** - Usa todos los datos
7. **Configuración** - Funciones administrativas

---

## 💡 **Tips de Desarrollo**

1. **Reutiliza componentes**: Usa los componentes de `/src/components/common/`
2. **No hardcodees datos**: Siempre usa hooks de `/src/hooks/useMock/`
3. **Mantén sincronización**: Cuando creas/editas, actualiza todos los datos relacionados
4. **Valida permisos**: Usa `hasPermission()` de `useAuthStore`
5. **Formatea datos**: Usa funciones de `/src/utils/formatters.js`

---

¡Buena suerte con el desarrollo! 🎉
