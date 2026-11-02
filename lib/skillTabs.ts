export type TabSkill = { id: string; name: string; category: string; imageUrl: string | null };

export type SkillTab = {
  id: string;
  label: string;
  skills: TabSkill[];
};

export type SkillTabs = {
  /** Categories in first-appearance order; empty categories never appear. */
  categories: string[];
  tabs: SkillTab[];
  /** The tab row only adds something with 2+ categories. */
  showTabs: boolean;
};

/** Groups skills for the tabbed wall: "All" (in category order) plus one tab per non-empty category. */
export function buildSkillTabs(skills: readonly TabSkill[]): SkillTabs {
  const categories = Array.from(new Set(skills.map((s) => s.category)));
  const byCategory = categories.map((c) => skills.filter((s) => s.category === c));
  return {
    categories,
    tabs: [
      { id: "all", label: "All", skills: byCategory.flat() },
      ...categories.map((c, i) => ({ id: `cat-${i}`, label: c, skills: byCategory[i] })),
    ],
    showTabs: categories.length > 1,
  };
}
