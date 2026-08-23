import { CleanDataTool } from "@/components/cleandata-tool";

export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-[620px]">
        <header className="text-center">
          <p className="text-xs font-medium tracking-wide text-neutral-400">
            waweup.
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
            CleanData
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500">
            Remove hidden metadata before sharing.
          </p>
        </header>
        <div className="mt-8">
          <CleanDataTool />
        </div>
      </div>
    </main>
  );
}
