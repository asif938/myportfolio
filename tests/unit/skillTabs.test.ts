import { describe, expect, it } from "vitest";
import { buildSkillTabs, type TabSkill } from "@/lib/skillTabs";

const s = (id: string, category: string): TabSkill => ({ id, name: id, category, imageUrl: null });

describe("buildSkillTabs", () => {
  const skills = [
    s("react", "Frontend"),
    s("node", "Backend"),
    s("css", "Frontend"),
    s("sql", "Backend"),
    s("git", "Tools"),
  ];

  it("builds All first, then categories in first-appearance order", () => {
    const { tabs, categories } = buildSkillTabs(skills);
    expect(categories).toEqual(["Frontend", "Backend", "Tools"]);
    expect(tabs.map((t) => t.label)).toEqual(["All", "Frontend", "Backend", "Tools"]);
  });

  it("All lists every skill grouped in category order, with counts", () => {
    const { tabs } = buildSkillTabs(skills);
    expect(tabs[0].skills.map((x) => x.id)).toEqual(["react", "css", "node", "sql", "git"]);
    expect(tabs.map((t) => t.skills.length)).toEqual([5, 2, 2, 1]);
  });

  it("each category tab holds only its own skills", () => {
    const backend = buildSkillTabs(skills).tabs.find((t) => t.label === "Backend");
    expect(backend?.skills.map((x) => x.id)).toEqual(["node", "sql"]);
  });

  it("never creates a tab for a category without skills", () => {
    const { tabs } = buildSkillTabs([s("a", "One"), s("b", "Two")]);
    expect(tabs.every((t) => t.skills.length > 0)).toBe(true);
  });

  it("hides the tab row for a single category, shows it for two or more", () => {
    expect(buildSkillTabs([s("a", "Only"), s("b", "Only")]).showTabs).toBe(false);
    expect(buildSkillTabs(skills).showTabs).toBe(true);
  });

  it("handles no skills", () => {
    const r = buildSkillTabs([]);
    expect(r.categories).toEqual([]);
    expect(r.tabs[0].skills).toEqual([]);
    expect(r.showTabs).toBe(false);
  });
});
