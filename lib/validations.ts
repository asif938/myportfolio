import { z } from "zod";
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from "@/lib/slug";
import { EMPLOYMENT_TYPES } from "@/lib/format";
import { PROVIDER_IDS } from "@/lib/ai/providerMeta";

/** Result returned by every admin Server Action. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Turn null/undefined into "" and trim, so optional fields can be validated uniformly. */
const trimmedOrEmpty = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (v ?? "").trim());

/** Required, trimmed text with a max length. */
const text = (label: string, max: number) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

/** Optional http(s) URL. Empty string becomes null. */
const optionalUrl = (label: string) =>
  trimmedOrEmpty
    .pipe(
      z.union([
        z.literal(""),
        z
          .httpUrl({ error: `${label} must be a valid http(s) URL` })
          .max(2048, `${label} is too long`),
      ]),
    )
    .transform((v) => (v === "" ? null : v))
    .default(null);

/** Optional image URL. Must be hosted on Cloudinary (matches next.config.js images). */
const optionalImageUrl = (label: string) =>
  trimmedOrEmpty
    .pipe(
      z.union([
        z.literal(""),
        z
          .url({
            protocol: /^https$/,
            hostname: /^res\.cloudinary\.com$/,
            error: `${label} must be a Cloudinary image URL`,
          })
          .max(2048, `${label} is too long`),
      ]),
    )
    .transform((v) => (v === "" ? null : v))
    .default(null);

/** Optional free text with a max length. Empty string becomes null. */
const optionalText = (label: string, max: number) =>
  trimmedOrEmpty
    .pipe(z.string().max(max, `${label} must be at most ${max} characters`))
    .transform((v) => (v === "" ? null : v))
    .default(null);

const optionalPhone = (label: string) =>
  trimmedOrEmpty
    .pipe(
      z
        .string()
        .max(30, `${label} is too long`)
        .regex(/^[+\d\s()-]*$/, `${label} may only contain digits, spaces, +, - and ()`),
    )
    .transform((v) => (v === "" ? null : v))
    .default(null);

/** List of short strings (tech stack, achievements). Blank entries are dropped. */
const stringList = (label: string, maxItems: number, maxLength: number) =>
  z
    .array(
      z.string().trim().max(maxLength, `Each ${label} must be at most ${maxLength} characters`),
    )
    .transform((items) => items.filter(Boolean))
    .pipe(z.array(z.string()).max(maxItems, `At most ${maxItems} ${label} entries`));

/** "YYYY-MM" (from <input type="month">) or "YYYY-MM-DD", stored as UTC midnight. */
const monthDate = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .regex(/^\d{4}-\d{2}(-\d{2})?$/, `${label} must be a valid date`)
    .transform((v) => new Date(v.length === 7 ? `${v}-01T00:00:00Z` : `${v}T00:00:00Z`))
    .refine((d) => !Number.isNaN(d.getTime()), `${label} must be a valid date`);

export const idSchema = z.string().trim().min(1, "Missing id").max(64, "Invalid id");

/** Ordered list of ids, used by the up/down reorder buttons. */
export const reorderSchema = z
  .array(idSchema)
  .max(500, "Too many items")
  .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids");

export const profileSchema = z.object({
  name: text("Name", 100),
  designation: text("Designation", 100),
  aboutMe: text("About me", 5000),
  tagline: optionalText("Tagline", 400),
  location: optionalText("Location", 100),
  availability: optionalText("Availability", 150),
  email: trimmedOrEmpty
    .pipe(z.union([z.literal(""), z.email("Email must be valid").max(254)]))
    .transform((v) => (v === "" ? null : v))
    .default(null),
  phone: optionalPhone("Phone"),
  showPhone: z.boolean().default(false),
  whatsapp: optionalPhone("WhatsApp"),
  resumeUrl: optionalUrl("Resume URL"),
  githubUrl: optionalUrl("GitHub URL"),
  linkedinUrl: optionalUrl("LinkedIn URL"),
  facebookUrl: optionalUrl("Facebook URL"),
  heroPhotoUrl: optionalImageUrl("Hero photo"),
  aboutPhotoUrl: optionalImageUrl("About photo"),
});
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

export const skillSchema = z.object({
  name: text("Name", 60),
  category: text("Category", 50),
  imageUrl: optionalImageUrl("Logo"),
});
export type SkillInput = z.input<typeof skillSchema>;
export type SkillData = z.output<typeof skillSchema>;

export const educationSchema = z.object({
  institution: text("Institution", 150),
  degree: text("Degree", 150),
  startYear: text("Start year", 20),
  endYear: text("End year", 20),
  description: text("Description", 2000),
});
export type EducationInput = z.input<typeof educationSchema>;
export type EducationData = z.output<typeof educationSchema>;

export const projectSchema = z.object({
  name: text("Project name", 120),
  slug: trimmedOrEmpty
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .max(SLUG_MAX_LENGTH, `Slug must be at most ${SLUG_MAX_LENGTH} characters`)
          .regex(
            SLUG_PATTERN,
            "Slug may only contain lowercase letters, numbers and single dashes",
          ),
      ]),
    )
    .transform((v) => (v === "" ? null : v))
    .default(null),
  imageUrl: optionalImageUrl("Cover image"),
  images: z
    .array(optionalImageUrl("Gallery image"))
    .max(20, "At most 20 gallery images")
    .transform((urls) => urls.filter((u): u is string => u !== null))
    .default([]),
  mainTechStack: stringList("technology", 30, 40).refine(
    (items) => items.length > 0,
    "Add at least one technology",
  ),
  description: text("Description", 5000),
  liveLink: optionalUrl("Live link"),
  githubLink: optionalUrl("GitHub link"),
  challenges: text("Challenges", 5000),
  futurePlans: text("Future plans", 5000),
  role: optionalText("My role", 5000),
  architecture: optionalText("Architecture", 5000),
  impact: optionalText("Impact", 5000),
  featured: z.boolean().default(false),
});
export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectData = z.output<typeof projectSchema>;

export const experienceSchema = z
  .object({
    company: text("Company", 120),
    role: text("Role", 120),
    employmentType: z.enum(EMPLOYMENT_TYPES, { error: "Choose an employment type" }),
    location: optionalText("Location", 100),
    startDate: monthDate("Start date"),
    endDate: z
      .union([z.literal(""), z.null(), z.undefined(), monthDate("End date")])
      .transform((v) => (v instanceof Date ? v : null)),
    achievements: stringList("achievement", 20, 500).default([]),
    techStack: stringList("technology", 30, 40).default([]),
    companyUrl: optionalUrl("Company URL"),
  })
  .refine((e) => !e.endDate || e.endDate >= e.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  });
export type ExperienceInput = z.input<typeof experienceSchema>;
export type ExperienceData = z.output<typeof experienceSchema>;

/** Provider + model (+ optional new key): shared by "save" and "test connection". */
const aiConnectionFields = {
  provider: z.enum(PROVIDER_IDS, { error: "Choose a supported provider" }),
  model: z
    .string()
    .trim()
    .min(1, "Model is required")
    .max(100, "Model id is too long")
    .regex(/^[A-Za-z0-9._:/-]+$/, "Model id may only contain letters, numbers and . _ : / -"),
  /** Empty string = keep the stored key. */
  apiKey: z
    .string()
    .trim()
    .max(500, "API key is too long")
    .regex(/^\S*$/, "API key must not contain spaces")
    .default(""),
};

export const aiConnectionSchema = z.object(aiConnectionFields);
export type AiConnectionInput = z.input<typeof aiConnectionSchema>;

export const aiSettingsSchema = z.object({
  ...aiConnectionFields,
  enabled: z.boolean().default(false),
  /** Remove the stored key (fall back to the env var, if any). */
  clearApiKey: z.boolean().default(false),
  temperature: z.number().min(0, "Temperature must be 0–1").max(1, "Temperature must be 0–1"),
  maxOutputTokens: z.int("Max tokens must be a whole number").min(50).max(2000),
  perMinuteLimit: z.int("Per-minute limit must be a whole number").min(1).max(60),
  dailyLimit: z.int("Daily limit must be a whole number").min(1).max(10000),
  extraInstructions: optionalText("Extra instructions", 2000),
});
export type AiSettingsInput = z.input<typeof aiSettingsSchema>;

/** Body of POST /api/chat. */
export const CHAT_MAX_MESSAGES = 10;
export const CHAT_MAX_MESSAGE_LENGTH = 1000;
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(CHAT_MAX_MESSAGE_LENGTH),
      }),
    )
    .min(1)
    .max(CHAT_MAX_MESSAGES)
    .refine((messages) => messages[messages.length - 1]?.role === "user", {
      message: "The last message must be from the user",
    }),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

/** Readable message from the first validation issue. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
