import TitleBar from './components/TitleBar'
import Timer from './components/Timer'
import TodoList from './components/TodoList'
import useTodos from './hooks/useTodos'

const App = () => {
  const { todos, completedCount, totalCount, addTodo, deleteTodo, advanceStatus } = useTodos()

  return (
    <div className="app-container">
      <TitleBar />
      <Timer />
      <TodoList
        todos={todos}
        completedCount={completedCount}
        totalCount={totalCount}
        onAdd={addTodo}
        onDelete={deleteTodo}
        onAdvanceStatus={advanceStatus}
      />
    </div>
  )
}

export default App
