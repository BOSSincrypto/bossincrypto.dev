import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import TerminalHeader from "./TerminalHeader";

describe("TerminalHeader", () => {
  describe("identity block (VAL-HEADER-001)", () => {
    it("renders the avatar image with a valid src", () => {
      render(<TerminalHeader />);
      const avatar = screen.getByAltText(/ILYA/i) as HTMLImageElement;
      expect(avatar).toBeInTheDocument();
      expect(avatar.getAttribute("src")).not.toBe("");
    });

    it("renders the name 'ILYA' prominently as the page heading", () => {
      render(<TerminalHeader />);
      const name = screen.getByRole("heading", { level: 1, name: /ILYA/i });
      expect(name).toBeInTheDocument();
    });

    it("renders the title 'BOSSincrypto'", () => {
      render(<TerminalHeader />);
      expect(
        screen.getByRole("heading", { level: 2, name: /BOSSincrypto/i }),
      ).toBeInTheDocument();
    });

    it("renders the subtitle exactly", () => {
      render(<TerminalHeader />);
      expect(
        screen.getByText("Crypto Investor • Influencer • Builder"),
      ).toBeInTheDocument();
    });
  });

  describe("main site link", () => {
    it("renders a link to bossincrypto.com with correct href, target and rel", () => {
      render(<TerminalHeader />);
      const link = screen.getByTestId("main-site-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "https://bossincrypto.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("styles the main site link as a terminal command with $ prefix and monospace", () => {
      render(<TerminalHeader />);
      const link = screen.getByTestId("main-site-link");
      expect(link.className).toMatch(/font-mono/);
      expect(link.className).toMatch(/text-terminal-cyan/);
      expect(link.textContent ?? "").toMatch(/^\$\s/);
    });
  });

  describe("social links (VAL-HEADER-002, VAL-HEADER-003)", () => {
    it("renders exactly five social links", () => {
      render(<TerminalHeader />);
      const social = screen.getByTestId("social-links");
      const links = within(social).getAllByRole("link");
      expect(links).toHaveLength(5);
    });

    it("renders the X/Twitter link with correct href, target and rel", () => {
      render(<TerminalHeader />);
      const link = screen.getByRole("link", { name: /twitter/i });
      expect(link).toHaveAttribute("href", "https://x.com/BOSSincrypto");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("renders the GitHub link with correct href, target and rel", () => {
      render(<TerminalHeader />);
      const link = screen.getByRole("link", { name: /github/i });
      expect(link).toHaveAttribute("href", "https://github.com/BOSSincrypto");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("renders the Telegram link with correct href, target and rel", () => {
      render(<TerminalHeader />);
      const link = screen.getByRole("link", { name: /telegram/i });
      expect(link).toHaveAttribute("href", "https://t.me/BOSSincrypto");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("renders the LinkedIn link with correct href, target and rel", () => {
      render(<TerminalHeader />);
      const link = screen.getByRole("link", { name: /linkedin/i });
      expect(link).toHaveAttribute(
        "href",
        "https://www.linkedin.com/in/bossincrypto",
      );
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("renders the Email link with correct mailto href, target and rel", () => {
      render(<TerminalHeader />);
      const link = screen.getByRole("link", { name: /email|mail/i });
      expect(link).toHaveAttribute("href", "mailto:bossincrypto@gmail.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
    });

    it("styles social links as terminal commands with $ prefix and monospace", () => {
      render(<TerminalHeader />);
      const social = screen.getByTestId("social-links");
      const links = within(social).getAllByRole("link");
      expect(links).toHaveLength(5);
      links.forEach((link) => {
        expect(link.className).toMatch(/font-mono/);
        expect(link.textContent ?? "").toMatch(/^\$\s/);
      });
    });
  });

  describe("tech stack display (VAL-HEADER-004)", () => {
    it("lists all six technologies", () => {
      render(<TerminalHeader />);
      const tech = screen.getByTestId("tech-stack");
      const expected = [
        "TypeScript",
        "React",
        "Node.js",
        "Python",
        "Solidity",
        "Web3.js",
      ];
      expected.forEach((t) => {
        expect(within(tech).getByText(t)).toBeInTheDocument();
      });
    });
  });

  describe("blinking terminal cursor (VAL-BOOT-010)", () => {
    it("renders a cursor element with the active blink animation class", () => {
      render(<TerminalHeader />);
      const cursor = screen.getByTestId("terminal-cursor");
      expect(cursor).toBeInTheDocument();
      expect(cursor.className).toMatch(/terminal-cursor/);
    });
  });

  describe("responsiveness", () => {
    it("uses a responsive flex layout that does not force fixed-width overflow", () => {
      render(<TerminalHeader />);
      const header = screen.getByTestId("terminal-header");
      expect(header.className).toMatch(/flex/);
      expect(header.className).not.toMatch(/w-\[/);
    });
  });
});
