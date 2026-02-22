import { useState, useMemo, useCallback } from 'react'
import { Card, Button, Table, Modal, Input, Select, Badge, ImageUploader } from '@components/common'
import { useProductsAdmin } from '@hooks/useProductsAdmin'
import { formatearMoneda, formatearFecha } from '@utils/formatters'

const Productos = () => {
  const {
    productosExpandidos,
    loading,
    create,
    update,
    remove,
    toggleCatalogVisibility,
    catalogStats,
    especies,
    medidas,
    presentaciones,
    // Paginación
    pagination,
    goToPage,
    nextPage,
    prevPage,
    // Filtros
    filters,
    updateFilter,
    applyFilters,
    clearFilters
  } = useProductsAdmin()

  // Estado local para búsqueda con debounce
  const [searchInput, setSearchInput] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    especieId: '',
    medidaId: '',
    presentacionId: '',
    precioBaseKg: '',
    fotoUrl: null,
    imageFile: null,
    activo: true,
    mostrarEnCatalogo: true
  })
  const [formErrors, setFormErrors] = useState({})

  // Opciones para los selects (desde APIs reales)
  const especiesOptions = useMemo(() => {
    return especies.filter(e => e.isActive !== false).map(e => ({
      value: e.id,
      label: e.name || e.nombre
    }))
  }, [especies])

  const medidasOptions = useMemo(() => {
    return medidas.filter(m => m.isActive !== false).map(m => ({
      value: m.id,
      label: m.name || m.nombre
    }))
  }, [medidas])

  const presentacionesOptions = useMemo(() => {
    // Presentación = tipo de corte (Entera, Picada, Bastones, etc.)
    return presentaciones.filter(p => p.isActive !== false).map(p => ({
      value: p.id,
      label: p.name || p.nombre || '-'
    }))
  }, [presentaciones])

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        especieId: item.especieId,
        medidaId: item.medidaId,
        presentacionId: item.presentacionId,
        precioBaseKg: item.precioBaseKg,
        fotoUrl: item.fotoUrl || null,
        imageFile: null,
        activo: item.activo,
        mostrarEnCatalogo: item.mostrarEnCatalogo ?? true
      })
    } else {
      setEditingItem(null)
      setFormData({
        especieId: '',
        medidaId: '',
        presentacionId: '',
        precioBaseKg: '',
        fotoUrl: null,
        imageFile: null,
        activo: true,
        mostrarEnCatalogo: true
      })
    }
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormErrors({})
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleImageChange = (fileOrNull) => {
    setFormData((prev) => ({
      ...prev,
      imageFile: fileOrNull
    }))
  }

  const validate = () => {
    const errors = {}
    if (!formData.especieId) errors.especieId = 'La especie es requerida'
    if (!formData.medidaId) errors.medidaId = 'La medida es requerida'
    if (!formData.presentacionId) errors.presentacionId = 'La presentación es requerida'
    if (!formData.precioBaseKg || formData.precioBaseKg <= 0) {
      errors.precioBaseKg = 'El precio debe ser mayor a 0'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      especieId: Number(formData.especieId),
      medidaId: Number(formData.medidaId),
      presentacionId: Number(formData.presentacionId),
      precioBaseKg: Number(formData.precioBaseKg),
      activo: formData.activo,
      mostrarEnCatalogo: formData.mostrarEnCatalogo,
      imageFile: formData.imageFile
    }

    if (editingItem) {
      await update(editingItem.id, data)
    } else {
      await create(data)
    }
    handleCloseModal()
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await remove(id)
    }
  }

  const handleToggleCatalogVisibility = async (productoId) => {
    try {
      await toggleCatalogVisibility(productoId)
    } catch (error) {
      alert(error.message || 'Error al cambiar la visibilidad del producto')
    }
  }

  // Handlers de filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    // Aplicar filtros automáticamente cuando cambia un dropdown
    applyFilters({ [name]: value, search: searchInput })
  }

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value)
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFilters({ search: searchInput })
    }
  }

  const handleApplyFilters = () => {
    applyFilters({ search: searchInput })
  }

  const handleClearFilters = () => {
    setSearchInput('')
    clearFilters()
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = filters.speciesId || filters.measureId || filters.presentationId ||
    filters.isActive !== '' || filters.showInCatalog !== '' || filters.search || searchInput

  // Opciones para filtros
  const filterEspeciesOptions = useMemo(() => [
    { value: '', label: 'Todas las especies' },
    ...especies.filter(e => e.isActive !== false).map(e => ({
      value: e.id,
      label: e.name || e.nombre
    }))
  ], [especies])

  const filterMedidasOptions = useMemo(() => [
    { value: '', label: 'Todas las medidas' },
    ...medidas.filter(m => m.isActive !== false).map(m => ({
      value: m.id,
      label: m.name || m.nombre
    }))
  ], [medidas])

  const filterPresentacionesOptions = useMemo(() => [
    { value: '', label: 'Todas las presentaciones' },
    ...presentaciones.filter(p => p.isActive !== false).map(p => ({
      value: p.id,
      label: p.name || p.nombre || '-'
    }))
  ], [presentaciones])

  const filterEstadoOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'true', label: 'Activos' },
    { value: 'false', label: 'Inactivos' }
  ]

  const filterVisibilidadOptions = [
    { value: '', label: 'Toda visibilidad' },
    { value: 'true', label: 'Visibles en catálogo' },
    { value: 'false', label: 'Ocultos del catálogo' }
  ]

  const columns = [
    {
      title: 'Imagen',
      key: 'fotoUrl',
      render: (value) => {
        const baseUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4020'
        const imageUrl = value && value.startsWith('/uploads/') ? `${baseUrl}${value}` : value

        return (
          <div className="flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Producto"
                className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'flex'
                }}
              />
            ) : null}
            <div className={`w-16 h-16 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        )
      }
    },
    {
      title: 'Producto',
      key: 'nombreCompleto',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      title: 'Especie',
      key: 'especie',
      render: (especie) => especie?.nombre || '-'
    },
    {
      title: 'Medida',
      key: 'medida',
      render: (medida) => <Badge variant="info">{medida?.nombre || '-'}</Badge>
    },
    {
      title: 'Presentación',
      key: 'presentacion',
      render: (presentacion) => <span className="font-semibold">{presentacion?.nombre || '-'}</span>
    },
    {
      title: 'Precio Base/kg',
      key: 'precioBaseKg',
      render: (value) => formatearMoneda(value)
    },
    {
      title: 'Precio Total',
      key: 'precioTotal',
      render: (value) => (
        <span className="font-bold text-primary-600">{formatearMoneda(value)}</span>
      )
    },
    {
      title: 'Estado',
      key: 'activo',
      render: (value) => (
        <Badge variant={value ? 'success' : 'danger'}>
          {value ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      title: 'Mostrar en Catálogo',
      key: 'mostrarEnCatalogo',
      render: (value, row) => (
        <div className="flex items-center justify-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value && row.activo}
              disabled={!row.activo}
              onChange={() => handleToggleCatalogVisibility(row.id)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            {!row.activo && (
              <span className="ml-2 text-xs text-gray-500">(Inactivo)</span>
            )}
          </label>
        </div>
      )
    },
    {
      title: 'Acciones',
      key: 'id',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleOpenModal(row)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            Eliminar
          </Button>
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los productos (Especie + Medida + Presentación)
          </p>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="text-gray-600">
              Total: <span className="font-semibold text-gray-900">{catalogStats.total}</span>
            </span>
            <span className="text-green-600">
              Visibles en catálogo: <span className="font-semibold">{catalogStats.visiblesEnCatalogo}</span>
            </span>
            <span className="text-orange-600">
              Ocultos: <span className="font-semibold">{catalogStats.ocultosEnCatalogo}</span>
            </span>
          </div>
        </div>
        <Button onClick={() => handleOpenModal()}>+ Nuevo Producto</Button>
      </div>

      <Card>
        {/* Sección de Filtros */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-end gap-3">
            {/* Búsqueda por texto */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Buscar</label>
              <input
                type="text"
                placeholder="Nombre, código o especie..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filtro por Especie */}
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-600 mb-1">Especie</label>
              <select
                name="speciesId"
                value={filters.speciesId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {filterEspeciesOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Medida */}
            <div className="w-36">
              <label className="block text-xs font-medium text-gray-600 mb-1">Medida</label>
              <select
                name="measureId"
                value={filters.measureId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {filterMedidasOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Presentación */}
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-600 mb-1">Presentación</label>
              <select
                name="presentationId"
                value={filters.presentationId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {filterPresentacionesOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
              <select
                name="isActive"
                value={filters.isActive}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {filterEstadoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Visibilidad */}
            <div className="w-44">
              <label className="block text-xs font-medium text-gray-600 mb-1">Visibilidad</label>
              <select
                name="showInCatalog"
                value={filters.showInCatalog}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                {filterVisibilidadOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApplyFilters}
                className="whitespace-nowrap"
              >
                Filtrar
              </Button>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleClearFilters}
                  className="whitespace-nowrap"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Indicador de filtros activos */}
          {hasActiveFilters && (
            <div className="mt-2 text-xs text-gray-500">
              Filtros activos aplicados
              {pagination.total > 0 && (
                <span className="ml-1">
                  — {pagination.total} resultado{pagination.total !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        <Table
          columns={columns}
          data={productosExpandidos}
          loading={loading}
          emptyMessage={hasActiveFilters ? "No hay productos que coincidan con los filtros" : "No hay productos registrados"}
        />

        {/* Controles de Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-200 gap-3">
            {/* Info de paginación */}
            <div className="text-sm text-gray-700">
              Mostrando{' '}
              <span className="font-medium">
                {((pagination.page - 1) * pagination.pageSize) + 1}
              </span>
              {' '}-{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>
              {' '}de{' '}
              <span className="font-medium">{pagination.total}</span>
              {' '}productos
            </div>

            {/* Botones de navegación */}
            <div className="flex items-center gap-1">
              {/* Botón Primera Página */}
              <button
                onClick={() => goToPage(1)}
                disabled={pagination.page === 1}
                className={`px-2 py-1 text-sm rounded border ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
                title="Primera página"
              >
                «
              </button>

              {/* Botón Anterior */}
              <button
                onClick={prevPage}
                disabled={pagination.page === 1}
                className={`px-3 py-1 text-sm rounded border ${
                  pagination.page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                Anterior
              </button>

              {/* Números de página */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const startPage = Math.max(1, pagination.page - 2)
                  const pageNum = startPage + i
                  if (pageNum > pagination.totalPages) return null
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded border ${
                        pageNum === pagination.page
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              {/* Indicador de página en móvil */}
              <span className="sm:hidden px-2 text-sm text-gray-600">
                {pagination.page} / {pagination.totalPages}
              </span>

              {/* Botón Siguiente */}
              <button
                onClick={nextPage}
                disabled={pagination.page === pagination.totalPages}
                className={`px-3 py-1 text-sm rounded border ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
              >
                Siguiente
              </button>

              {/* Botón Última Página */}
              <button
                onClick={() => goToPage(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className={`px-2 py-1 text-sm rounded border ${
                  pagination.page === pagination.totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                }`}
                title="Última página"
              >
                »
              </button>
            </div>
          </div>
        )}

        {/* Info cuando hay una sola página */}
        {pagination && pagination.total > 0 && pagination.totalPages === 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando {pagination.total} producto{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Especie"
              name="especieId"
              value={formData.especieId}
              onChange={handleChange}
              options={especiesOptions}
              error={formErrors.especieId}
              required
            />

            <Select
              label="Medida"
              name="medidaId"
              value={formData.medidaId}
              onChange={handleChange}
              options={medidasOptions}
              error={formErrors.medidaId}
              required
            />

            <Select
              label="Presentación"
              name="presentacionId"
              value={formData.presentacionId}
              onChange={handleChange}
              options={presentacionesOptions}
              error={formErrors.presentacionId}
              required
            />

            <Input
              label="Precio Base por Kg (S/.)"
              name="precioBaseKg"
              type="number"
              value={formData.precioBaseKg}
              onChange={handleChange}
              error={formErrors.precioBaseKg}
              required
              min="0.01"
              step="0.01"
              placeholder="4.50"
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader
              value={formData.fotoUrl}
              onChange={handleImageChange}
              label="Foto Referencial del Producto"
              error={formErrors.fotoUrl}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                Activo
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mostrarEnCatalogo"
                name="mostrarEnCatalogo"
                checked={formData.mostrarEnCatalogo && formData.activo}
                disabled={!formData.activo}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label
                htmlFor="mostrarEnCatalogo"
                className={`text-sm font-medium ${
                  formData.activo ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                Mostrar en Catálogo para Clientes
              </label>
            </div>

            {!formData.activo && (
              <p className="text-xs text-gray-500 ml-6">
                Los productos inactivos no se pueden mostrar en el catálogo
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingItem ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Productos
