import { useState, useRef, useEffect } from 'react'

/**
 * ComboBox - Select editable con búsqueda/filtrado
 * Permite seleccionar de una lista o escribir para filtrar opciones
 */
const ComboBox = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  error,
  required = false,
  disabled = false,
  className = '',
  valueKey = 'value',
  labelKey = 'label',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Encontrar la opción seleccionada
  const selectedOption = options.find(opt => opt[valueKey] === value)
  const displayText = selectedOption ? selectedOption[labelKey] : ''

  // Filtrar opciones basado en el término de búsqueda
  const filteredOptions = options.filter(option =>
    option[labelKey].toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Manejar teclado (Enter, Escape, Arrow Up/Down)
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
        break

      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break

      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex])
        }
        break

      default:
        break
    }
  }

  const handleSelectOption = (option) => {
    // Simular evento de cambio para mantener compatibilidad
    const syntheticEvent = {
      target: {
        name,
        value: option[valueKey]
      }
    }
    onChange(syntheticEvent)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputClick = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      inputRef.current?.focus()
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    const syntheticEvent = {
      target: {
        name,
        value: ''
      }
    }
    onChange(syntheticEvent)
    setSearchTerm('')
    setIsOpen(false)
    setHighlightedIndex(-1)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={wrapperRef}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <div
          className={`input flex items-center justify-between cursor-text ${
            error ? 'border-red-500 focus-within:ring-red-500' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          onClick={!disabled ? handleInputClick : undefined}
        >
          <input
            ref={inputRef}
            type="text"
            id={name}
            name={name}
            value={isOpen ? searchTerm : displayText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent border-none outline-none p-0 text-sm"
            autoComplete="off"
            {...props}
          />

          <div className="flex items-center gap-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 p-1"
                tabIndex={-1}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No se encontraron resultados
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option[valueKey]}
                  onClick={() => handleSelectOption(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                    index === highlightedIndex
                      ? 'bg-primary-100 text-primary-900'
                      : option[valueKey] === value
                      ? 'bg-primary-50 text-primary-800 font-medium'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {option[labelKey]}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

export default ComboBox
