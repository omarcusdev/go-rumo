const StatusBadge = ({ status }) => {
  if (status === 'in_progress') {
    return (
      <span className="focus-status">
        <svg className="spinner" viewBox="0 0 24 24" fill="none" width="16" height="16">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="32"
            strokeDashoffset="12"
          />
        </svg>
      </span>
    )
  }
  if (status === 'completed') {
    return <span className="focus-status completed">✓</span>
  }
  return null
}

const FocusedTask = ({ task }) => {
  if (!task) return null

  return (
    <div className="focused-task">
      <span className="focus-icon">🎯</span>
      <span className="focus-text">{task.text}</span>
      <StatusBadge status={task.status} />
    </div>
  )
}

export default FocusedTask
