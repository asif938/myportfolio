import { describe, expect, it } from "vitest";
import { companyInitials, splitExperience } from "@/lib/experience";
import { experienceSchema } from "@/lib/validations";

const d = (s: string) => new Date(`${s}-01T00:00:00Z`);
const job = (id: string, start: string, end: string | null) => ({
  id,
  startDate: d(start),
  endDate: end ? d(end) : null,
});

describe("splitExperience", () => {
  it("returns nothing for an empty list", () => {
    expect(splitExperience([])).toEqual({ featured: null, earlier: [] });
  });

  it("a single role is featured with no earlier roles", () => {
    const only = job("a", "2024-01", null);
    expect(splitExperience([only])).toEqual({ featured: only, earlier: [] });
  });

  it("features the current role even when another started later", () => {
    const { featured, earlier } = splitExperience([
      job("old", "2020-01", "2021-01"),
      job("current", "2022-01", null),
      job("newer-ended", "2023-01", "2023-06"),
    ]);
    expect(featured?.id).toBe("current");
    expect(earlier.map((e) => e.id)).toEqual(["newer-ended", "old"]);
  });

  it("features the most recent start when no role is current", () => {
    const { featured, earlier } = splitExperience([
      job("a", "2019-01", "2020-01"),
      job("c", "2022-01", "2022-12"),
      job("b", "2020-06", "2021-06"),
    ]);
    expect(featured?.id).toBe("c");
    expect(earlier.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("with several current roles features the latest start", () => {
    const { featured, earlier } = splitExperience([
      job("x", "2021-01", null),
      job("y", "2023-01", null),
    ]);
    expect(featured?.id).toBe("y");
    expect(earlier.map((e) => e.id)).toEqual(["x"]);
  });

  it("keeps the given order for identical start dates", () => {
    const { featured, earlier } = splitExperience([
      job("first", "2022-01", "2022-06"),
      job("second", "2022-01", "2022-09"),
      job("third", "2022-01", "2022-03"),
    ]);
    expect(featured?.id).toBe("first");
    expect(earlier.map((e) => e.id)).toEqual(["second", "third"]);
  });

  it("does not mutate its input", () => {
    const list = [job("a", "2020-01", "2021-01"), job("b", "2022-01", null)];
    splitExperience(list);
    expect(list.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("companyInitials", () => {
  it("uses at most two letters", () => {
    expect(companyInitials("Acme Corporation Ltd")).toBe("AC");
    expect(companyInitials("Google")).toBe("GO");
    expect(companyInitials("  ")).toBe("?");
  });
});

describe("experienceSchema companyLogoUrl", () => {
  const base = {
    company: "Acme",
    role: "Dev",
    employmentType: "FULL_TIME",
    startDate: "2024-01",
    endDate: "",
  };
  const parse = (companyLogoUrl?: string) =>
    experienceSchema.safeParse({ ...base, companyLogoUrl });

  it("accepts a Cloudinary https URL", () => {
    const r = parse("https://res.cloudinary.com/demo/image/upload/v1/portfolio/logo.png");
    expect(r.success && r.data.companyLogoUrl).toBe(
      "https://res.cloudinary.com/demo/image/upload/v1/portfolio/logo.png",
    );
  });

  it("treats empty or missing as removal (null)", () => {
    const empty = parse("");
    expect(empty.success && empty.data.companyLogoUrl).toBeNull();
    const missing = parse(undefined);
    expect(missing.success && missing.data.companyLogoUrl).toBeNull();
  });

  it("rejects http, other hosts and look-alike hosts", () => {
    expect(parse("http://res.cloudinary.com/demo/image/upload/a.png").success).toBe(false);
    expect(parse("https://example.com/logo.png").success).toBe(false);
    expect(parse("https://res.cloudinary.com.evil.io/a.png").success).toBe(false);
    expect(parse("not a url").success).toBe(false);
  });
});
