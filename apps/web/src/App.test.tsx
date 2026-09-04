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

  it("adds a todo when clicking Add with a valid title", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("Add a todo");
    await userEvent.type(input, "Buy groceries");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("does not add a todo when input is empty or whitespace-only", async () => {
    render(<App />);

    const input = screen.getByPlaceholderText("Add a todo");
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("No todos yet")).toBeInTheDocument();
  });
});
