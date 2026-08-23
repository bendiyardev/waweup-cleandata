import exifr from "exifr";
import {
  countJpegComments,
  countPngTextChunks,
  detectKind,
  findWebpExifPayload,
  hasWebpXmp,
} from "@/lib/formats";

export interface FileSummary {
  fieldCount: number;
  hasGps: boolean;
  hasExif: boolean;
  device: string | null;
  camera: string | null;
  taken: string | null;
  software: string | null;
  author: string | null;
}

const EXIFR_OPTIONS = { xmp: true, iptc: true, icc: false };

function countFields(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value !== "object") return 1;
  if (value instanceof Date || ArrayBuffer.isView(value) || Array.isArray(value))
    return 1;
  let n = 0;
  for (const v of Object.values(value as Record<string, unknown>)) {
    n += countFields(v);
  }
  return n;
}

function firstString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
    if (Array.isArray(v)) {
      const s = v.find((x) => typeof x === "string" && x.trim());
      if (typeof s === "string") return s.trim();
    }
    if (v && typeof v === "object" && "value" in v) {
      const inner = (v as { value: unknown }).value;
      if (typeof inner === "string" && inner.trim()) return inner.trim();
    }
  }
  return null;
}

function formatDate(...values: unknown[]): string | null {
  for (const v of values) {
    const d =
      v instanceof Date ? v : typeof v === "string" ? new Date(v) : null;
    if (d && !Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d);
    }
  }
  return null;
}

export async function inspectFile(file: Blob): Promise<FileSummary> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(bytes);

  let data: Record<string, unknown> | undefined;
  let extra = 0;

  try {
    if (kind === "webp") {
      const exifPayload = findWebpExifPayload(bytes);
      if (exifPayload) {
        data = await exifr.parse(exifPayload, EXIFR_OPTIONS);
      }
      if (hasWebpXmp(bytes)) extra += 1;
    } else {
      data = await exifr.parse(bytes, EXIFR_OPTIONS);
    }
  } catch {
    data = undefined;
  }

  if (kind === "png") extra += countPngTextChunks(bytes);
  if (kind === "jpeg") extra += countJpegComments(bytes);

  const d = (data ?? {}) as Record<string, unknown>;
  const exifCount = countFields(data);

  return {
    fieldCount: exifCount + extra,
    hasGps:
      d.latitude != null || d.longitude != null || d.GPSLatitude != null,
    hasExif: exifCount > 0,
    device: firstString(d.Model),
    camera: firstString(d.Make),
    taken: formatDate(d.DateTimeOriginal, d.CreateDate, d.ModifyDate),
    software: firstString(d.Software, d.CreatorTool),
    author: firstString(d.Artist, d.creator, d.Creator, d.Byline, d["By-line"]),
  };
}
