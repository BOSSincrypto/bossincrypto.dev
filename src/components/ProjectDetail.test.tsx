import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectDetail from "../components/ProjectDetail";
import { makeProject } from "../test/fixtures";

// Mock framer-motion to avoid animation timing issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      // Call onAnimationComplete if provided
      const { onAnimationComplete, ...rest } = props as Record<
        string,
        unknown
      > & { onAnimationComplete?: () => void };
      return (
        <div
          {...rest}
          ref={() => {
            // Fire animation complete immediately in tests
            if (onAnimationComplete) onAnimationComplete();
          }}
        >
          {children as React.ReactNode}
        </div>
      );
    },
    button: ({ children, ...props }: Record<string, unknown>) => (
      <button {...props}>{children as React.ReactNode}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("ProjectDetail", () => {
  const baseProject = makeProject();

  it("renders nothing when project is null", () => {
    const { container } = render(
      <ProjectDetail project={null} onClose={() => {}} reducedMotion={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal when project is provided", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-backdrop")).toBeInTheDocument();
    expect(screen.getByTestId("modal-panel")).toBeInTheDocument();
  });

  it("displays project name prominently", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-title")).toHaveTextContent(
      baseProject.displayName || baseProject.name,
    );
  });

  it("displays full description", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-description")).toHaveTextContent(
      baseProject.description,
    );
  });

  it("shows placeholder for empty description (no null/undefined)", () => {
    const noDesc = makeProject({ description: "" });
    render(
      <ProjectDetail
        project={noDesc}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    const desc = screen.getByTestId("modal-description");
    expect(desc).not.toHaveTextContent("null");
    expect(desc).not.toHaveTextContent("undefined");
    // Should have some placeholder text
    expect(desc.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("displays ALL topics (not truncated)", () => {
    const manyTopics = makeProject({
      topics: ["crypto", "web3", "blockchain", "defi", "react", "typescript"],
    });
    render(
      <ProjectDetail
        project={manyTopics}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    const topicTags = screen.getAllByTestId("modal-topic-tag");
    expect(topicTags).toHaveLength(6);
    expect(topicTags[0]).toHaveTextContent("#crypto");
    expect(topicTags[5]).toHaveTextContent("#typescript");
  });

  it("displays all languages array", () => {
    const multiLang = makeProject({
      language: "TypeScript",
      languages: ["TypeScript", "JavaScript", "CSS"],
    });
    render(
      <ProjectDetail
        project={multiLang}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    // TypeScript appears twice (primary + languages), so use getAllByText
    const tsItems = screen.getAllByText(/TypeScript/);
    expect(tsItems.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/JavaScript/)).toBeInTheDocument();
    expect(screen.getByText(/CSS/)).toBeInTheDocument();
  });

  it("displays license when present", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-license")).toHaveTextContent("MIT");
  });

  it("hides license section when null", () => {
    const noLicense = makeProject({ license: null });
    render(
      <ProjectDetail
        project={noLicense}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.queryByTestId("modal-license")).toBeNull();
  });

  it("displays star and fork counts", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-stars")).toHaveTextContent("42");
    expect(screen.getByTestId("modal-forks")).toHaveTextContent("3");
  });

  it("displays homepage link when present", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    const link = screen.getByTestId("modal-homepage");
    expect(link).toHaveAttribute("href", baseProject.homepage);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("hides homepage link when null", () => {
    const noHomepage = makeProject({ homepage: null });
    render(
      <ProjectDetail
        project={noHomepage}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.queryByTestId("modal-homepage")).toBeNull();
  });

  it("displays GitHub link with target=_blank and rel=noopener", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    const link = screen.getByTestId("modal-github");
    expect(link).toHaveAttribute("href", baseProject.htmlUrl);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("displays relative time of updatedAt", () => {
    const now = new Date();
    const threeDaysAgo = new Date(
      now.getTime() - 3 * 86400 * 1000,
    ).toISOString();
    const recentProject = makeProject({ updatedAt: threeDaysAgo });
    render(
      <ProjectDetail
        project={recentProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-updated")).toHaveTextContent(
      /updated\s+\d+\s+(day|hour|min)s?\s+ago/i,
    );
  });

  it("displays README link affordance", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-readme")).toBeInTheDocument();
    expect(screen.getByTestId("modal-readme")).toHaveAttribute("href");
    // Link should point to a readme-related path (case-insensitive)
    expect(
      screen.getByTestId("modal-readme").getAttribute("href")?.toLowerCase(),
    ).toContain("readme");
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <ProjectDetail
        project={baseProject}
        onClose={onClose}
        reducedMotion={false}
      />,
    );
    await userEvent.click(screen.getByTestId("modal-close-btn"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when backdrop is clicked", async () => {
    const onClose = vi.fn();
    render(
      <ProjectDetail
        project={baseProject}
        onClose={onClose}
        reducedMotion={false}
      />,
    );
    await userEvent.click(screen.getByTestId("modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <ProjectDetail
        project={baseProject}
        onClose={onClose}
        reducedMotion={false}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when other keys are pressed", () => {
    const onClose = vi.fn();
    render(
      <ProjectDetail
        project={baseProject}
        onClose={onClose}
        reducedMotion={false}
      />,
    );
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not close when clicking inside modal panel", async () => {
    const onClose = vi.fn();
    render(
      <ProjectDetail
        project={baseProject}
        onClose={onClose}
        reducedMotion={false}
      />,
    );
    await userEvent.click(screen.getByTestId("modal-panel"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows no null or undefined text anywhere", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    const modal = screen.getByTestId("modal-panel");
    expect(modal.textContent).not.toContain("null");
    expect(modal.textContent).not.toContain("undefined");
  });

  it("handles project with zero stars (shows 0, not empty)", () => {
    const zeroStars = makeProject({ stars: 0 });
    render(
      <ProjectDetail
        project={zeroStars}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-stars")).toHaveTextContent("0");
  });

  it("displays fork indicator for forked repos", () => {
    const forked = makeProject({ isFork: true });
    render(
      <ProjectDetail
        project={forked}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.getByTestId("modal-fork-indicator")).toBeInTheDocument();
  });

  it("hides fork indicator for original repos", () => {
    render(
      <ProjectDetail
        project={baseProject}
        onClose={() => {}}
        reducedMotion={false}
      />,
    );
    expect(screen.queryByTestId("modal-fork-indicator")).toBeNull();
  });
});
