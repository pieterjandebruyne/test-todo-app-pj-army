import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TodoItem from "./components/TodoItem";
import type { Todo } from "../types";

describe("TodoItem", () => {
  const baseTodo: Todo = { id: "1", title: "Buy milk", completed: false };

  it("renders the todo title and checkbox", () => {
    render(<TodoItem todo={baseTodo} onToggle={() => {}} onDelete={() => {}} />);

    expect(screen.getByRole("checkbox")).toBeInTheDocument();
    expect(screen.getByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete "Buy milk"/i })).toBeInTheDocument();
  });

  it("applies strikethrough when completed", () => {
    const completedTodo = { ...baseTodo, completed: true };
    render(<TodoItem todo={completedTodo} onToggle={() => {}} onDelete={() => {}} />);

    const title = screen.getByText("Buy milk");
    expect(title).toHaveClass("todo-item--completed");
  });

  it("toggles completed state when checkbox is clicked", async () => {
    let toggledId: string | null = null;
    const onToggle = (id: string) => { toggledId = id; };
    const onDelete = () => {};

    render(<TodoItem todo={baseTodo} onToggle={onToggle} onDelete={onDelete} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(toggledId).toBe(baseTodo.id);
  });

  it("calls onDelete with the correct id when Delete is clicked", async () => {
    let deletedId: string | null = null;
    const onToggle = () => {};
    const onDelete = (id: string) => { deletedId = id; };

    render(<TodoItem todo={baseTodo} onToggle={onToggle} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole("button", { name: /Delete "Buy milk"/i }));
    expect(deletedId).toBe(baseTodo.id);
  });
});
