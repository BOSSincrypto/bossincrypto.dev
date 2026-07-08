import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import ProjectCard from "./ProjectCard";
import { makeProject } from "../test/fixtures";

describe("ProjectCard", () => {
  describe("terminal-window styling (VAL-PROJ-003)", () => {
    it("renders a title bar with three traffic-light dots", () => {
      render(<ProjectCard project={makeProject()} />);
      const card = screen.getByTestId("project-card");
      const titleBar = within(card).getByTestId("card-title-bar");
      expect(titleBar).toBeInTheDocument();
      const dots = titleBar.querySelectorAll("[data-testid='traffic-dot']");
      expect(dots).toHaveLength(3);
    });

    it("uses the dark terminal background and monospace font", () => {
      render(<ProjectCard project={makeProject()} />);
      const card = screen.getByTestId("project-card");
      expect(card.className).toMatch(/bg-terminal-bg/);
      expect(card.className).toMatch(/font-mono/);
    });
  });

  describe("project name (VAL-PROJ-004)", () => {
    it("displays the displayName as the most prominent text", () => {
      render(<ProjectCard project={makeProject()} />);
      const title = screen.getByTestId("card-title");
      expect(title).toHaveTextContent("Crypto Tracker Dashboard");
      // largest text element — uses a heading
      expect(title.tagName.toLowerCase()).toBe("h3");
    });

    it("falls back to name when displayName is empty", () => {
      render(<ProjectCard project={makeProject({ displayName: "" })} />);
      expect(screen.getByTestId("card-title")).toHaveTextContent(
        "crypto-tracker-dashboard",
      );
    });
  });

  describe("description with graceful empty handling (VAL-PROJ-005)", () => {
    it("displays the description when present", () => {
      render(<ProjectCard project={makeProject()} />);
      expect(screen.getByTestId("card-description")).toHaveTextContent(
        "Real-time crypto portfolio tracker with live prices.",
      );
    });

    it("shows // no description placeholder for null description", () => {
      render(<ProjectCard project={makeProject({ description: "" })} />);
      expect(screen.getByTestId("card-description")).toHaveTextContent(
        /no description/i,
      );
    });

    it("never renders literal 'null' or 'undefined' text", () => {
      render(
        <ProjectCard
          project={makeProject({
            description: "",
            language: null,
            license: null,
            homepage: null,
            topics: [],
          })}
        />,
      );
      const card = screen.getByTestId("project-card");
      expect(card.textContent).not.toMatch(/\bnull\b/);
      expect(card.textContent).not.toMatch(/\bundefined\b/);
    });
  });

  describe("language badge (VAL-PROJ-006)", () => {
    it("renders a language badge when language is present", () => {
      render(<ProjectCard project={makeProject()} />);
      expect(screen.getByTestId("card-language")).toHaveTextContent(
        "TypeScript",
      );
    });

    it("renders no language badge when language is null", () => {
      render(<ProjectCard project={makeProject({ language: null })} />);
      expect(screen.queryByTestId("card-language")).toBeNull();
    });
  });

  describe("star count (VAL-PROJ-007)", () => {
    it("displays the star count with a star icon", () => {
      render(<ProjectCard project={makeProject({ stars: 42 })} />);
      const stars = screen.getByTestId("card-stars");
      expect(stars).toHaveTextContent("42");
      expect(within(stars).getByTestId("star-icon")).toBeInTheDocument();
    });

    it("renders 0 for zero stars (not empty/null)", () => {
      render(<ProjectCard project={makeProject({ stars: 0 })} />);
      expect(screen.getByTestId("card-stars")).toHaveTextContent("0");
    });
  });

  describe("topic tags (VAL-PROJ-008)", () => {
    it("renders topic tags when topics are present", () => {
      render(<ProjectCard project={makeProject()} />);
      const topics = screen.getByTestId("card-topics");
      expect(within(topics).getAllByTestId("topic-tag").length).toBeGreaterThan(
        0,
      );
    });

    it("hides the topic row when topics array is empty", () => {
      render(<ProjectCard project={makeProject({ topics: [] })} />);
      expect(screen.queryByTestId("card-topics")).toBeNull();
    });

    it("does not render empty/null topic chips", () => {
      render(<ProjectCard project={makeProject()} />);
      const tags = screen.getAllByTestId("topic-tag");
      tags.forEach((tag) => {
        expect(tag.textContent).not.toMatch(/^\s*$/);
        expect(tag.textContent).not.toMatch(/\bnull\b/);
      });
    });
  });

  describe("license (VAL-PROJ-009)", () => {
    it("renders the license tag when present", () => {
      render(<ProjectCard project={makeProject({ license: "MIT" })} />);
      expect(screen.getByTestId("card-license")).toHaveTextContent("MIT");
    });

    it("renders no license tag when license is null", () => {
      render(<ProjectCard project={makeProject({ license: null })} />);
      expect(screen.queryByTestId("card-license")).toBeNull();
    });
  });

  describe("homepage link (VAL-PROJ-010)", () => {
    it("renders a homepage affordance when homepage is non-null", () => {
      render(
        <ProjectCard
          project={makeProject({ homepage: "https://demo.example.com" })}
        />,
      );
      const link = screen.getByTestId("card-homepage");
      expect(link).toHaveAttribute("href", "https://demo.example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("renders no homepage affordance when homepage is null", () => {
      render(<ProjectCard project={makeProject({ homepage: null })} />);
      expect(screen.queryByTestId("card-homepage")).toBeNull();
    });

    it("clicking the homepage link does not open the detail (no onClick)", () => {
      const onClick = vi.fn();
      render(
        <ProjectCard
          project={makeProject({ homepage: "https://demo.example.com" })}
          onClick={onClick}
        />,
      );
      fireEvent.click(screen.getByTestId("card-homepage"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("fork indicator (VAL-PROJ-011)", () => {
    it("shows a fork indicator when isFork is true", () => {
      render(<ProjectCard project={makeProject({ isFork: true })} />);
      expect(screen.getByTestId("card-fork")).toBeInTheDocument();
    });

    it("does not show a fork indicator when isFork is false", () => {
      render(<ProjectCard project={makeProject({ isFork: false })} />);
      expect(screen.queryByTestId("card-fork")).toBeNull();
    });
  });

  describe("GitHub link (VAL-PROJ-019)", () => {
    it("renders a GitHub link with target=_blank and rel=noopener", () => {
      render(<ProjectCard project={makeProject()} />);
      const link = screen.getByTestId("card-github");
      expect(link).toHaveAttribute(
        "href",
        "https://github.com/BOSSincrypto/crypto-tracker-dashboard",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("clicking the GitHub link does not open the detail (no onClick)", () => {
      const onClick = vi.fn();
      render(<ProjectCard project={makeProject()} onClick={onClick} />);
      fireEvent.click(screen.getByTestId("card-github"));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("card click opens detail (onClick handler ready)", () => {
    it("calls onClick with the project when the body is clicked", () => {
      const onClick = vi.fn();
      const project = makeProject();
      render(<ProjectCard project={project} onClick={onClick} />);
      fireEvent.click(screen.getByTestId("card-body"));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(project);
    });

    it("is keyboard focusable and Enter opens detail", () => {
      const onClick = vi.fn();
      render(<ProjectCard project={makeProject()} onClick={onClick} />);
      const body = screen.getByTestId("card-body");
      expect(body).toHaveAttribute("tabindex", "0");
      fireEvent.keyDown(body, { key: "Enter" });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("Space key opens detail", () => {
      const onClick = vi.fn();
      render(<ProjectCard project={makeProject()} onClick={onClick} />);
      fireEvent.keyDown(screen.getByTestId("card-body"), { key: " " });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick for unrelated keys", () => {
      const onClick = vi.fn();
      render(<ProjectCard project={makeProject()} onClick={onClick} />);
      fireEvent.keyDown(screen.getByTestId("card-body"), { key: "a" });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("works without an onClick handler (no crash)", () => {
      render(<ProjectCard project={makeProject()} />);
      expect(() =>
        fireEvent.click(screen.getByTestId("card-body")),
      ).not.toThrow();
    });
  });

  describe("reduced-motion (VAL-PROJ-013)", () => {
    it("renders without error when reducedMotion is true", () => {
      render(<ProjectCard project={makeProject()} reducedMotion={true} />);
      expect(screen.getByTestId("project-card")).toBeInTheDocument();
    });
  });
});
