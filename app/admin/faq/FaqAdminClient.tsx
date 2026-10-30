"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Faq } from "@prisma/client";
import { addFaq, deleteFaq, reorderFaqs, updateFaq } from "@/app/actions/faqActions";
import { confirmDelete, runAdminAction } from "@/lib/adminFeedback";
import ReorderButtons, { moveId } from "../ReorderButtons";
import { inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "../formStyles";

type FaqForm = { id: string; question: string; answer: string };

export default function FaqAdminClient({
  initialFaqs,
  prefill,
}: {
  initialFaqs: Faq[];
  prefill: { question: string; answer: string };
}) {
  const router = useRouter();
  const faqs = initialFaqs;
  const empty: FaqForm = { id: "", question: "", answer: "" };
  const [current, setCurrent] = useState<FaqForm>({ ...empty, ...prefill });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isEditing = current.id !== "";

  const resetForm = () => {
    setCurrent(empty);
    // Drop ?q=&a= so a refresh doesn't prefill again.
    router.replace("/admin/faq");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { id, ...data } = current;
    const ok = await runAdminAction(
      () => (isEditing ? updateFaq(id, data) : addFaq(data)),
      isEditing ? "FAQ updated" : "FAQ added — the chatbot can use it now",
    );
    if (ok) {
      resetForm();
      router.refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (faq: Faq) => {
    if (!(await confirmDelete("this FAQ"))) return;
    setBusyId(faq.id);
    if (await runAdminAction(() => deleteFaq(faq.id), "FAQ deleted")) router.refresh();
    setBusyId(null);
  };

  const handleMove = async (index: number, delta: -1 | 1) => {
    setBusyId("reorder");
    const ids = moveId(
      faqs.map((f) => f.id),
      index,
      delta,
    );
    if (await runAdminAction(() => reorderFaqs(ids), "Order saved")) router.refresh();
    setBusyId(null);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">FAQ</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Answers here are added to the chatbot&apos;s knowledge, so it can answer these questions
          itself next time.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
      >
        <h3 className="text-lg font-semibold">{isEditing ? "Edit FAQ" : "Add FAQ"}</h3>
        <div>
          <label htmlFor="faq-question" className={labelClass}>
            Question
          </label>
          <input
            id="faq-question"
            required
            maxLength={300}
            value={current.question}
            onChange={(e) => setCurrent({ ...current, question: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="faq-answer" className={labelClass}>
            Answer
          </label>
          <textarea
            id="faq-answer"
            required
            rows={4}
            maxLength={4000}
            value={current.answer}
            onChange={(e) => setCurrent({ ...current, answer: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? "Saving..." : "Save"}
          </button>
          {(isEditing || current.question || current.answer) && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section
        aria-labelledby="faq-list"
        className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800"
      >
        <h3 id="faq-list" className="mb-4 text-lg font-semibold">
          Questions ({faqs.length})
        </h3>
        {faqs.length === 0 ? (
          <p className="text-gray-500">
            No FAQs yet. Use &quot;Add to FAQ&quot; on a conversation, or add one above.
          </p>
        ) : (
          <ul className="space-y-3">
            {faqs.map((faq, index) => (
              <li
                key={faq.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4 dark:border-gray-700"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{faq.question}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                    {faq.answer}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <ReorderButtons
                    label={faq.question}
                    index={index}
                    count={faqs.length}
                    disabled={busyId !== null}
                    onMove={(delta) => handleMove(index, delta)}
                  />
                  <button
                    type="button"
                    aria-label={`Edit FAQ: ${faq.question}`}
                    onClick={() => {
                      setCurrent({ id: faq.id, question: faq.question, answer: faq.answer });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete FAQ: ${faq.question}`}
                    disabled={busyId === faq.id}
                    onClick={() => void handleDelete(faq)}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 dark:text-red-400"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
