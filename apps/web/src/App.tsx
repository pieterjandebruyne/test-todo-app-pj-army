import { useState } from "react";

interface Todo {
  id: number;
  title: string;
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleAddTodo = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setTodos([{ id: Date.now(), title: trimmed }, ...todos]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTodo();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <main className="app">
      <h1>Todo App</h1>
      <div className="input-row">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Add a todo"
        />
        <button onClick={handleAddTodo}>Add</button>
      </div>
      <ul>
        {todos.length === 0 ? (
          <li>No todos yet</li>
        ) : (
          todos.map((todo) => <li key={todo.id}>{todo.title}</li>)
        )}
      </ul>
    </main>
  );
}
