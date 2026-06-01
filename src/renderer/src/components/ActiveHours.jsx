import useActiveHours from '../hooks/useActiveHours'
import StatisticsChart from './StatisticsChart'
import { formatActiveShort } from '../lib/activeTime'

const ActiveHours = () => {
  const { todaySeconds, history } = useActiveHours()
  const data = history.map((entry) => ({ label: entry.label, count: entry.seconds }))

  return (
    <div className="active-hours-section">
      <div className="active-hours-header">
        <span className="active-hours-title">Tempo ativo</span>
        <span className="active-hours-today">{formatActiveShort(todaySeconds)} hoje</span>
      </div>
      <StatisticsChart
        data={data}
        formatValue={formatActiveShort}
        formatTooltipLabel={(index) => history[index]?.label ?? ''}
      />
    </div>
  )
}

export default ActiveHours
