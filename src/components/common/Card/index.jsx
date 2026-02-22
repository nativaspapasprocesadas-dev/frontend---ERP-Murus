const Card = ({ children, title, subtitle, actions, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b">
          <div className="min-w-0">
            {title && <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{title}</h3>}
            {subtitle && <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default Card
