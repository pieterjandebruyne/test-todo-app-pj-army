import { render, screen } from "@testing-library/react";
import TodoList from "./components/TodoList";
import type { Todo } from "../types";

describe("TodoList", () => {
  const baseTodos: Todo[] = [
    { id: "1", title: "Buy milk", completed: false },
    { id: "2", title: "Walk dog", completed: true },
  ];

  it("renders all todos", () => {
    render(<TodoList todos={baseTodos} onToggle={() => {}} onDelete={() => {}} />);

    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByText("Walk dog")).toBeInTheDocument();
  });

  it("shows the correct active count", () => {
    render(<TodoList todos={baseTodos} onToggle={() => {}} onDelete={() => {}} />);

    expect(screen.getByText("1 item left")).toBeInTheDocument();
  });

  it("shows plural when multiple active", () => {
    const allActive: Todo[] = [
      { id: "1", title: "A", completed: false },
      { id: "2", title: "B", completed: false },
    ];
    render(<TodoList todos={allActive} onToggle={() => {}} onDelete={() => {}} />);

    expect(screen.getByText("2 items left")).toBeInTheDocument();
  });

  it("shows 0 items left when all completed", () => {
    const allCompleted: Todo[] = [
      { id: "1", title: "A", completed: true },
      { id: "2", title: "B", completed: true },
    ];
    render(<TodoList todos={allCompleted} onToggle={() => {}} onDelete={() => {}} />);

    expect(screen.getByText("0 items left")).toBeInTheDocument();
  });

  it("hides the list when there are no todos", () => {
    render(<TodoList todos={[]} onToggle={() => {}} onDelete={() => {}} />);

    // The count should still show but the ul should not be in the document
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.getByText("0 items left")).toBeInTheDocument();
  });
});
