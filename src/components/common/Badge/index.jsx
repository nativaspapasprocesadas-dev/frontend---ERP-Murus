const Badge = ({ children, variant = 'gray', className = '' }) => {
  const variants = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    gray: 'badge-gray'
  }

  return <span className={`badge ${variants[variant]} ${className}`}>{children}</span>
}

export default Badge
