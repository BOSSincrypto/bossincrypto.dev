import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the terminal-themed root layout", () => {
    render(<App />);
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main).toHaveClass("bg-terminal-bg");
    expect(main).toHaveClass("font-mono");
  });

  it("shows the site title", () => {
    render(<App />);
    expect(screen.getByText(/BOSSincrypto\.dev/i)).toBeInTheDocument();
  });

  it("renders the TerminalHeader identity block", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: /ILYA/i }),
    ).toBeInTheDocument();
  });
});
