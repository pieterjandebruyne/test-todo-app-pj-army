import type { Todo } from "../types";
import TodoItem from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete }: TodoListProps) {
  const activeCount = todos.filter((t) => !t.completed).length;

  return (
    <section className="todo-list">
      {todos.length > 0 && (
        <ul className="todo-list__items">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
      <p className="todo-list__count">{activeCount} item{activeCount !== 1 ? "s" : ""} left</p>
    </section>
  );
}
