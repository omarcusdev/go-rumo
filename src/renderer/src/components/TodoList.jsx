import { useState } from 'react'

const StatusIndicator = ({ status, onClick }) => {
  const indicators = {
    pending: <span className="status-icon pending">○</span>,
    in_progress: (
      <span className="status-icon in-progress">
        <svg className="spinner" viewBox="0 0 24 24" fill="none">
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
    ),
    completed: <span className="status-icon completed">✓</span>
  }

  return (
    <button className={`status-btn ${status}`} onClick={onClick} title="Avançar status">
      {indicators[status]}
    </button>
  )
}

const TodoItem = ({ todo, isFocused, onAdvanceStatus, onDelete, onFocus }) => {
  return (
    <div className={`todo-item ${todo.status} ${isFocused ? 'focused' : ''}`}>
      <StatusIndicator status={todo.status} onClick={() => onAdvanceStatus(todo.id)} />
      <span className="todo-text" onClick={() => onFocus(todo.id)}>
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

const TodoList = ({
  todos,
  focusedTodoId,
  completedCount,
  totalCount,
  onAdd,
  onDelete,
  onAdvanceStatus,
  onFocus
}) => {
  const [newTodoText, setNewTodoText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onAdd(newTodoText)
    setNewTodoText('')
  }

  return (
    <div className="todo-section">
      <div className="todo-header">
        <span>Tarefas</span>
        <span className="todo-count">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="todo-list">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isFocused={todo.id === focusedTodoId}
            onAdvanceStatus={onAdvanceStatus}
            onDelete={onDelete}
            onFocus={onFocus}
          />
        ))}
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
