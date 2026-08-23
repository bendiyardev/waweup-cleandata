"use client";

import { useI18n } from "@/components/site-chrome";

export function Faq() {
  const { t } = useI18n();

  return (
    <section className="mt-10">
      <h2 className="text-center text-sm font-medium text-foreground">
        {t.faqTitle}
      </h2>
      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card px-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]">
        {t.faq.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
              {item.q}
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="shrink-0 text-muted transition-transform duration-150 group-open:rotate-180"
              >
                <path
                  d="M3.5 6l4.5 4.5L12.5 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>
            <p className="mt-2 pr-8 text-[13px] leading-relaxed text-secondary">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
