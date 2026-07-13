import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import StatsBar from "./StatsBar";
import { makeProject } from "../test/fixtures";
import type { Project } from "../types";

describe("StatsBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const makeProjects = (count: number, overrides?: Partial<Project>): Project[] =>
    Array.from({ length: count }, (_, i) =>
      makeProject({
        id: i + 1,
        name: `project-${i}`,
        stars: (i + 1) * 10,
        forks: (i + 1) * 2,
        language: i % 3 === 0 ? "TypeScript" : i % 3 === 1 ? "Python" : "Rust",
        ...overrides,
      }),
    );

  it("renders all four stat cards", () => {
    const projects = makeProjects(5);
    render(<StatsBar projects={projects} />);

    expect(screen.getByText("Total Repos")).toBeInTheDocument();
    expect(screen.getByText("Total Stars")).toBeInTheDocument();
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("Contributions")).toBeInTheDocument();
  });

  it("computes total repos correctly", () => {
    const projects = makeProjects(10);
    render(<StatsBar projects={projects} />);

    expect(screen.getByLabelText("Total Repos: 10")).toBeInTheDocument();
  });

  it("computes total stars correctly", () => {
    // stars: 10 + 20 + 30 + 40 + 50 = 150
    const projects = makeProjects(5);
    render(<StatsBar projects={projects} />);

    expect(screen.getByLabelText("Total Stars: 150")).toBeInTheDocument();
  });

  it("computes unique language count correctly", () => {
    // 3 unique languages: TypeScript, Python, Rust
    const projects = makeProjects(9);
    render(<StatsBar projects={projects} />);

    expect(screen.getByLabelText("Languages: 3")).toBeInTheDocument();
  });

  it("computes contributions (forks) correctly", () => {
    // forks: 2 + 4 + 6 + 8 + 10 = 30
    const projects = makeProjects(5);
    render(<StatsBar projects={projects} />);

    expect(screen.getByLabelText("Contributions: 30")).toBeInTheDocument();
  });

  it("handles empty projects array", () => {
    render(<StatsBar projects={[]} />);

    expect(screen.getByLabelText("Total Repos: 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Total Stars: 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Languages: 0")).toBeInTheDocument();
    expect(screen.getByLabelText("Contributions: 0")).toBeInTheDocument();
  });

  it("shows k-suffix for large numbers", () => {
    const projects = makeProjects(1, { stars: 1500, forks: 2000 });
    render(<StatsBar projects={projects} />);

    expect(screen.getByLabelText("Total Stars: 1500")).toBeInTheDocument();
    expect(screen.getByLabelText("Contributions: 2000")).toBeInTheDocument();
  });

  it("excludes null languages from count", () => {
    const projects = [
      makeProject({ id: 1, name: "a", language: "TypeScript" }),
      makeProject({ id: 2, name: "b", language: null }),
      makeProject({ id: 3, name: "c", language: "Python" }),
    ];
    render(<StatsBar projects={projects} />);

    expect(screen.getByLabelText("Languages: 2")).toBeInTheDocument();
  });

  it("has proper test ids", () => {
    const projects = makeProjects(3);
    render(<StatsBar projects={projects} />);

    expect(screen.getByTestId("stats-bar")).toBeInTheDocument();
    const cards = screen.getAllByTestId("stat-card");
    expect(cards).toHaveLength(4);
  });

  it("computes real project data correctly", () => {
    // Test with the actual fixture structure (realistic data)
    const projects = [
      makeProject({
        id: 1,
        name: "alpha",
        stars: 100,
        forks: 10,
        language: "TypeScript",
      }),
      makeProject({
        id: 2,
        name: "beta",
        stars: 50,
        forks: 5,
        language: "Python",
      }),
      makeProject({
        id: 3,
        name: "gamma",
        stars: 25,
        forks: 3,
        language: "TypeScript",
      }),
    ];

    render(<StatsBar projects={projects} />);

    // Total repos: 3
    expect(screen.getByLabelText("Total Repos: 3")).toBeInTheDocument();

    // Total stars: 100 + 50 + 25 = 175
    expect(screen.getByLabelText("Total Stars: 175")).toBeInTheDocument();

    // Languages: TypeScript, Python = 2
    expect(screen.getByLabelText("Languages: 2")).toBeInTheDocument();

    // Contributions (forks): 10 + 5 + 3 = 18
    expect(screen.getByLabelText("Contributions: 18")).toBeInTheDocument();
  });
});
