import { type Todo } from "../types";

export type Filter = "all" | "active" | "completed";

interface TodoListProps {
  todos: Todo[];
  filter: Filter;
  onFilterChange: (filter: Filter) => void;
  onClearCompleted: () => void;
  onToggleTodo?: (id: string) => void;
}

export default function TodoList({
  todos,
  filter,
  onFilterChange,
  onClearCompleted,
  onToggleTodo,
}: TodoListProps) {
  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="todo-list">
      <ul className="todo-list__items">
        {filteredTodos.map((todo) => (
          <li key={todo.id} className="todo-list__item">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => onToggleTodo?.(todo.id)}
              data-testid={`checkbox-${todo.id}`}
            />
            <span className="todo-list__title">{todo.title}</span>
          </li>
        ))}
      </ul>
      <p className="todo-list__count">
        {filteredTodos.length} {filteredTodos.length === 1 ? "item" : "items"}{" "}
        left
      </p>
      <div className="todo-filters">
        <button
          className={`todo-filters__btn${filter === "all" ? " todo-filters__btn--active" : ""}`}
          onClick={() => onFilterChange("all")}
          data-testid="filter-all"
        >
          All
        </button>
        <button
          className={`todo-filters__btn${filter === "active" ? " todo-filters__btn--active" : ""}`}
          onClick={() => onFilterChange("active")}
          data-testid="filter-active"
        >
          Active
        </button>
        <button
          className={`todo-filters__btn${filter === "completed" ? " todo-filters__btn--active" : ""}`}
          onClick={() => onFilterChange("completed")}
          data-testid="filter-completed"
        >
          Completed
        </button>
      </div>
      {completedCount > 0 && (
        <button
          className="clear-completed"
          onClick={onClearCompleted}
          data-testid="clear-completed"
        >
          Clear completed
        </button>
      )}
    </div>
  );
}
