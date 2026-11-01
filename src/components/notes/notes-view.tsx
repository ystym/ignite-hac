import {
  BookOpenCheck,
  ClipboardList,
  FlaskConical,
  Lightbulb,
  ListChecks,
  TriangleAlert,
} from "lucide-react";
import type { NotesContent } from "@/lib/schemas";
import { MathText } from "@/components/math-text";

/**
 * Shared renderer for grounded document notes and standalone topic notes.
 * It only renders schema-validated fields; it never fetches or cites sources.
 */
export function NotesContentView({
  content,
  prerequisites,
}: {
  content: NotesContent;
  prerequisites?: string[];
}) {
  return (
    <>
      <div className="space-y-6 p-5 sm:p-6">
        {prerequisites && prerequisites.length > 0 && (
          <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-sky-700">
              Before you start
            </p>
            <ul className="mt-2 space-y-1.5">
              {prerequisites.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[12px] leading-5 text-ink-600"
                >
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.sections.map((section, index) => (
          <section key={`${section.heading}-${index}`} className="scroll-mt-6">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-mono text-[11px] font-semibold text-violet-700">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-[17px] font-semibold leading-snug text-ink-900">
                  {section.heading}
                </h3>
                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-6 text-ink-600">
                  {section.explanation}
                </p>

                {section.keyPoints.length > 0 && (
                  <div className="mt-3 rounded-xl border border-[#f0f0f0] bg-parchment/60 p-3.5">
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-ink-400">
                      Key points
                    </p>
                    <ul className="space-y-1.5">
                      {section.keyPoints.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-[12.5px] leading-5 text-ink-600"
                        >
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.definitions.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {section.definitions.map((definition) => (
                      <div key={definition.term} className="rounded-xl border border-[#f0f0f0] p-3">
                        <p className="text-[11px] font-semibold text-ink-900">{definition.term}</p>
                        <p className="mt-1 text-[11.5px] leading-5 text-ink-500">
                          {definition.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {section.formulas.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {section.formulas.map((formula, formulaIndex) => (
                      <div
                        key={`${formula.formula}-${formulaIndex}`}
                        className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5"
                      >
                        <MathText
                          value={formula.formula}
                          displayMode
                          className="text-ink-900"
                        />
                        <p className="mt-2 text-[11px] leading-5 text-ink-500">
                          {formula.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {section.examples.length > 0 && (
                  <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/60 p-3.5">
                    <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-sky-700">
                      <FlaskConical className="h-3 w-3" /> Worked example
                    </p>
                    {section.examples.map((example, exampleIndex) => (
                      <p
                        key={exampleIndex}
                        className="mt-1 text-[12px] leading-6 text-ink-600"
                      >
                        {example}
                      </p>
                    ))}
                  </div>
                )}

                {section.examTips.length > 0 && (
                  <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3.5">
                    <p className="mb-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-amber-700">
                      <Lightbulb className="h-3 w-3" /> Exam tips
                    </p>
                    <ul className="space-y-1.5">
                      {section.examTips.map((tip) => (
                        <li
                          key={tip}
                          className="flex items-start gap-2 text-[12px] leading-5 text-ink-600"
                        >
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {(content.keyTakeaways.length > 0 || content.importantExamPoints.length > 0) && (
        <div className="grid gap-4 border-t border-[#f0f0f0] bg-parchment/50 p-5 sm:grid-cols-2 sm:p-6">
          <div className="rounded-xl border border-hairline bg-white p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <BookOpenCheck className="h-4 w-4" />
              <h3 className="text-[12px] font-semibold">Key takeaways</h3>
            </div>
            <ul className="mt-2.5 space-y-2">
              {content.keyTakeaways.map((takeaway) => (
                <li
                  key={takeaway}
                  className="flex items-start gap-2 text-[11.5px] leading-5 text-ink-600"
                >
                  <ListChecks className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-hairline bg-white p-4">
            <div className="flex items-center gap-2 text-violet-700">
              <ClipboardList className="h-4 w-4" />
              <h3 className="text-[12px] font-semibold">Important exam points</h3>
            </div>
            <ul className="mt-2.5 space-y-2">
              {content.importantExamPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2 text-[11.5px] leading-5 text-ink-600"
                >
                  <ListChecks className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {content.uncertainAreas.length > 0 && (
        <div className="border-t border-rose-100 bg-rose-50/50 p-5 sm:p-6">
          <div className="flex items-center gap-2 text-rose-700">
            <TriangleAlert className="h-4 w-4" />
            <h3 className="text-[12px] font-semibold">Uncertain areas carried into the notes</h3>
          </div>
          <div className="mt-3 space-y-2">
            {content.uncertainAreas.map((area) => (
              <div key={area.topic} className="rounded-lg border border-rose-100 bg-white/80 p-3">
                <p className="text-[11.5px] font-semibold text-rose-900">{area.topic}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{area.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
