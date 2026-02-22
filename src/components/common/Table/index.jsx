const Table = ({ columns, data, onRowClick, loading = false, emptyMessage = 'No hay datos' }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-gray-500">
        <svg
          className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* Vista de tabla para escritorio */}
      <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={onRowClick ? 'hover:bg-gray-50 cursor-pointer transition-colors' : ''}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-900">
                      <div className="line-clamp-2">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista de cards para móvil */}
      <div className="md:hidden space-y-3">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            onClick={() => onRowClick && onRowClick(row)}
            className={`bg-white border border-gray-200 rounded-lg p-4 ${
              onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
            }`}
          >
            {columns.map((column, colIndex) => (
              <div key={column.key} className={colIndex > 0 ? 'mt-3' : ''}>
                <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                  {column.title}
                </dt>
                <dd className="text-sm text-gray-900">
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </dd>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

export default Table
