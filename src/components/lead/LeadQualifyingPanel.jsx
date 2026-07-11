import { useEffect, useState } from "react";
import { MdCheckCircle } from "react-icons/md";

const QUESTION_CONFIG = {
  "Where is the AC unit installed/to be installed?": {
    type: "radio",
    options: [
      "Residential - Ground floor / Easily accessible balcony",
      "Residential - High-rise apartment (Requires high-floor/outdoor bracket access)",
      "Commercial - Small office / Retail shop",
      "Commercial - Large corporate building / Industrial space",
    ],
  },
  "What type of AC system is this for? (Select all that apply)": {
    type: "checkbox",
    options: [
      "Split AC",
      "Window AC",
      "Central / Ductless Mini-Split System",
      "Cassette AC",
      "Inverter AC",
      "Not sure / Need expert advice",
    ],
  },
  "If your AC is having trouble, what symptoms are you noticing? (Select all that apply)":
    {
      type: "checkbox",
      options: [
        "AC turns on but isn't cooling effectively",
        "Making strange or loud noises",
        "Water leaking from the indoor or outdoor unit",
        "Foul or burning odor coming from the vents",
        "AC is constantly tripping the circuit breaker",
        "No specific issue, just needs a routine tune-up",
      ],
    },
  "Roughly how old is your current AC unit?": {
    type: "radio",
    options: [
      "Brand new / Less than 2 years old",
      "2 to 5 years old",
      "5 to 10 years old",
      "More than 10 years old",
      "I don't have a system yet (New installation request)",
    ],
  },
  "What is the current warranty status and operational state of the machine?": {
    type: "radio",
    options: [
      "Under Warranty — Completely dead / Not working",
      "Under Warranty — Working but has issues (poor cooling, noise, leaks)",
      "Out of Warranty (or Unsure) — Completely dead / Not working",
      "Out of Warranty (or Unsure) — Working but has issues",
      "N/A — Requesting a new AC installation or standard maintenance",
    ],
  },
  "Additional Details & Pipe/Duct Distance.": {
    type: "text",
  },
};

/**
 * LeadQualifyingPanel
 * Shows active LeadFAQ questions and lets the user fill in answers.
 *
 * Props:
 *   baseApi          – API base URL
 *   token            – Bearer token
 *   answers          – current answers object: { [faq_id]: answer_text }
 *   onChange         – (newAnswers) => void
 */
export default function LeadQualifyingPanel({
  baseApi,
  token,
  answers = {},
  onChange,
}) {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, [baseApi, token]);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseApi}/lead/lead-faqs/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setFaqs((data.results || data).filter((f) => f.is_active));
      }
    } catch (e) {
      console.error("Failed to fetch lead FAQs:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (faqId, value) => {
    onChange && onChange({ ...answers, [faqId]: value });
  };

  const toggleMultiAnswer = (faqId, option) => {
    const current = Array.isArray(answers[faqId]) ? answers[faqId] : [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    handleAnswer(faqId, next);
  };

  const isAnswered = (faq) => {
    const value = answers[faq.id];
    const config = QUESTION_CONFIG[faq.question];

    if (config?.type === "checkbox") {
      return Array.isArray(value) && value.length > 0;
    }

    if (config?.type === "text") {
      return typeof value === "string" && value.trim().length > 0;
    }

    return typeof value === "string" && value.trim().length > 0;
  };

  const renderQuestionBody = (faq) => {
    const config = QUESTION_CONFIG[faq.question];
    const value = answers[faq.id] ?? (config?.type === "checkbox" ? [] : "");

    if (config?.type === "radio") {
      return (
        <div className="ml-7 mt-2 space-y-2">
          {config.options.map((option) => (
            <label
              key={option}
              className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer"
            >
              <input
                type="radio"
                name={`faq-${faq.id}`}
                value={option}
                checked={value === option}
                onChange={(e) => handleAnswer(faq.id, e.target.value)}
                className="mt-1"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    if (config?.type === "checkbox") {
      const selected = Array.isArray(value) ? value : [];

      return (
        <div className="ml-7 mt-2 space-y-2">
          {config.options.map((option) => (
            <label
              key={option}
              className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleMultiAnswer(faq.id, option)}
                className="mt-1"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    return (
      <textarea
        value={typeof value === "string" ? value : ""}
        onChange={(e) => handleAnswer(faq.id, e.target.value)}
        placeholder="Enter your answer..."
        rows={4}
        className="w-full ml-7 mt-2 px-3 py-2 text-sm rounded-md border border-slate-300 bg-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200 resize-none"
      />
    );
  };

  const answeredCount = faqs.filter((faq) => isAnswered(faq)).length;
  const allAnswered = faqs.length > 0 && answeredCount === faqs.length;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <MdCheckCircle
            size={20}
            className={allAnswered ? "text-green-600" : "text-slate-300"}
          />
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Lead Qualifying Questions
            </p>
            <p className="text-xs text-slate-500">
              {allAnswered
                ? `Completed · ${answeredCount} of ${faqs.length} answered`
                : `${answeredCount} of ${faqs.length} answered`}
            </p>
          </div>
        </div>
        {allAnswered && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            ✓ Done
          </span>
        )}
      </div>

      <div className="space-y-3 border border-slate-200 rounded-lg p-4 bg-white">
        {loading ? (
          <p className="text-sm text-slate-400 text-center py-4 animate-pulse">
            Loading qualifying questions...
          </p>
        ) : faqs.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-4">
            No qualifying questions configured. Ask admin to add questions via{" "}
            <code className="bg-slate-100 px-1 rounded">/lead/lead-faqs/</code>
          </p>
        ) : (
          faqs.map((faq, idx) => {
            const answered = isAnswered(faq);
            return (
              <div key={faq.id} className="space-y-1">
                <label className="flex items-start gap-2 text-sm font-medium text-slate-700">
                  <span className="shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                    {idx + 1}
                  </span>
                  <span>
                    {faq.question}
                    {answered && (
                      <MdCheckCircle
                        size={14}
                        className="inline ml-1 text-green-500"
                      />
                    )}
                  </span>
                </label>
                {renderQuestionBody(faq)}
              </div>
            );
          })
        )}

        {faqs.length > 0 && !loading && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Completion</span>
              <span>
                {answeredCount}/{faqs.length}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{
                  width: `${faqs.length ? (answeredCount / faqs.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
