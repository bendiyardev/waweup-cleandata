"use client";

import { CleanDataTool } from "@/components/cleandata-tool";
import { Faq } from "@/components/faq";
import { TopControls, useI18n } from "@/components/site-chrome";

export default function Page() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-[620px]">
        <TopControls />
        <header className="mt-8 text-center">
          <p className="text-xs font-medium tracking-wide text-muted">
            <span
              aria-hidden="true"
              className="mr-1.5 inline-block size-1.5 rounded-full bg-brand align-[1px]"
            />
            waweup.
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {t.title}
          </h1>
          <p className="mt-2 text-[15px] text-secondary">{t.subtitle}</p>
        </header>
        <div className="mt-8">
          <CleanDataTool />
        </div>
        <Faq />
        <footer className="mt-10 pb-2 text-center text-xs text-muted">
          {t.footer}
        </footer>
      </div>
    </main>
  );
}
