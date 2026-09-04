import type { Todo } from "../types";
import TodoItem from "./TodoItem";

export type Filter = "all" | "active" | "completed";

interface TodoListProps {
  todos: Todo[];
  filter?: Filter;
  onFilterChange?: (filter: Filter) => void;
  onClearCompleted?: () => void;
  onToggleTodo?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TodoList({
  todos,
  filter,
  onFilterChange,
  onClearCompleted,
  onToggleTodo,
  onDelete,
}: TodoListProps) {
  const f = filter ?? "all";
  const onFilter = onFilterChange ?? (() => {});
  const filteredTodos = todos.filter((todo) => {
    if (f === "active") return !todo.completed;
    if (f === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="todo-list">
      {filteredTodos.length > 0 && (
        <ul className="todo-list__items">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggleTodo}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
      <p className="todo-list__count">
        {activeCount} {activeCount === 1 ? "item" : "items"}{" "}
        left
      </p>
      {onFilterChange && (
        <div className="todo-filters">
          <button
            className={`todo-filters__btn${f === "all" ? " todo-filters__btn--active" : ""}`}
            onClick={() => onFilter("all")}
            data-testid="filter-all"
          >
            All
          </button>
          <button
            className={`todo-filters__btn${f === "active" ? " todo-filters__btn--active" : ""}`}
            onClick={() => onFilter("active")}
            data-testid="filter-active"
          >
            Active
          </button>
          <button
            className={`todo-filters__btn${f === "completed" ? " todo-filters__btn--active" : ""}`}
            onClick={() => onFilter("completed")}
            data-testid="filter-completed"
          >
            Completed
          </button>
        </div>
      )}
      {onClearCompleted && completedCount > 0 && (
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
