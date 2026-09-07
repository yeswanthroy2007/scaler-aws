import { describe, expect, it } from "vitest";
import { formatTtl, recordDisplayName, truncateMiddle } from "./formatters";

describe("formatTtl", () => {
  it("formats seconds under a minute", () => {
    expect(formatTtl(45)).toBe("45s");
  });

  it("formats minutes", () => {
    expect(formatTtl(300)).toBe("5m");
  });

  it("formats hours", () => {
    expect(formatTtl(3600)).toBe("1h");
  });

  it("formats days", () => {
    expect(formatTtl(172800)).toBe("2d");
  });
});

describe("recordDisplayName", () => {
  it("returns the domain name for the apex record", () => {
    expect(recordDisplayName("", "example.com")).toBe("example.com");
  });

  it("prefixes the subdomain for a non-apex record", () => {
    expect(recordDisplayName("www", "example.com")).toBe("www.example.com");
  });
});

describe("truncateMiddle", () => {
  it("returns the original string when short enough", () => {
    expect(truncateMiddle("short", 40)).toBe("short");
  });

  it("truncates long strings with an ellipsis in the middle", () => {
    const long = "a".repeat(60);
    const result = truncateMiddle(long, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain("...");
  });
});
