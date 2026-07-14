import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PrivateProjects from "./PrivateProjects";

describe("PrivateProjects", () => {
  it("renders the section heading", () => {
    render(<PrivateProjects />);
    const heading = screen.getByTestId("private-heading");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("private-projects/");
    expect(heading).toHaveTextContent("(1)");
  });

  it("renders a private project card for Vuzora", () => {
    render(<PrivateProjects />);
    const cards = screen.getAllByTestId("private-project-card");
    expect(cards).toHaveLength(1);

    const card = cards[0];

    // Title with emoji
    const title = within(card).getByTestId("private-card-title");
    expect(title).toHaveTextContent("🎓");
    expect(title).toHaveTextContent("Vuzora");

    // Description
    const desc = within(card).getByTestId("private-card-description");
    expect(desc).toHaveTextContent(/расписание/i);

    // Status badge
    const status = within(card).getByTestId("private-card-status");
    expect(status).toHaveTextContent("live");

    // URL link
    const url = within(card).getByTestId("private-card-url");
    expect(url).toHaveAttribute("href", "https://vuzora.ru");
    expect(url).toHaveAttribute("target", "_blank");
  });

  it("renders tech stack tags", () => {
    render(<PrivateProjects />);
    const techTags = screen.getAllByTestId("private-tech-tag");
    expect(techTags.length).toBe(4);

    const tagTexts = techTags.map((t) => t.textContent);
    expect(tagTexts).toContain("#Telegram Bot");
    expect(tagTexts).toContain("#Python");
    expect(tagTexts).toContain("#FastAPI");
    expect(tagTexts).toContain("#PostgreSQL");
  });

  it("uses terminal window styling with traffic-light dots", () => {
    render(<PrivateProjects />);
    const card = screen.getByTestId("private-project-card");

    // Should use the dark terminal background
    expect(card.className).toMatch(/bg-terminal-bg/);
    expect(card.className).toMatch(/font-mono/);

    // Should have 3 traffic dots in the title bar
    const dotElements = Array.from(
      card.querySelectorAll("span[aria-hidden='true']"),
    ).filter((el) => (el as HTMLElement).style.backgroundColor);
    expect(dotElements.length).toBe(3);
  });

  it("renders green live status badge with glow", () => {
    render(<PrivateProjects />);
    const status = screen.getByTestId("private-card-status");
    expect(status.className).toMatch(/text-terminal-green/);
    expect(status.className).toMatch(/shadow-\[0_0_8px_-2px_rgba\(0,255,65,0\.5\)\]/);
  });

  it("renders without error with reducedMotion", () => {
    render(<PrivateProjects reducedMotion />);
    expect(screen.getByTestId("private-projects")).toBeInTheDocument();
  });
});
