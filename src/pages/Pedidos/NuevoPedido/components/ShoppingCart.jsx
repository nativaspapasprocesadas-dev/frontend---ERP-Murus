import React from 'react'
import { Card, Button } from '@components/common'
import { formatearMoneda } from '@utils/formatters'
import CartItem from './CartItem'
import CartItemEditor from './CartItemEditor'

const ShoppingCart = ({
  carrito,
  totales,
  editandoIndex,
  productoEditando,
  setProductoEditando,
  productoEditandoSeleccionado,
  especiesOptions,
  medidasEditandoOptions,
  presentacionesEditandoOptions,
  onEdit,
  onDelete,
  onSaveEdit,
  onCancelEdit,
  onClearCart,
  onCreateOrder
}) => {
  // Wrapper para pasar el producto seleccionado al guardar
  const handleSaveEdit = (index) => {
    onSaveEdit(index, productoEditandoSeleccionado)
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Carrito de Compras ({carrito.length} items)</h3>

      {carrito.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>El carrito está vacío</p>
          <p className="text-sm mt-2">Agrega productos usando el formulario de arriba</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Imagen</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Producto</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Cantidad</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Kg/Bolsa</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Total Kg</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Precio/Kg</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">Subtotal</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {carrito.map((item, index) => {
                  const isEditing = editandoIndex === index

                  return (
                    <React.Fragment key={index}>
                      <CartItem
                        item={item}
                        index={index}
                        isEditing={isEditing}
                        productoEditandoSeleccionado={productoEditandoSeleccionado}
                        productoEditando={productoEditando}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={onCancelEdit}
                      />
                      {isEditing && (
                        <CartItemEditor
                          productoEditando={productoEditando}
                          setProductoEditando={setProductoEditando}
                          especiesOptions={especiesOptions}
                          medidasOptions={medidasEditandoOptions}
                          presentacionesOptions={presentacionesEditandoOptions}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Kilos:</span>
                  <span className="font-semibold">{totales.totalKilos.toFixed(2)} kg</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-semibold">{carrito.length}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-primary-600 text-2xl">
                    {formatearMoneda(totales.totalMonto)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="secondary" onClick={onClearCart}>
              Vaciar Carrito
            </Button>
            <Button onClick={onCreateOrder} size="lg">
              Crear Pedido
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

export default ShoppingCart
