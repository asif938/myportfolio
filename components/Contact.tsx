"use client";

import React, { useState } from "react";
import type { Profile } from "@prisma/client";
import { Mail, Phone, Send } from "lucide-react";
import Atmosphere from "@/components/Atmosphere";
import Reveal from "@/components/Reveal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";
import SectionHeading from "@/components/ui/SectionHeading";
import { sendContactMessage } from "@/app/actions/contactActions";

type Status = { type: "success" | "error"; text: string } | null;

const field =
  "w-full rounded-2xl border border-line-strong bg-surface px-4 py-3 text-fg placeholder:text-muted transition-colors focus:border-brand";

export default function Contact({ profile }: { profile: Profile | null }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  if (!profile) return null;
  const publicPhone = profile.showPhone ? profile.phone : null;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const field = (name: string) => String(formData.get(name) ?? "");

    try {
      const result = await sendContactMessage({
        name: field("name"),
        email: field("email"),
        subject: field("subject"),
        message: field("message"),
        botcheck: formData.get("botcheck") ? "on" : undefined,
      });
      if (result.ok) {
        setStatus({
          type: "success",
          text: "Thanks! Your message has been sent. I'll get back to you soon.",
        });
        form.reset();
      } else {
        setStatus({ type: "error", text: result.error });
      }
    } catch {
      setStatus({
        type: "error",
        text: "Couldn't send your message. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const items = [
    profile.email && {
      key: "email",
      label: "Email",
      value: profile.email,
      href: `mailto:${profile.email}`,
      external: false,
      Icon: Mail,
    },
    (publicPhone || profile.whatsapp) && {
      key: "phone",
      label: profile.whatsapp ? "WhatsApp" : "Phone",
      value: profile.whatsapp || publicPhone,
      href: profile.whatsapp
        ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`
        : `tel:${publicPhone}`,
      external: true,
      Icon: Phone,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    value: string;
    href: string;
    external: boolean;
    Icon: typeof Mail;
  }[];

  return (
    <Section id="contact" backdrop={<Atmosphere variant="soft" side="left" />}>
      <Reveal>
        <SectionHeading
          eyebrow="Contact"
          title="Get In Touch"
          highlight="Touch"
          className="!mb-6"
        />
        <p className="mx-auto mb-12 max-w-3xl text-center text-base text-muted sm:mb-16 sm:text-lg">
          I&apos;m currently open for new opportunities. Whether you have a question or just want to
          say hi, I&apos;ll try my best to get back to you!
        </p>
      </Reveal>

      <Reveal className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col justify-center space-y-6 lg:pr-8">
          <h3 className="text-2xl font-bold text-fg sm:text-3xl">Let&apos;s Talk</h3>
          <p className="text-muted">
            Feel free to reach out to me via email or phone. I usually respond within 24 hours.
          </p>

          <ul className="flex flex-col gap-4 pt-2">
            {items.map(({ key, label, value, href, external, Icon }) => (
              <li key={key}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group relative flex min-w-0 items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-card backdrop-blur-md transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand"
                >
                  <span
                    aria-hidden
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-gradient-deep text-white"
                  >
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block font-semibold text-fg">{label}</span>
                    <span className="block break-all text-muted">{value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Card className="p-6 hover:translate-y-0 sm:p-8">
          <h3 className="mb-6 text-2xl font-bold text-fg">Send Me a Message</h3>
          <form onSubmit={onSubmit} className="space-y-5" aria-busy={isSubmitting}>
            <input
              type="checkbox"
              name="botcheck"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-fg">
                Your Name
              </label>
              <input
                type="text"
                name="name"
                maxLength={100}
                id="name"
                required
                placeholder="John Doe"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-fg">
                Your Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                placeholder="john@example.com"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-fg">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                maxLength={150}
                id="subject"
                required
                placeholder="Job Opportunity"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-fg">
                Message
              </label>
              <textarea
                name="message"
                minLength={10}
                maxLength={5000}
                id="message"
                rows={4}
                required
                placeholder="Hello, I'd like to talk about..."
                className={`${field} resize-none`}
              />
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              chipIcon={Send}
              className="w-full justify-between"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
            <div aria-live="polite">
              {status && (
                <p
                  role={status.type === "error" ? "alert" : "status"}
                  className={
                    status.type === "success"
                      ? "rounded-2xl bg-success-bg p-3 text-sm text-success"
                      : "rounded-2xl bg-danger-bg p-3 text-sm text-danger"
                  }
                >
                  {status.text}
                </p>
              )}
            </div>
          </form>
        </Card>
      </Reveal>
    </Section>
  );
}
