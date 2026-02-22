import { DateRangePicker } from '@components/common'
import Button from '@components/common/Button'
import { filtrosStyles } from './styles'

/**
 * Componente para filtrar reportes por rango de fechas
 * ELM-034: Validacion de rango maximo 90 dias (alineado con API-062)
 * Usa DateRangePicker para mejor UX con seleccion en un solo calendario
 *
 * Las fechas se manejan directamente desde las props del hook padre
 * para evitar desincronización de estado
 */
export const FiltrosFecha = ({ fechaInicio, fechaFin, onFiltrar, onLimpiar }) => {
  const handleDateRangeChange = ({ startDate, endDate }) => {
    // Auto-filtrar cuando se selecciona un rango completo
    if (startDate && endDate) {
      onFiltrar(startDate, endDate)
    }
  }

  return (
    <div className={filtrosStyles.container}>
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
        <div className="w-full sm:w-auto sm:min-w-[320px]">
          <label className={filtrosStyles.label}>Rango de Fechas</label>
          <DateRangePicker
            startDate={fechaInicio}
            endDate={fechaFin}
            onChange={handleDateRangeChange}
            maxDays={90}
            placeholder="Seleccionar rango de fechas..."
          />
        </div>

        <div className={filtrosStyles.buttonsGroup}>
          <Button type="button" variant="secondary" onClick={onLimpiar}>
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {fechaInicio && fechaFin && (
        <div className="mt-3 px-3 py-2 bg-primary-50 border border-primary-200 rounded-lg inline-flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-primary-800">
            Filtrando: <strong>{fechaInicio}</strong> al <strong>{fechaFin}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
