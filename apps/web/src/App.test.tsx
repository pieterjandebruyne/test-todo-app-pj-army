import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import type { Todo } from "./types";

function seedTodos(todos: Todo[]): void {
  localStorage.setItem("pj-army-todos:v1", JSON.stringify(todos));
}

function clearTodos(): void {
  localStorage.removeItem("pj-army-todos:v1");
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

describe("App", () => {
  afterEach(() => {
    clearTodos();
    cleanup();
  });

  it("renders the app heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Todo App" }),
    ).toBeInTheDocument();
  });

  it("adds a new todo when the form is submitted", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "Learn React{enter}");

    expect(screen.getByText("Learn React")).toBeInTheDocument();
  });

  it("toggles a todo's completed state", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "Test todo{enter}");

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Verify strikethrough class is applied
    const title = screen.getByText("Test todo");
    expect(title).toHaveClass("todo-item--completed");
  });

  it("deletes a todo by id", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "First todo{enter}");
    await userEvent.type(input, "Second todo{enter}");

    // Delete the first todo in the list (most recently added)
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    await userEvent.click(deleteButtons[0]);

    // "First todo" should remain (it was added first, appears last)
    expect(screen.getByText("First todo")).toBeInTheDocument();
    // "Second todo" should be gone (it was the newest, appeared first)
    expect(screen.queryByText("Second todo")).not.toBeInTheDocument();
  });

  it("shows the correct active count", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "A{enter}");
    await userEvent.type(input, "B{enter}");
    await userEvent.type(input, "C{enter}");

    expect(screen.getByText("3 items left")).toBeInTheDocument();

    // Complete one
    const checkboxes = screen.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);

    expect(screen.getByText("2 items left")).toBeInTheDocument();
  });

  describe("filter buttons", () => {
    it("renders All, Active, and Completed filter buttons", () => {
      render(<App />);
      expect(screen.getByTestId("filter-all")).toHaveTextContent("All");
      expect(screen.getByTestId("filter-active")).toHaveTextContent("Active");
      expect(screen.getByTestId("filter-completed")).toHaveTextContent(
        "Completed",
      );
    });

    it("shows All as active by default", () => {
      render(<App />);
      expect(screen.getByTestId("filter-all")).toHaveClass(
        "todo-filters__btn--active",
      );
      expect(screen.getByTestId("filter-active")).not.toHaveClass(
        "todo-filters__btn--active",
      );
      expect(screen.getByTestId("filter-completed")).not.toHaveClass(
        "todo-filters__btn--active",
      );
    });

    it("shows all todos when All filter is active", () => {
      seedTodos([
        { id: generateId(), title: "A task", completed: false },
      ]);
      render(<App />);
      expect(screen.getByTestId("filter-all")).toHaveClass(
        "todo-filters__btn--active",
      );
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });
  });

  describe("Active filter", () => {
    it("hides completed todos when Active is selected", async () => {
      const user = userEvent.setup();
      seedTodos([
        { id: generateId(), title: "Done", completed: false },
      ]);
      render(<App />);

      // Mark the todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Click Active filter
      await user.click(screen.getByTestId("filter-active"));

      // The todo should be hidden
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });

  describe("Completed filter", () => {
    it("shows only completed todos when Completed is selected", async () => {
      const user = userEvent.setup();
      seedTodos([
        { id: generateId(), title: "Done", completed: false },
      ]);
      render(<App />);

      // Mark the todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Click Completed filter
      await user.click(screen.getByTestId("filter-completed"));

      // The todo should be visible
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("shows the Completed button as active", async () => {
      const user = userEvent.setup();
      seedTodos([
        { id: generateId(), title: "Done", completed: false },
      ]);
      render(<App />);

      // Mark the todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Click Completed filter
      await user.click(screen.getByTestId("filter-completed"));

      expect(screen.getByTestId("filter-completed")).toHaveClass(
        "todo-filters__btn--active",
      );
      expect(screen.getByTestId("filter-all")).not.toHaveClass(
        "todo-filters__btn--active",
      );
    });
  });

  describe("Clear completed button", () => {
    it("is hidden when there are no completed todos", () => {
      render(<App />);
      expect(screen.queryByTestId("clear-completed")).not.toBeInTheDocument();
    });

    it("appears when at least one todo is completed", async () => {
      const user = userEvent.setup();
      seedTodos([
        { id: generateId(), title: "Done", completed: false },
      ]);
      render(<App />);

      // Mark the todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(screen.getByTestId("clear-completed")).toBeInTheDocument();
    });

    it("removes all completed todos when clicked", async () => {
      const user = userEvent.setup();
      seedTodos([
        { id: generateId(), title: "Done", completed: false },
      ]);
      render(<App />);

      // Mark the todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Clear completed
      await user.click(screen.getByTestId("clear-completed"));

      // The todo should be gone
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
      // Clear completed button should be hidden again
      expect(screen.queryByTestId("clear-completed")).not.toBeInTheDocument();
    });

    it("updates the item count after clearing completed", async () => {
      const user = userEvent.setup();
      seedTodos([
        { id: generateId(), title: "Done", completed: false },
      ]);
      render(<App />);

      // Mark the todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Clear completed
      await user.click(screen.getByTestId("clear-completed"));

      // Count should show 0 items
      expect(screen.getByText(/0 items left/)).toBeInTheDocument();
    });
  });

  describe("localStorage persistence", () => {
    it("round-trip: todos survive a simulated reload", async () => {
      const todo: Todo = {
        id: generateId(),
        title: "Persist me",
        completed: false,
      };
      seedTodos([todo]);

      const { unmount } = render(<App />);

      // Verify todo is rendered
      expect(screen.getByText("Persist me")).toBeInTheDocument();

      // Simulate reload: unmount and re-render
      unmount();
      render(<App />);

      // After reload, todos should still be there (from localStorage)
      expect(screen.getByText("Persist me")).toBeInTheDocument();
    });
  });

  describe("new todo ordering", () => {
    it("adds new todos to the top of the list", async () => {
      render(<App />);

      const input = screen.getByPlaceholderText("What needs to be done?");
      await userEvent.type(input, "first{enter}");
      await userEvent.type(input, "second{enter}");

      const items = screen.getAllByRole("listitem");
      // Most recently added todo should be first
      expect(items[0]).toHaveTextContent("second");
      expect(items[1]).toHaveTextContent("first");
    });
  });

  describe("corrupt stored data", () => {
    it("starts with an empty list when stored JSON is invalid", () => {
      localStorage.setItem("pj-army-todos:v1", "not json at all");
      render(<App />);
      expect(screen.getByRole("heading", { name: "Todo App" })).toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("starts with an empty list when stored value is not an array", () => {
      localStorage.setItem("pj-army-todos:v1", '{"id":"1"}');
      render(<App />);
      expect(screen.getByRole("heading", { name: "Todo App" })).toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });

  describe("storage throwing", () => {
    let getItemSpy: ReturnType<typeof vi.spyOn>;
    let setItemSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      clearTodos();
    });

    afterEach(() => {
      getItemSpy?.mockRestore();
      setItemSpy?.mockRestore();
    });

    it("does not crash when localStorage.getItem throws", () => {
      getItemSpy = vi
        .spyOn(localStorage, "getItem")
        .mockImplementation(() => {
          throw new Error("localStorage unavailable");
        });

      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByRole("heading", { name: "Todo App" })).toBeInTheDocument();
    });

    it("does not crash when localStorage.setItem throws", () => {
      setItemSpy = vi
        .spyOn(localStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("localStorage unavailable");
        });

      expect(() => render(<App />)).not.toThrow();
      expect(screen.getByRole("heading", { name: "Todo App" })).toBeInTheDocument();
    });
  });
});
