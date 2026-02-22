/**
 * Schema de validación para creación de cliente
 * Define campos, validaciones y configuraciones del formulario
 */

export const clienteSchema = {
  // ============================================
  // INFORMACIÓN DEL USUARIO (Acceso al sistema)
  // ============================================
  nombre: {
    required: true,
    minLength: 3,
    maxLength: 100,
    label: 'Nombre del Negocio (Usuario)',
    placeholder: 'Ej: Restaurante El Buen Sabor',
    helpText: 'Este nombre se usará para iniciar sesión. Puede contener espacios.',
    unique: true
  },
  password: {
    required: true,
    type: 'password',
    minLength: 6,
    label: 'Contraseña',
    placeholder: 'Mínimo 6 caracteres',
    helpText: 'Contraseña temporal (el cliente podrá cambiarla)'
  },
  telefono: {
    required: true,
    pattern: /^[0-9]{9}$/,
    label: 'Teléfono del Negocio',
    placeholder: '987654321',
    helpText: '9 dígitos, solo números'
  },

  // ============================================
  // PERSONA DE CONTACTO (Datos del encargado)
  // ============================================
  nombreContacto: {
    required: true,
    minLength: 3,
    maxLength: 100,
    label: 'Nombre del Contacto',
    placeholder: 'Ej: Juan Pérez García',
    helpText: 'Nombre completo de la persona de contacto'
  },
  cargoContacto: {
    required: true,
    minLength: 3,
    maxLength: 50,
    label: 'Cargo',
    placeholder: 'Ej: Administrador, Gerente, Encargado',
    helpText: 'Cargo o puesto de la persona de contacto'
  },
  telefonoContacto: {
    required: true,
    pattern: /^[0-9]{9}$/,
    label: 'Teléfono del Contacto',
    placeholder: '912345678',
    helpText: '9 dígitos, solo números'
  },

  // ============================================
  // INFORMACIÓN DEL CLIENTE (Datos comerciales)
  // ============================================
  direccion: {
    required: true,
    minLength: 10,
    maxLength: 200,
    label: 'Dirección Completa',
    placeholder: 'Av. Los Olivos 234, San Isidro',
    helpText: 'Dirección para entrega de pedidos'
  },
  ruta: {
    required: true,
    type: 'select',
    options: [
      { value: 1, label: 'Ruta 1' },
      { value: 2, label: 'Ruta 2' },
      { value: 3, label: 'Ruta 3' }
    ],
    label: 'Ruta Asignada',
    helpText: 'Ruta de distribución para este cliente'
  },

  // ============================================
  // CONFIGURACIÓN DE CRÉDITO
  // ============================================
  diasCredito: {
    required: true,
    type: 'number',
    min: 0,
    max: 90,
    default: 15,
    label: 'Días de Crédito',
    placeholder: '15',
    helpText: 'Si es 0, el cliente SOLO puede pagar al contado. Si es mayor a 0, puede pagar a crédito con ese plazo.'
  }
}

/**
 * Función de validación
 * Valida un formulario completo contra el schema
 */
export const validarCliente = (formData) => {
  const errors = {}

  // Validar cada campo según el schema
  Object.keys(clienteSchema).forEach((fieldName) => {
    const field = clienteSchema[fieldName]
    const value = formData[fieldName]

    // Validar campo requerido
    if (field.required && !value) {
      errors[fieldName] = `${field.label} es requerido`
      return
    }

    // Validar dependencias (campos condicionales)
    if (field.dependsOn && !formData[field.dependsOn]) {
      return // No validar si el campo dependiente no está activo
    }

    // Si el campo no es requerido y está vacío, no validar más
    if (!field.required && !value) {
      return
    }

    // Validar tipo email (solo si hay valor)
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors[fieldName] = 'Formato de correo inválido'
        return
      }
    }

    // Validar patrón (ej: teléfono)
    if (field.pattern && !field.pattern.test(value)) {
      errors[fieldName] = `${field.label} no tiene el formato correcto`
      return
    }

    // Validar longitud mínima
    if (field.minLength && value.length < field.minLength) {
      errors[fieldName] = `${field.label} debe tener al menos ${field.minLength} caracteres`
      return
    }

    // Validar longitud máxima
    if (field.maxLength && value.length > field.maxLength) {
      errors[fieldName] = `${field.label} no puede exceder ${field.maxLength} caracteres`
      return
    }

    // Validar valor mínimo (números)
    if (field.type === 'number' && field.min !== undefined) {
      const numValue = parseFloat(value)
      if (numValue < field.min) {
        errors[fieldName] = `${field.label} debe ser mayor o igual a ${field.min}`
        return
      }
    }

    // Validar valor máximo (números)
    if (field.type === 'number' && field.max !== undefined) {
      const numValue = parseFloat(value)
      if (numValue > field.max) {
        errors[fieldName] = `${field.label} no puede ser mayor a ${field.max}`
        return
      }
    }
  })

  // Validaciones personalizadas adicionales
  // (Actualmente no hay validaciones adicionales)

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Valores iniciales del formulario
 */
export const clienteInitialValues = {
  nombre: '',
  password: '',
  telefono: '',
  nombreContacto: '',
  cargoContacto: '',
  telefonoContacto: '',
  direccion: '',
  ruta: '',
  diasCredito: 15 // Por defecto: 15 días de crédito (cliente recurrente)
}

