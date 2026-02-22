import { formatearMoneda, formatearKilos, formatearNumero } from '@utils/formatters'
import { resumenStyles } from './styles'

/**
 * Componente para mostrar resumen de ventas con tarjetas
 */
export const ResumenVentas = ({ totales }) => {
  const estadisticas = [
    {
      label: 'Total Ventas',
      value: formatearMoneda(totales.totalMonto),
      icon: '💰',
      color: 'green',
      subtext: `${totales.cantidadPedidos} pedidos`
    },
    {
      label: 'Total Kilos',
      value: formatearKilos(totales.totalKilos),
      icon: '📦',
      color: 'blue',
      subtext: `${formatearNumero(totales.totalBolsas)} bolsas`
    },
    {
      label: 'Productos Vendidos',
      value: formatearNumero(totales.totalProductos),
      icon: '🥔',
      color: 'yellow',
      subtext: 'Variedades distintas'
    }
  ]

  return (
    <div className={resumenStyles.container}>
      {estadisticas.map((stat, index) => (
        <div key={index} className={resumenStyles.card}>
          <div className={resumenStyles.cardHeader}>
            <div className={`${resumenStyles.cardIcon} ${resumenStyles.cardIconBg[stat.color]}`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
          <div className={resumenStyles.cardBody}>
            <span className={resumenStyles.cardLabel}>{stat.label}</span>
            <span className={resumenStyles.cardValue}>{stat.value}</span>
            <span className={resumenStyles.cardSubtext}>{stat.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

