import useRumos from '../hooks/useRumos'
import PeriodSelector from './PeriodSelector'
import StatisticsChart from './StatisticsChart'

const Statistics = () => {
  const { filteredRumos, period, setPeriod, currentDate, navigatePeriod, periodLabel, totalCount } =
    useRumos()

  return (
    <div className="statistics-section">
      <PeriodSelector period={period} onPeriodChange={setPeriod} />
      <div className="statistics-header">
        <button className="period-nav-btn" onClick={() => navigatePeriod(-1)} title="Anterior">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="period-label">
          {periodLabel} - {totalCount} {totalCount === 1 ? 'Rumo' : 'Rumos'}
        </span>
        <button className="period-nav-btn" onClick={() => navigatePeriod(1)} title="Próximo">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <StatisticsChart data={filteredRumos} period={period} currentDate={currentDate} />
    </div>
  )
}

export default Statistics
