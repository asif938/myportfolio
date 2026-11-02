import { describe, expect, it } from "vitest";
import type { Profile, Project } from "@prisma/client";
import { buildKnowledgeMarkdown, estimateTokens } from "@/lib/ai/buildKnowledge";

const profile: Profile = {
  id: "p1",
  name: "Jane Doe",
  designation: "Full Stack Developer",
  aboutMe: "I build things.",
  aboutPhotoUrl: null,
  email: "jane@example.com",
  phone: "+880 1700 000000",
  showPhone: false,
  whatsapp: null,
  resumeUrl: "https://example.com/cv.pdf",
  githubUrl: "https://github.com/jane",
  linkedinUrl: null,
  facebookUrl: null,
  heroPhotoUrl: null,
  tagline: "Building fast web apps.",
  location: "Dhaka",
  availability: "Open to remote roles",
};

const project: Project = {
  id: "x1",
  slug: "pet-nest",
  name: "Pet Nest",
  imageUrl: null,
  images: [],
  mainTechStack: ["React", "Node.js"],
  description: "A pet adoption platform.",
  liveLink: "https://petnest.example.com",
  githubLink: "https://github.com/jane/pet-nest",
  challenges: "Search.",
  futurePlans: "Mobile app.",
  role: "Sole developer",
  architecture: null,
  impact: null,
  featured: true,
  order: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const base = {
  profile,
  skills: [
    { id: "s1", name: "React", category: "Frontend", imageUrl: null, order: 0 },
    { id: "s2", name: "Prisma", category: "Backend", imageUrl: null, order: 1 },
  ],
  experience: [],
  education: [],
  projects: [project],
  siteUrl: "https://jane.dev",
};

describe("buildKnowledgeMarkdown", () => {
  it("includes profile, skills and project links", () => {
    const md = buildKnowledgeMarkdown(base);
    expect(md).toContain("# Jane Doe");
    expect(md).toContain("**Frontend:** React");
    expect(md).toContain("https://jane.dev/projects/pet-nest");
    expect(md).toContain("https://github.com/jane/pet-nest");
    expect(md).toContain("[Download resume](https://example.com/cv.pdf)");
  });

  it("hides the phone number unless showPhone is true", () => {
    expect(buildKnowledgeMarkdown(base)).not.toContain("1700");
    const shown = buildKnowledgeMarkdown({ ...base, profile: { ...profile, showPhone: true } });
    expect(shown).toContain("+880 1700 000000");
  });

  it("omits empty optional fields", () => {
    const md = buildKnowledgeMarkdown(base);
    expect(md).not.toContain("Architecture");
    expect(md).not.toContain("LinkedIn");
  });

  it("works with no data", () => {
    expect(buildKnowledgeMarkdown({ ...base, profile: null, skills: [], projects: [] })).toBe("");
  });

  it("includes FAQs answered by the owner", () => {
    const md = buildKnowledgeMarkdown({
      ...base,
      faqs: [{ question: "Does he do freelance work?", answer: "Yes, small projects." }],
    });
    expect(md).toContain("## Frequently asked questions");
    expect(md).toContain("**Q:** Does he do freelance work?");
    expect(md).toContain("**A:** Yes, small projects.");
    expect(buildKnowledgeMarkdown(base)).not.toContain("Frequently asked questions");
  });

  it("estimates tokens", () => {
    expect(estimateTokens("abcd".repeat(10))).toBe(10);
  });
});
