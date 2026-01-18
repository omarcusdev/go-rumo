import { useState, useRef } from 'react'

const MONTHS_FULL = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
]

const WEEKDAYS_FULL = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
]

const formatTooltipDate = (index, period, currentDate) => {
  const formatMap = {
    D: () => `${index}h - ${index + 1}h`,
    S: () => WEEKDAYS_FULL[index],
    M: () => {
      const day = index + 1
      const month = MONTHS_FULL[currentDate.getMonth()]
      return `${day} de ${month}`
    },
    A: () => {
      const month = MONTHS_FULL[index]
      const year = currentDate.getFullYear()
      return `${month} ${year}`
    }
  }

  return formatMap[period]()
}

const StatisticsChart = ({ data, period, currentDate }) => {
  const [hoveredBar, setHoveredBar] = useState(null)
  const containerRef = useRef(null)

  const maxValue = Math.max(...data.map((d) => d.count), 1)
  const totalBars = data.length
  const chartWidth = 280
  const chartHeight = 160
  const barGap = 2
  const barWidth = Math.max((chartWidth - barGap * totalBars) / totalBars, 4)
  const labelStep = totalBars > 12 ? 5 : 1

  const handleMouseEnter = (index, count, event) => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setHoveredBar({ index, count, x, y })
  }

  const handleMouseLeave = () => {
    setHoveredBar(null)
  }

  return (
    <div className="chart-container" ref={containerRef}>
      <svg className="bar-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {data.map((item, index) => {
          const barHeight = (item.count / maxValue) * 120
          const x = index * (barWidth + barGap) + barGap
          const showLabel = totalBars <= 12 || index % labelStep === 0

          return (
            <g key={`${item.label}-${index}`}>
              <rect
                className={`chart-bar ${item.count > 0 ? 'has-value' : ''}`}
                x={x}
                y={chartHeight - 20 - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={barWidth > 6 ? 3 : 1}
                onMouseEnter={(e) => handleMouseEnter(index, item.count, e)}
                onMouseLeave={handleMouseLeave}
              />
              {showLabel && (
                <text
                  className="chart-label"
                  x={x + barWidth / 2}
                  y={chartHeight - 4}
                  textAnchor="middle"
                >
                  {item.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {hoveredBar && (
        <div
          className="chart-tooltip"
          style={{
            left: hoveredBar.x,
            top: hoveredBar.y - 60
          }}
        >
          <span className="tooltip-count">
            {hoveredBar.count} {hoveredBar.count === 1 ? 'rumo' : 'rumos'}
          </span>
          <span className="tooltip-date">
            {formatTooltipDate(hoveredBar.index, period, currentDate)}
          </span>
        </div>
      )}
    </div>
  )
}

export default StatisticsChart
