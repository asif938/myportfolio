import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/validations";

const valid = {
  name: "  Jane Recruiter ",
  email: "jane@example.com",
  subject: "Frontend role",
  message: "Hi, are you open to a remote frontend role?",
};

describe("contactSchema", () => {
  it("accepts a valid message and trims fields", () => {
    const result = contactSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.success && result.data.name).toBe("Jane Recruiter");
  });

  it("rejects an invalid email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects line breaks in name and subject (email header injection)", () => {
    expect(contactSchema.safeParse({ ...valid, subject: "Hi\nBcc: x@y.z" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, name: "A\r\nB" }).success).toBe(false);
  });

  it("enforces message length", () => {
    expect(contactSchema.safeParse({ ...valid, message: "short" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });

  it("requires all fields", () => {
    expect(contactSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ email: valid.email }).success).toBe(false);
  });

  it("passes the honeypot value through so the action can check it", () => {
    const result = contactSchema.safeParse({ ...valid, botcheck: "on" });
    expect(result.success && result.data.botcheck).toBe("on");
  });
});
