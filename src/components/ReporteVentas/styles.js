export const filtrosStyles = {
  container: 'bg-white rounded-lg shadow-md p-6 mb-6',
  inputsGroup: 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-4',
  inputWrapper: 'flex flex-col',
  label: 'text-sm font-medium text-gray-700 mb-2',
  buttonsGroup: 'flex gap-3 justify-end'
}

export const tablaVentasStyles = {
  container: 'bg-white rounded-lg shadow-md overflow-hidden',
  header: 'bg-gray-50 px-6 py-4 border-b border-gray-200',
  title: 'text-lg font-semibold text-gray-800',
  tableWrapper: 'overflow-x-auto',
  table: 'min-w-full divide-y divide-gray-200',
  thead: 'bg-gray-50',
  theadRow: '',
  th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
  thRight: 'px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider',
  tbody: 'bg-white divide-y divide-gray-200',
  tr: 'hover:bg-gray-50 transition-colors',
  td: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
  tdRight: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right',
  productoContainer: 'flex items-center gap-3',
  productoImagen: 'w-10 h-10 rounded-md object-cover bg-gray-100',
  productoInfo: 'flex flex-col',
  productoNombre: 'font-medium text-gray-900',
  productoDetalle: 'text-xs text-gray-500',
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  badgePrimary: 'bg-blue-100 text-blue-800',
  badgeSuccess: 'bg-green-100 text-green-800',
  badgeWarning: 'bg-yellow-100 text-yellow-800',
  footer: 'bg-gray-50 px-6 py-4 border-t border-gray-200',
  footerGrid: 'grid grid-cols-1 md:grid-cols-4 gap-4',
  footerItem: 'flex flex-col',
  footerLabel: 'text-xs text-gray-500 uppercase tracking-wider mb-1',
  footerValue: 'text-lg font-semibold text-gray-900',
  emptyState: 'px-6 py-12 text-center',
  emptyStateText: 'text-gray-500 text-sm'
}

export const resumenStyles = {
  container: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6',
  card: 'bg-white rounded-lg shadow-md p-6',
  cardHeader: 'flex items-center justify-between mb-4',
  cardIcon: 'w-12 h-12 rounded-lg flex items-center justify-center',
  cardIconBg: {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600'
  },
  cardBody: 'flex flex-col',
  cardLabel: 'text-sm text-gray-500 mb-1',
  cardValue: 'text-2xl font-bold text-gray-900',
  cardSubtext: 'text-xs text-gray-400 mt-1'
}
