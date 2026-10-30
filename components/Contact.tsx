"use client";

import React, { useState } from "react";
import type { Profile } from "@prisma/client";
import { Mail, Phone, Send } from "lucide-react";
import Reveal from "@/components/Reveal";
import { sendContactMessage } from "@/app/actions/contactActions";

type Status = { type: "success" | "error"; text: string } | null;

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

  return (
    <section
      id="contact"
      tabIndex={-1}
      className="scroll-mt-16 bg-white py-24 outline-none dark:bg-gray-900"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 text-center">
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Get In Touch
          </h2>
          <div className="mx-auto mb-12 mt-4 h-1 w-20 rounded-full bg-indigo-600" />
          <p className="mx-auto mb-12 max-w-3xl text-lg text-gray-600 dark:text-gray-400">
            I&apos;m currently open for new opportunities. Whether you have a question or just want
            to say hi, I&apos;ll try my best to get back to you!
          </p>
        </Reveal>

        <Reveal className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div className="flex flex-col justify-center space-y-8 lg:pr-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Let&apos;s Talk</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Feel free to reach out to me via email or phone. I usually respond within 24 hours.
            </p>

            <div className="flex flex-col space-y-4 pt-4">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:border-indigo-500 hover:shadow-md dark:border-gray-800"
                >
                  <div className="rounded-full bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Email</h4>
                    <p className="break-all text-gray-600 dark:text-gray-400">{profile.email}</p>
                  </div>
                </a>
              )}

              {(publicPhone || profile.whatsapp) && (
                <a
                  href={
                    profile.whatsapp
                      ? `https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`
                      : `tel:${publicPhone}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:border-indigo-500 hover:shadow-md dark:border-gray-800"
                >
                  <div className="rounded-full bg-indigo-50 p-3 text-indigo-600 transition-colors group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-900/30 dark:text-indigo-400">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {profile.whatsapp ? "WhatsApp" : "Phone"}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {profile.whatsapp || publicPhone}
                    </p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:p-8">
            <h3 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
              Send Me a Message
            </h3>
            <form onSubmit={onSubmit} className="space-y-6">
              <input
                type="checkbox"
                name="botcheck"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  name="name"
                  maxLength={100}
                  id="name"
                  required
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  placeholder="john@example.com"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  maxLength={150}
                  id="subject"
                  required
                  placeholder="Job Opportunity"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
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
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
                <Send size={18} />
              </button>
              <div aria-live="polite">
                {status && (
                  <p
                    role={status.type === "error" ? "alert" : "status"}
                    className={
                      status.type === "success"
                        ? "rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }
                  >
                    {status.text}
                  </p>
                )}
              </div>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
