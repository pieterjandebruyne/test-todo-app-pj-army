import { useState } from "react";
import TodoList, { type Filter } from "./components/TodoList";
import type { Todo } from "./types";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: generateId(), title: "Example task", completed: false },
  ]);
  const [activeFilter, setActiveFilter] = useState<Filter>("all");

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  return (
    <main className="app">
      <h1>Todo App</h1>
      <TodoList
        todos={todos}
        filter={activeFilter}
        onFilterChange={setActiveFilter}
        onClearCompleted={clearCompleted}
        onToggleTodo={toggleTodo}
      />
    </main>
  );
}
