import { useState, useEffect, useCallback } from "react";
import type { Todo } from "../types";

const STORAGE_KEY = "pj-army-todos:v1";

function readTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeTodos(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Silently ignore — private window, blocked, quota exceeded, etc.
  }
}

export function useTodos(): [
  Todo[],
  (updater: Todo[] | ((prev: Todo[]) => Todo[])) => void,
] {
  const [todos, setTodos] = useState<Todo[]>(readTodos);

  useEffect(() => {
    writeTodos(todos);
  }, [todos]);

  // Stable identity to avoid unnecessary re-renders.
  const setTodosWrapper = useCallback(
    (updater: Todo[] | ((prev: Todo[]) => Todo[])) => {
      setTodos(updater);
    },
    [],
  );

  return [todos, setTodosWrapper];
}
