import { describe, it, expect } from "vitest";
import { relativeTime } from "./format";

describe("relativeTime", () => {
  it('returns "updated just now" for dates within 60 seconds', () => {
    const now = new Date();
    const recent = new Date(now.getTime() - 30_000).toISOString();
    expect(relativeTime(recent)).toBe("updated just now");
  });

  it("returns minutes-ago format for under 60 minutes", () => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe("updated 5 mins ago");
  });

  it("returns singular 'min' for exactly 1 minute", () => {
    const now = new Date();
    const oneMinAgo = new Date(now.getTime() - 60 * 1000 - 1000).toISOString();
    expect(relativeTime(oneMinAgo)).toBe("updated 1 min ago");
  });

  it("returns hours-ago format for under 24 hours", () => {
    const now = new Date();
    const threeHoursAgo = new Date(
      now.getTime() - 3 * 3600 * 1000,
    ).toISOString();
    expect(relativeTime(threeHoursAgo)).toBe("updated 3 hours ago");
  });

  it("returns days-ago format for under 30 days", () => {
    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 86400 * 1000,
    ).toISOString();
    expect(relativeTime(sevenDaysAgo)).toBe("updated 7 days ago");
  });

  it("returns months-ago format for under 12 months", () => {
    const now = new Date();
    const twoMonthsAgo = new Date(
      now.getTime() - 60 * 86400 * 1000,
    ).toISOString();
    expect(relativeTime(twoMonthsAgo)).toBe("updated 2 months ago");
  });

  it("returns years-ago format for 12+ months", () => {
    const now = new Date();
    const oneYearAgo = new Date(
      now.getTime() - 370 * 86400 * 1000,
    ).toISOString();
    expect(relativeTime(oneYearAgo)).toBe("updated 1 year ago");
  });

  it("returns empty string for empty input", () => {
    expect(relativeTime("")).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(relativeTime("not-a-date")).toBe("");
  });

  it("handles future dates gracefully", () => {
    const future = new Date("2099-01-01T00:00:00Z").toISOString();
    expect(relativeTime(future)).toBe("updated just now");
  });
});
