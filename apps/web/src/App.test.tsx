import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

describe("App", () => {
  it("renders the app heading", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { name: "Todo App" }),
    ).toBeInTheDocument();
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
      render(<App />);
      expect(screen.getByTestId("filter-all")).toHaveClass(
        "todo-filters__btn--active",
      );
      expect(screen.queryByRole("listitem")).toBeInTheDocument();
    });
  });

  describe("Active filter", () => {
    it("hides completed todos when Active is selected", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Mark the example todo as completed
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
      render(<App />);

      // Mark the example todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Click Completed filter
      await user.click(screen.getByTestId("filter-completed"));

      // The todo should be visible
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("shows the Completed button as active", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Mark the example todo as completed
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
      render(<App />);

      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      expect(screen.getByTestId("clear-completed")).toBeInTheDocument();
    });

    it("removes all completed todos when clicked", async () => {
      const user = userEvent.setup();
      render(<App />);

      // Mark the example todo as completed
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
      render(<App />);

      // Mark the example todo as completed
      const checkbox = screen.getByRole("checkbox");
      await user.click(checkbox);

      // Clear completed
      await user.click(screen.getByTestId("clear-completed"));

      // Count should show 0 items
      expect(screen.getByText(/0 items left/)).toBeInTheDocument();
    });
  });
});
