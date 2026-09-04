import { useState } from "react";
import TodoList from "./components/TodoList";
import { useTodos } from "./hooks/useTodos";

export default function App() {
  const [todos, setTodos] = useTodos();
  const [inputValue, setInputValue] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed">("all");

  const addTodo = () => {
    const title = inputValue.trim();
    if (!title) return;
    setTodos((prev) => [{ id: crypto.randomUUID(), title, completed: false }, ...prev]);
    setInputValue("");
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return (
    <main className="app">
      <h1>Todo App</h1>
      <form
        className="todo-input"
        onSubmit={(e) => {
          e.preventDefault();
          addTodo();
        }}
      >
        <input
          type="text"
          className="todo-input__field"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="What needs to be done?"
        />
        <button type="submit" className="todo-input__button">
          Add
        </button>
      </form>
      <TodoList
        todos={todos}
        filter={activeFilter}
        onFilterChange={setActiveFilter}
        onClearCompleted={clearCompleted}
        onToggleTodo={toggleTodo}
        onDelete={deleteTodo}
      />
    </main>
  );
}
