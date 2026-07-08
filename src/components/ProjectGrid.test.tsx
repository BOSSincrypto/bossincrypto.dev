import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import ProjectGrid from "./ProjectGrid";
import type { CategoryGroup } from "../hooks/useProjects";
import { makeProject } from "../test/fixtures";

function makeGroups(): CategoryGroup[] {
  return [
    {
      category: "crypto-web3",
      projects: [
        makeProject({ id: 1, name: "alpha", displayName: "Alpha" }),
        makeProject({ id: 2, name: "beta", displayName: "Beta" }),
      ],
    },
    {
      category: "ai-ml",
      projects: [
        makeProject({
          id: 3,
          name: "gamma",
          displayName: "Gamma",
          category: "ai-ml",
        }),
      ],
    },
  ];
}

describe("ProjectGrid", () => {
  describe("rendering (VAL-PROJ-001)", () => {
    it("renders one card per project across all groups", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      expect(screen.getAllByTestId("project-card")).toHaveLength(3);
    });

    it("renders each project name exactly once", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      const titles = screen.getAllByTestId("card-title");
      const names = titles.map((t) => t.textContent);
      expect(new Set(names).size).toBe(names.length);
    });

    it("renders nothing when there are no groups", () => {
      render(<ProjectGrid groups={[]} />);
      expect(screen.queryAllByTestId("project-card")).toHaveLength(0);
    });
  });

  describe("category grouping (VAL-PROJ-022)", () => {
    it("renders a terminal-style section heading per category", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      const headings = screen.getAllByTestId("category-heading");
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent("crypto-web3");
      expect(headings[1]).toHaveTextContent("ai-ml");
    });

    it("headings use the ## terminal prefix", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      const headings = screen.getAllByTestId("category-heading");
      headings.forEach((h) => {
        expect(h.textContent).toMatch(/##/);
      });
    });

    it("places each card under the correct category section", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      const sections = screen.getAllByTestId("category-section");
      expect(sections).toHaveLength(2);
      expect(
        within(sections[0]).getAllByTestId("project-card"),
      ).toHaveLength(2);
      expect(
        within(sections[1]).getAllByTestId("project-card"),
      ).toHaveLength(1);
    });

    it("orders sections by category priority", () => {
      // Pass groups out of order; grid should normalize to CATEGORY_ORDER
      const outOfOrder: CategoryGroup[] = [
        {
          category: "ai-ml",
          projects: [makeProject({ id: 3, category: "ai-ml" })],
        },
        {
          category: "crypto-web3",
          projects: [makeProject({ id: 1 })],
        },
      ];
      render(<ProjectGrid groups={outOfOrder} />);
      const headings = screen.getAllByTestId("category-heading");
      expect(headings[0]).toHaveTextContent("crypto-web3");
      expect(headings[1]).toHaveTextContent("ai-ml");
    });
  });

  describe("responsive layout (VAL-PROJ-002)", () => {
    it("uses a responsive CSS grid that starts at 1 column", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      const grid = screen.getAllByTestId("card-grid")[0];
      expect(grid.className).toMatch(/grid/);
      expect(grid.className).toMatch(/grid-cols-1/);
    });

    it("increases columns at tablet and desktop breakpoints", () => {
      render(<ProjectGrid groups={makeGroups()} />);
      const grid = screen.getAllByTestId("card-grid")[0];
      // >=2 cols at sm, >=3 at lg/xl
      expect(grid.className).toMatch(/sm:grid-cols-2/);
      expect(grid.className).toMatch(/(lg|xl):grid-cols-[3-9]/);
    });
  });

  describe("loading state (VAL-PROJ-021)", () => {
    it("shows a terminal-themed loading state while data loads", () => {
      render(<ProjectGrid groups={[]} loading={true} />);
      expect(screen.getByTestId("project-grid-loading")).toBeInTheDocument();
    });

    it("does not render cards while loading", () => {
      render(<ProjectGrid groups={makeGroups()} loading={true} />);
      expect(screen.queryAllByTestId("project-card")).toHaveLength(0);
    });

    it("renders cards once loading is false", () => {
      const { rerender } = render(
        <ProjectGrid groups={makeGroups()} loading={true} />,
      );
      expect(screen.queryAllByTestId("project-card")).toHaveLength(0);
      rerender(<ProjectGrid groups={makeGroups()} loading={false} />);
      expect(screen.getAllByTestId("project-card")).toHaveLength(3);
    });
  });

  describe("stagger animation (VAL-PROJ-012)", () => {
    it("renders all cards even with stagger (reduced motion off)", () => {
      render(<ProjectGrid groups={makeGroups()} reducedMotion={false} />);
      expect(screen.getAllByTestId("project-card")).toHaveLength(3);
    });

    it("renders all cards instantly with reduced motion", () => {
      render(<ProjectGrid groups={makeGroups()} reducedMotion={true} />);
      expect(screen.getAllByTestId("project-card")).toHaveLength(3);
    });
  });

  describe("card click wiring", () => {
    it("forwards onCardClick when a card body is clicked", () => {
      const onCardClick = vi.fn();
      render(<ProjectGrid groups={makeGroups()} onCardClick={onCardClick} />);
      fireEvent.click(screen.getAllByTestId("card-body")[0]);
      expect(onCardClick).toHaveBeenCalledTimes(1);
    });
  });
});
