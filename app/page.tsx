"use client";

import { CleanDataTool } from "@/components/cleandata-tool";
import { Faq } from "@/components/faq";
import { TopControls, useI18n } from "@/components/site-chrome";

export default function Page() {
  const { t } = useI18n();

  return (
    <main className="flex min-h-dvh flex-col px-4 py-8 sm:px-6">
      <TopControls />
      <div className="mx-auto flex w-full max-w-[620px] flex-1 flex-col justify-center">
        <header className="mt-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
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
