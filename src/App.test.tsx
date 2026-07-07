import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the project hub title", () => {
    render(<App />);
    expect(
      screen.getByText(/BOSSincrypto\.dev/i),
    ).toBeInTheDocument();
  });

  it("uses terminal prompt styling", () => {
    render(<App />);
    const prompt = screen.getByText("$");
    expect(prompt).toBeInTheDocument();
    expect(prompt).toHaveClass("text-terminal-amber");
  });

  it("applies the terminal background", () => {
    render(<App />);
    const main = document.querySelector("main");
    expect(main).not.toBeNull();
    expect(main).toHaveClass("bg-terminal-bg");
    expect(main).toHaveClass("font-mono");
  });
});
