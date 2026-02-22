import { useState, useRef, useEffect } from 'react'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  differenceInDays
} from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Parsear fecha de forma segura evitando problemas de timezone
 * Usar parseISO para strings en formato 'yyyy-MM-dd'
 */
const safeParseDateString = (dateString) => {
  if (!dateString) return null
  if (dateString instanceof Date) return dateString
  // parseISO maneja correctamente las fechas sin problemas de timezone
  return parseISO(dateString)
}

/**
 * DateRangePicker - Selector de rango de fechas en un solo calendario
 * Permite seleccionar fecha inicio y fin de forma intuitiva
 */
const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  maxDays = 90,
  placeholder = 'Seleccionar rango de fechas',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(startDate ? safeParseDateString(startDate) : new Date())
  const [selecting, setSelecting] = useState('start') // 'start' | 'end'
  const [tempStart, setTempStart] = useState(safeParseDateString(startDate))
  const [tempEnd, setTempEnd] = useState(safeParseDateString(endDate))
  const [hoverDate, setHoverDate] = useState(null)
  const containerRef = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sincronizar con props
  useEffect(() => {
    const parsedStart = safeParseDateString(startDate)
    const parsedEnd = safeParseDateString(endDate)

    setTempStart(parsedStart)
    setTempEnd(parsedEnd)
    setSelecting('start') // Resetear estado de selección

    // Actualizar mes visible al mes de inicio si hay fecha
    if (parsedStart) {
      setCurrentMonth(parsedStart)
    }
  }, [startDate, endDate])

  const handleDateClick = (date) => {
    if (selecting === 'start') {
      setTempStart(date)
      setTempEnd(null)
      setSelecting('end')
    } else {
      // Validar que end >= start
      if (isBefore(date, tempStart)) {
        // Si selecciona una fecha anterior, reiniciar
        setTempStart(date)
        setTempEnd(null)
        setSelecting('end')
        return
      }

      // Validar máximo de días
      const daysDiff = differenceInDays(date, tempStart)
      if (daysDiff > maxDays) {
        return // No permitir si excede el máximo
      }

      setTempEnd(date)
      setSelecting('start')

      // Notificar el cambio
      onChange({
        startDate: format(tempStart, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd')
      })
      setIsOpen(false)
    }
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const renderHeader = () => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <button
        type="button"
        onClick={handlePrevMonth}
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm font-semibold text-gray-900 capitalize">
        {format(currentMonth, 'MMMM yyyy', { locale: es })}
      </span>
      <button
        type="button"
        onClick={handleNextMonth}
        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )

  const renderDaysOfWeek = () => {
    const days = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
    return (
      <div className="grid grid-cols-7 gap-0 px-2 py-2 border-b border-gray-100">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
    )
  }

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isStart = tempStart && isSameDay(day, tempStart)
        const isEnd = tempEnd && isSameDay(day, tempEnd)

        // Determinar si está en el rango
        let isInRange = false
        let isInHoverRange = false

        if (tempStart && tempEnd) {
          isInRange = isWithinInterval(day, { start: tempStart, end: tempEnd })
        } else if (tempStart && hoverDate && selecting === 'end') {
          const rangeStart = isBefore(hoverDate, tempStart) ? hoverDate : tempStart
          const rangeEnd = isAfter(hoverDate, tempStart) ? hoverDate : tempStart
          isInHoverRange = isWithinInterval(day, { start: rangeStart, end: rangeEnd })
        }

        // Verificar si excede el máximo de días desde tempStart
        const exceedsMax = tempStart && selecting === 'end' && differenceInDays(day, tempStart) > maxDays

        days.push(
          <button
            type="button"
            key={day.toString()}
            onClick={() => !exceedsMax && handleDateClick(cloneDay)}
            onMouseEnter={() => setHoverDate(cloneDay)}
            onMouseLeave={() => setHoverDate(null)}
            disabled={exceedsMax}
            className={`
              relative w-9 h-9 flex items-center justify-center text-sm transition-all
              ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
              ${exceedsMax ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-primary-50 cursor-pointer'}
              ${isStart || isEnd ? 'bg-primary-600 text-white hover:bg-primary-700 rounded-full z-10' : ''}
              ${isInRange && !isStart && !isEnd ? 'bg-primary-100 text-primary-800' : ''}
              ${isInHoverRange && !isStart ? 'bg-primary-50' : ''}
              ${isStart && tempEnd ? 'rounded-l-full rounded-r-none' : ''}
              ${isEnd ? 'rounded-r-full rounded-l-none' : ''}
              ${isStart && !tempEnd ? 'rounded-full' : ''}
            `}
          >
            {format(day, 'd')}
          </button>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7 gap-0">
          {days}
        </div>
      )
      days = []
    }

    return <div className="px-2 py-2">{rows}</div>
  }

  const getDisplayValue = () => {
    if (tempStart && tempEnd) {
      return `${format(tempStart, 'dd/MM/yyyy')} - ${format(tempEnd, 'dd/MM/yyyy')}`
    }
    if (tempStart) {
      return `${format(tempStart, 'dd/MM/yyyy')} - Selecciona fin`
    }
    return ''
  }

  const handleClear = (e) => {
    e.stopPropagation()
    setTempStart(null)
    setTempEnd(null)
    setSelecting('start')
    onChange({ startDate: '', endDate: '' })
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-3 py-2.5
          bg-white border border-gray-300 rounded-lg cursor-pointer
          transition-all duration-200
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-primary-400'}
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-100' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-sm ${getDisplayValue() ? 'text-gray-900' : 'text-gray-400'}`}>
            {getDisplayValue() || placeholder}
          </span>
        </div>
        {(tempStart || tempEnd) && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg w-[320px]">
          {/* Indicador de selección */}
          <div className="px-4 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200">
            <p className="text-xs text-gray-600">
              {selecting === 'start'
                ? 'Selecciona la fecha de inicio'
                : 'Selecciona la fecha de fin'}
            </p>
            {tempStart && selecting === 'end' && (
              <p className="text-xs text-primary-600 mt-1">
                Desde: {format(tempStart, 'dd/MM/yyyy')} (max {maxDays} dias)
              </p>
            )}
          </div>

          {renderHeader()}
          {renderDaysOfWeek()}
          {renderCells()}

          {/* Atajos rápidos */}
          <div className="px-3 py-2 border-t border-gray-200 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                setTempStart(today)
                setTempEnd(today)
                onChange({
                  startDate: format(today, 'yyyy-MM-dd'),
                  endDate: format(today, 'yyyy-MM-dd')
                })
                setIsOpen(false)
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                const weekAgo = addDays(today, -7)
                setTempStart(weekAgo)
                setTempEnd(today)
                onChange({
                  startDate: format(weekAgo, 'yyyy-MM-dd'),
                  endDate: format(today, 'yyyy-MM-dd')
                })
                setIsOpen(false)
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Ultimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date()
                const monthAgo = addDays(today, -30)
                setTempStart(monthAgo)
                setTempEnd(today)
                onChange({
                  startDate: format(monthAgo, 'yyyy-MM-dd'),
                  endDate: format(today, 'yyyy-MM-dd')
                })
                setIsOpen(false)
              }}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Ultimos 30 dias
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DateRangePicker
