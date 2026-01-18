const PERIODS = ['D', 'S', 'M', 'A']

const PeriodSelector = ({ period, onPeriodChange }) => {
  return (
    <div className="period-selector">
      {PERIODS.map((p) => (
        <button
          key={p}
          className={`period-btn ${period === p ? 'active' : ''}`}
          onClick={() => onPeriodChange(p)}
        >
          {p}
        </button>
      ))}
    </div>
  )
}

export default PeriodSelector
