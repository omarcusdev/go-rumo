import TitleBar from './components/TitleBar'
import FocusedTask from './components/FocusedTask'
import Timer from './components/Timer'
import TodoList from './components/TodoList'
import useTodos from './hooks/useTodos'

const App = () => {
  const {
    todos,
    focusedTodo,
    focusedTodoId,
    completedCount,
    totalCount,
    addTodo,
    deleteTodo,
    advanceStatus,
    setFocusedTodo
  } = useTodos()

  return (
    <div className="app-container">
      <TitleBar />
      <FocusedTask task={focusedTodo} />
      <Timer />
      <TodoList
        todos={todos}
        focusedTodoId={focusedTodoId}
        completedCount={completedCount}
        totalCount={totalCount}
        onAdd={addTodo}
        onDelete={deleteTodo}
        onAdvanceStatus={advanceStatus}
        onFocus={setFocusedTodo}
      />
    </div>
  )
}

export default App
