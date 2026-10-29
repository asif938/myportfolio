import { z } from "zod";

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

export const idSchema = z.string().trim().min(1, "Missing id").max(64, "Invalid id");

export const profileSchema = z.object({
  name: text("Name", 100),
  designation: text("Designation", 100),
  aboutMe: text("About me", 5000),
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
  imageUrl: optionalImageUrl("Project image"),
  mainTechStack: z
    .array(z.string().trim().min(1).max(40, "Each technology must be at most 40 characters"))
    .min(1, "Add at least one technology")
    .max(30, "At most 30 technologies"),
  description: text("Description", 5000),
  liveLink: optionalUrl("Live link"),
  githubLink: optionalUrl("GitHub link"),
  challenges: text("Challenges", 5000),
  futurePlans: text("Future plans", 5000),
});
export type ProjectInput = z.input<typeof projectSchema>;
export type ProjectData = z.output<typeof projectSchema>;

/** Readable message from the first validation issue. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
