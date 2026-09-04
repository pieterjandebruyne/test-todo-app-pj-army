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

    // Delete the first todo
    const deleteButtons = screen.getAllByRole("button", { name: /Delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText("Second todo")).toBeInTheDocument();
    // First todo should be gone
    expect(screen.queryByText("First todo")).not.toBeInTheDocument();
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
});
