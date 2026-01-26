import { useState, useRef } from 'react'
import useMouseGlow from '../hooks/useMouseGlow'

const SpinnerIcon = () => (
  <svg className="spinner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
  </svg>
)

const StatusIndicator = ({ status, onClick }) => {
  const indicators = {
    in_progress: <span className="status-icon in-progress"><SpinnerIcon /></span>,
    completed: <span className="status-icon completed">✓</span>
  }

  return (
    <button
      className={`status-btn ${status}`}
      onClick={onClick}
      title={status === 'in_progress' ? 'Clique para concluir' : 'Reativar tarefa'}
    >
      {indicators[status]}
      {status === 'in_progress' && <span className="check-hover">✓</span>}
    </button>
  )
}

const TodoItem = ({ todo, isActive, onAdvanceStatus, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <div className={`todo-item ${todo.status} ${isActive ? 'active-task' : ''}`}>
      <StatusIndicator status={todo.status} onClick={() => onAdvanceStatus(todo.id)} />
      <span
        className={`todo-text ${isExpanded ? 'expanded' : ''}`}
        onClick={toggleExpand}
        title={!isExpanded ? 'Clique para expandir' : ''}
      >
        {todo.text}
      </span>
      <button className="delete-btn" onClick={() => onDelete(todo.id)} title="Deletar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

const CollapsibleSection = ({ title, count, isExpanded, onToggle, onAction, actionLabel, children }) => {
  return (
    <div className="collapsible-section">
      <div className="collapsible-header-wrapper">
        <button className="collapsible-header" onClick={onToggle}>
          <span className="collapsible-title">{title}</span>
          <span className="collapsible-count">{count}</span>
          <span className={`collapsible-arrow ${isExpanded ? 'expanded' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        {onAction && (
          <button className="clear-completed-btn" onClick={onAction} title={actionLabel}>
            {actionLabel}
          </button>
        )}
      </div>
      {isExpanded && <div className="collapsible-content">{children}</div>}
    </div>
  )
}

const TodoList = ({
  todos,
  completedCount,
  totalCount,
  onAdd,
  onDelete,
  onAdvanceStatus,
  onClearCompleted
}) => {
  const [newTodoText, setNewTodoText] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const glowRef = useMouseGlow()

  const activeTodos = todos.filter((todo) => todo.status === 'in_progress')
  const completedTodos = todos.filter((todo) => todo.status === 'completed')

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(newTodoText)
    setNewTodoText('')
  }

  return (
    <div className="todo-section" ref={glowRef}>
      <div className="section-glow" />
      <div className="todo-header">
        <span>Tarefas</span>
        <span className="todo-count">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="active-tasks">
        {activeTodos.length === 0 ? (
          <div className="empty-active">
            <span className="empty-text">Nenhuma tarefa ativa</span>
            <span className="empty-hint">Adicione uma tarefa abaixo</span>
          </div>
        ) : (
          activeTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isActive
              onAdvanceStatus={onAdvanceStatus}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      <div className="todo-sections">
        {completedTodos.length > 0 && (
          <CollapsibleSection
            title="Concluídas"
            count={completedTodos.length}
            isExpanded={showCompleted}
            onToggle={() => setShowCompleted((prev) => !prev)}
            onAction={onClearCompleted}
            actionLabel="Limpar"
          >
            {completedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onAdvanceStatus={onAdvanceStatus}
                onDelete={onDelete}
              />
            ))}
          </CollapsibleSection>
        )}
      </div>

      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Nova tarefa..."
          className="todo-input"
        />
        <button type="submit" className="add-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default TodoList
