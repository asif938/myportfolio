/**
 * Seed a fresh database.
 *
 * - Creates the admin user from ADMIN_USERNAME / ADMIN_PASSWORD if it doesn't exist.
 * - Adds sample content ONLY when the database has no content at all.
 *   Existing rows are never updated or deleted.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set to run the seed script.`);
  }
  return value;
}

const month = (yyyyMm: string) => new Date(`${yyyyMm}-01T00:00:00Z`);

const sampleProfile: Prisma.ProfileCreateInput = {
  name: "Your Name",
  designation: "Full-Stack Developer",
  tagline:
    "I build fast, accessible web applications with React, Next.js and Node.js, and I care about clean code and good developer experience.",
  location: "Dhaka, Bangladesh",
  availability: "Open to remote full-time roles",
  aboutMe:
    "I'm a full-stack developer who enjoys turning ideas into products.\n\nI started with HTML and CSS, fell in love with JavaScript, and now work across the stack with TypeScript, React, Next.js, Node.js and PostgreSQL.",
  email: "you@example.com",
  showPhone: false,
  githubUrl: "https://github.com/your-username",
  linkedinUrl: "https://www.linkedin.com/in/your-username",
};

const sampleSkills: Prisma.SkillCreateManyInput[] = [
  { name: "TypeScript", category: "Frontend" },
  { name: "React", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Express", category: "Backend" },
  { name: "PostgreSQL", category: "Backend" },
  { name: "Prisma", category: "Backend" },
  { name: "Git", category: "Tools" },
  { name: "Docker", category: "Tools" },
].map((skill, order) => ({ ...skill, order }));

const sampleExperience: Prisma.ExperienceCreateManyInput[] = [
  {
    company: "Acme Software",
    role: "Full-Stack Developer",
    employmentType: "FULL_TIME",
    location: "Remote",
    startDate: month("2024-03"),
    endDate: null,
    achievements: [
      "Built a customer dashboard in Next.js used by 2,000+ businesses.",
      "Cut API response times by 40% by adding database indexes and caching.",
      "Introduced end-to-end tests that caught regressions before each release.",
    ],
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
    companyUrl: "https://example.com",
    order: 0,
  },
  {
    company: "Pixel Studio",
    role: "Frontend Developer Intern",
    employmentType: "INTERNSHIP",
    location: "Dhaka, Bangladesh",
    startDate: month("2023-06"),
    endDate: month("2023-12"),
    achievements: [
      "Implemented responsive landing pages from Figma designs.",
      "Improved Lighthouse accessibility scores from 70 to 98.",
    ],
    techStack: ["React", "Tailwind CSS"],
    order: 1,
  },
];

const sampleEducation: Prisma.EducationCreateManyInput[] = [
  {
    institution: "Example University",
    degree: "B.Sc. in Computer Science and Engineering",
    startYear: "2020",
    endYear: "2024",
    description: "Focused on software engineering, databases and web technologies.",
    order: 0,
  },
  {
    institution: "Example College",
    degree: "Higher Secondary Certificate (Science)",
    startYear: "2017",
    endYear: "2019",
    description: "Science group with mathematics and physics.",
    order: 1,
  },
];

const sampleProjects: Prisma.ProjectCreateManyInput[] = [
  {
    slug: "task-flow",
    name: "TaskFlow",
    description: "A collaborative task manager with real-time updates and team workspaces.",
    mainTechStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Tailwind CSS"],
    liveLink: "https://example.com",
    githubLink: "https://github.com/your-username/task-flow",
    role: "Sole developer: designed the data model, built the API and the UI.",
    architecture:
      "Next.js App Router with Server Actions for mutations, PostgreSQL via Prisma, and optimistic UI updates on the client.",
    impact: "Used daily by a 12-person team; replaced a spreadsheet-based workflow.",
    challenges: "Keeping the board in sync between users without a dedicated websocket server.",
    futurePlans: "Add recurring tasks and a mobile-friendly offline mode.",
    featured: true,
    order: 0,
  },
  {
    slug: "shop-lite",
    name: "ShopLite",
    description: "A small e-commerce storefront with cart, checkout and an admin panel.",
    mainTechStack: ["React", "Node.js", "Express", "MongoDB"],
    githubLink: "https://github.com/your-username/shop-lite",
    challenges: "Handling stock correctly when two customers buy the last item at the same time.",
    futurePlans: "Add product reviews and payment provider integration.",
    featured: true,
    order: 1,
  },
  {
    slug: "weather-now",
    name: "WeatherNow",
    description: "A fast weather app with location search and a 7-day forecast.",
    mainTechStack: ["React", "TypeScript", "Tailwind CSS"],
    liveLink: "https://example.com",
    challenges: "Keeping the UI responsive while fetching data from a slow third-party API.",
    futurePlans: "Add severe weather alerts.",
    order: 2,
  },
];

async function seedAdmin() {
  const username = requireEnv("ADMIN_USERNAME");
  const password = requireEnv("ADMIN_PASSWORD");
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");
  }

  // Create the admin only if it does not exist yet. Use `npm run admin:password` to rotate.
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin user "${username}" already exists; leaving it unchanged.`);
    return;
  }
  await prisma.user.create({
    data: { username, password: await bcrypt.hash(password, BCRYPT_COST) },
  });
  console.log(`Created admin user "${username}".`);
}

/** True when no content table has any rows, i.e. a brand-new database. */
async function isFreshDatabase(): Promise<boolean> {
  const counts = await Promise.all([
    prisma.profile.count(),
    prisma.skill.count(),
    prisma.experience.count(),
    prisma.education.count(),
    prisma.project.count(),
  ]);
  return counts.every((n) => n === 0);
}

async function main() {
  await seedAdmin();

  // Sample content is only added to a completely empty database, so running the seed
  // against a real database (even one with some empty tables) never adds fake entries.
  if (!(await isFreshDatabase())) {
    console.log("Database already has content; sample data skipped.");
    return;
  }

  await prisma.$transaction([
    prisma.profile.create({ data: sampleProfile }),
    prisma.skill.createMany({ data: sampleSkills }),
    prisma.experience.createMany({ data: sampleExperience }),
    prisma.education.createMany({ data: sampleEducation }),
    prisma.project.createMany({ data: sampleProjects }),
  ]);
  console.log("Sample profile, skills, experience, education and projects created.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e instanceof Error ? e.message : e);
    await prisma.$disconnect();
    process.exit(1);
  });
