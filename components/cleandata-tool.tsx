"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { inspectFile, type FileSummary } from "@/lib/metadata";
import { cleanFile } from "@/lib/formats";
import { useI18n } from "@/components/site-chrome";

type Stage = "empty" | "inspecting" | "ready" | "cleaning" | "done";
type ErrorKey = "errUnsupported" | "errRead" | "errClean";

const ACCEPTED_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const ACCEPT_ATTR =
  ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

const BTN_PRIMARY =
  "inline-flex h-10 w-full items-center justify-center rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-colors duration-150 hover:bg-foreground/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-60";
const BTN_SECONDARY =
  "inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-hover";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanedName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return `${name}-clean`;
  return `${name.slice(0, dot)}-clean${name.slice(dot)}`;
}

function isAccepted(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    ACCEPTED_EXT.some((ext) => name.endsWith(ext)) ||
    ["image/jpeg", "image/png", "image/webp"].includes(file.type)
  );
}

function Row({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | null;
  badge?: "found" | "warning";
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-secondary">{label}</dt>
      <dd className="min-w-0 text-right">
        {badge === "warning" ? (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            {t.found}
          </span>
        ) : badge === "found" ? (
          <span className="font-mono text-[13px] text-foreground">
            {t.found}
          </span>
        ) : value ? (
          <span className="block truncate font-mono text-[13px] text-foreground">
            {value}
          </span>
        ) : (
          <span className="font-mono text-[13px] text-muted">—</span>
        )}
      </dd>
    </div>
  );
}

export function CleanDataTool() {
  const { t } = useI18n();
  const [stage, setStage] = useState<Stage>("empty");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<FileSummary | null>(null);
  const [cleaned, setCleaned] = useState<{
    blob: Blob;
    afterCount: number;
  } | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fieldsLabel = useCallback(
    (n: number): string =>
      n === 1 ? t.fieldOne : t.fieldMany.replace("{n}", String(n)),
    [t],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setStage("empty");
    setFile(null);
    setPreviewUrl(null);
    setSummary(null);
    setCleaned(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [previewUrl]);

  const handleFile = useCallback(
    async (selected: File) => {
      setError(null);
      if (!isAccepted(selected)) {
        setError("errUnsupported");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setCleaned(null);
      setStage("inspecting");
      try {
        const result = await inspectFile(selected);
        setSummary(result);
        setStage("ready");
      } catch {
        setError("errRead");
        setStage("empty");
        setFile(null);
      }
    },
    [previewUrl],
  );

  const handleClean = useCallback(async () => {
    if (!file || !summary) return;
    setStage("cleaning");
    const started = Date.now();
    try {
      const outcome = await cleanFile(file);
      const after = await inspectFile(outcome.blob);
      // keep the loading state perceptible
      const wait = Math.max(0, 450 - (Date.now() - started));
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      setCleaned({ blob: outcome.blob, afterCount: after.fieldCount });
      setStage("done");
    } catch {
      setError("errClean");
      setStage("ready");
    }
  }, [file, summary]);

  const handleDownload = useCallback(() => {
    if (!cleaned || !file) return;
    const url = URL.createObjectURL(cleaned.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cleanedName(file.name);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [cleaned, file]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) void handleFile(dropped);
    },
    [handleFile],
  );

  const hasMetadata = (summary?.fieldCount ?? 0) > 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-[18px] shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] sm:p-6">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => {
          const selected = e.target.files?.[0];
          if (selected) void handleFile(selected);
        }}
      />

      {stage === "empty" && (
        <div className="animate-fade-in">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150 ${
              dragActive
                ? "border-brand bg-hover"
                : "border-border hover:bg-hover"
            }`}
          >
            <span className="flex size-10 items-center justify-center rounded-full border border-border bg-card text-secondary">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M8 10.5V2.5M8 2.5L4.75 5.75M8 2.5l3.25 3.25M2.5 13.5h11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="mt-3 text-sm font-medium text-foreground">
              {t.dropHere}
            </span>
            <span className="mt-1 text-[13px] text-secondary">
              {t.or}{" "}
              <span className="font-medium text-foreground underline underline-offset-2">
                {t.chooseFile}
              </span>
            </span>
          </button>
          {error && (
            <p className="animate-fade-in mt-3 text-center text-[13px] text-red-600 dark:text-red-400">
              {t[error]}
            </p>
          )}
          <p className="mt-3 text-center text-xs text-muted">
            {t.processedLocally}
          </p>
        </div>
      )}

      {file && stage !== "empty" && stage !== "done" && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt=""
                className="size-10 shrink-0 rounded-lg border border-border object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-secondary">
                {formatSize(file.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              disabled={stage === "cleaning"}
              className="shrink-0 text-[13px] font-medium text-secondary transition-colors duration-150 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {t.remove}
            </button>
          </div>

          <div className="my-4 border-t border-hover" />

          {stage === "inspecting" && (
            <div className="flex items-center gap-2.5 py-1">
              <span className="size-4 animate-spin rounded-full border-2 border-border border-t-secondary" />
              <span className="text-[13px] text-secondary">{t.reading}</span>
            </div>
          )}

          {summary && (stage === "ready" || stage === "cleaning") && (
            <div className="animate-fade-in">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-medium text-foreground">
                  {hasMetadata ? t.metadataFound : t.noMetadataFound}
                </h2>
                <span className="font-mono text-xs text-muted">
                  {fieldsLabel(summary.fieldCount)}
                </span>
              </div>

              <dl className="mt-2 divide-y divide-hover">
                <Row
                  label={t.rowGps}
                  value={null}
                  badge={summary.hasGps ? "warning" : undefined}
                />
                <Row label={t.rowDevice} value={summary.device} />
                <Row label={t.rowCamera} value={summary.camera} />
                <Row label={t.rowTaken} value={summary.taken} />
                <Row label={t.rowSoftware} value={summary.software} />
                <Row label={t.rowAuthor} value={summary.author} />
                <Row
                  label={t.rowExif}
                  value={null}
                  badge={summary.hasExif ? "found" : undefined}
                />
              </dl>

              <div className="my-4 border-t border-hover" />

              <button
                type="button"
                onClick={() => void handleClean()}
                disabled={stage === "cleaning"}
                className={BTN_PRIMARY}
              >
                {stage === "cleaning" ? t.cleaning : t.cleanBtn}
              </button>
              {error && (
                <p className="animate-fade-in mt-3 text-center text-[13px] text-red-600 dark:text-red-400">
                  {t[error]}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {stage === "done" && summary && cleaned && (
        <div className="animate-fade-in">
          <div className="flex flex-col items-center pt-2 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-hover text-foreground">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5l3.5 3.5L13 5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              {t.removedTitle}
            </p>
            <p className="mt-1 max-w-full truncate text-xs text-secondary">
              {file ? cleanedName(file.name) : ""}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 divide-x divide-border rounded-xl border border-border">
            <div className="px-4 py-3">
              <p className="text-xs text-secondary">{t.before}</p>
              <p className="mt-1 font-mono text-[13px] text-foreground">
                {fieldsLabel(summary.fieldCount)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-secondary">{t.after}</p>
              <p className="mt-1 font-mono text-[13px] text-foreground">
                {fieldsLabel(cleaned.afterCount)}
              </p>
            </div>
          </div>

          {cleaned.afterCount > 0 && (
            <p className="mt-3 text-center text-[13px] text-amber-600 dark:text-amber-400">
              {t.someRemain}
            </p>
          )}

          <div className="mt-5 flex flex-col gap-2">
            <button type="button" onClick={handleDownload} className={BTN_PRIMARY}>
              {t.downloadBtn}
            </button>
            <button type="button" onClick={reset} className={BTN_SECONDARY}>
              {t.cleanAnotherBtn}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
