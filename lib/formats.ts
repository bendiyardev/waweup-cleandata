// Byte-level metadata stripping for JPEG, PNG and WebP.
// Pixel data is copied verbatim — no re-encoding, no quality loss.

export type FileKind = "jpeg" | "png" | "webp";

export interface CleanOutcome {
  blob: Blob;
  removed: number;
}

export function detectKind(b: Uint8Array): FileKind | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
    return "jpeg";
  if (
    b.length > 8 &&
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47
  )
    return "png";
  if (b.length > 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP")
    return "webp";
  return null;
}

export function mimeFor(kind: FileKind): string {
  return kind === "jpeg"
    ? "image/jpeg"
    : kind === "png"
      ? "image/png"
      : "image/webp";
}

function ascii(b: Uint8Array, off: number, len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += String.fromCharCode(b[off + i]);
  return s;
}

function payloadStartsWith(b: Uint8Array, off: number, text: string): boolean {
  if (off + text.length > b.length) return false;
  for (let i = 0; i < text.length; i++) {
    if (b[off + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function concat(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ---------------------------------------------------------------------------
// JPEG
// ---------------------------------------------------------------------------

// APPn payloads that must survive for the image to render correctly.
function keepJpegApp(marker: number, b: Uint8Array, payloadOff: number): boolean {
  if (marker === 0xe0) return true; // APP0: JFIF / JFXX
  if (marker === 0xe2) return payloadStartsWith(b, payloadOff, "ICC_PROFILE\0");
  if (marker === 0xee) return payloadStartsWith(b, payloadOff, "Adobe"); // color transform
  return false;
}

function cleanJpeg(b: Uint8Array): {
  data: Uint8Array<ArrayBuffer>;
  removed: number;
} {
  const parts: Uint8Array[] = [b.subarray(0, 2)]; // SOI
  let removed = 0;
  let i = 2;
  let sawEoi = false;

  while (i + 1 < b.length) {
    if (b[i] !== 0xff) throw new Error("invalid jpeg structure");
    // skip fill bytes
    while (i + 1 < b.length && b[i + 1] === 0xff) i++;
    const marker = b[i + 1];

    if (marker === 0xd9) {
      // EOI — anything after (e.g. embedded motion-photo video) is dropped.
      parts.push(b.subarray(i, i + 2));
      if (i + 2 < b.length) removed++;
      sawEoi = true;
      break;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      parts.push(b.subarray(i, i + 2));
      i += 2;
      continue;
    }

    if (i + 3 >= b.length) throw new Error("truncated jpeg segment");
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2) throw new Error("invalid jpeg segment length");
    const segEnd = Math.min(i + 2 + len, b.length);

    const isApp = marker >= 0xe0 && marker <= 0xef;
    const isCom = marker === 0xfe;
    if (isApp || isCom) {
      if (isApp && keepJpegApp(marker, b, i + 4)) {
        parts.push(b.subarray(i, segEnd));
      } else {
        removed++;
      }
      i = segEnd;
      continue;
    }

    parts.push(b.subarray(i, segEnd));
    i = segEnd;

    if (marker === 0xda) {
      // entropy-coded data: copy until the next real marker
      let j = i;
      while (j + 1 < b.length) {
        if (
          b[j] === 0xff &&
          b[j + 1] !== 0x00 &&
          b[j + 1] !== 0xff &&
          !(b[j + 1] >= 0xd0 && b[j + 1] <= 0xd7)
        ) {
          break;
        }
        j++;
      }
      if (j + 1 >= b.length) j = b.length;
      parts.push(b.subarray(i, j));
      i = j;
    }
  }

  if (!sawEoi) parts.push(new Uint8Array([0xff, 0xd9]));
  return { data: concat(parts), removed };
}

export function countJpegComments(b: Uint8Array): number {
  let count = 0;
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) break;
    while (i + 1 < b.length && b[i + 1] === 0xff) i++;
    const marker = b[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // stop at image data
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const len = (b[i + 2] << 8) | b[i + 3];
    if (len < 2) break;
    if (marker === 0xfe) count++;
    i += 2 + len;
  }
  return count;
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const PNG_KEEP = new Set([
  "IHDR",
  "PLTE",
  "IDAT",
  "IEND",
  "tRNS",
  "gAMA",
  "cHRM",
  "sRGB",
  "iCCP",
  "sBIT",
  "bKGD",
  "pHYs",
  "hIST",
  "sPLT",
  "acTL",
  "fcTL",
  "fdAT",
]);

const PNG_TEXT = new Set(["tEXt", "zTXt", "iTXt", "tIME", "eXIf"]);

interface PngChunk {
  type: string;
  start: number;
  end: number;
}

function* pngChunks(b: Uint8Array): Generator<PngChunk> {
  let i = 8;
  while (i + 8 <= b.length) {
    const len =
      ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    const type = ascii(b, i + 4, 4);
    const end = i + 12 + len;
    if (end > b.length) return;
    yield { type, start: i, end };
    i = end;
    if (type === "IEND") return;
  }
}

function cleanPng(b: Uint8Array): {
  data: Uint8Array<ArrayBuffer>;
  removed: number;
} {
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  let removed = 0;
  let sawEnd = false;
  for (const chunk of pngChunks(b)) {
    if (PNG_KEEP.has(chunk.type)) {
      parts.push(b.subarray(chunk.start, chunk.end));
    } else {
      removed++;
    }
    if (chunk.type === "IEND") sawEnd = true;
  }
  if (!sawEnd) throw new Error("invalid png structure");
  return { data: concat(parts), removed };
}

export function countPngTextChunks(b: Uint8Array): number {
  let count = 0;
  for (const chunk of pngChunks(b)) {
    if (chunk.type === "eXIf") continue; // parsed separately via exifr
    if (PNG_TEXT.has(chunk.type) || !PNG_KEEP.has(chunk.type)) count++;
  }
  return count;
}

// ---------------------------------------------------------------------------
// WebP
// ---------------------------------------------------------------------------

interface RiffChunk {
  fourcc: string;
  start: number;
  end: number;
  dataStart: number;
  size: number;
}

function* webpChunks(b: Uint8Array): Generator<RiffChunk> {
  let i = 12;
  while (i + 8 <= b.length) {
    const fourcc = ascii(b, i, 4);
    const size = (b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24)) >>> 0;
    const end = Math.min(i + 8 + size + (size % 2), b.length);
    yield { fourcc, start: i, end, dataStart: i + 8, size };
    i = end;
  }
}

function cleanWebp(b: Uint8Array): {
  data: Uint8Array<ArrayBuffer>;
  removed: number;
} {
  const parts: Uint8Array[] = [];
  let removed = 0;
  for (const chunk of webpChunks(b)) {
    if (chunk.fourcc === "EXIF" || chunk.fourcc === "XMP ") {
      removed++;
      continue;
    }
    if (chunk.fourcc === "VP8X") {
      const copy = new Uint8Array(b.subarray(chunk.start, chunk.end));
      copy[8] &= ~0x0c; // clear EXIF (0x08) and XMP (0x04) flags
      parts.push(copy);
    } else {
      parts.push(b.subarray(chunk.start, chunk.end));
    }
  }
  const body = concat(parts);
  const header = new Uint8Array(12);
  header.set([0x52, 0x49, 0x46, 0x46]); // RIFF
  const riffSize = body.length + 4;
  header[4] = riffSize & 0xff;
  header[5] = (riffSize >> 8) & 0xff;
  header[6] = (riffSize >> 16) & 0xff;
  header[7] = (riffSize >> 24) & 0xff;
  header.set([0x57, 0x45, 0x42, 0x50], 8); // WEBP
  return { data: concat([header, body]), removed };
}

export function findWebpExifPayload(b: Uint8Array): Uint8Array | null {
  for (const chunk of webpChunks(b)) {
    if (chunk.fourcc === "EXIF") {
      let off = chunk.dataStart;
      if (payloadStartsWith(b, off, "Exif\0\0")) off += 6;
      return b.subarray(off, chunk.dataStart + chunk.size);
    }
  }
  return null;
}

export function hasWebpXmp(b: Uint8Array): boolean {
  for (const chunk of webpChunks(b)) {
    if (chunk.fourcc === "XMP ") return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function cleanFile(file: File): Promise<CleanOutcome> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detectKind(bytes);
  try {
    if (kind === "jpeg") {
      const r = cleanJpeg(bytes);
      return { blob: new Blob([r.data], { type: "image/jpeg" }), removed: r.removed };
    }
    if (kind === "png") {
      const r = cleanPng(bytes);
      return { blob: new Blob([r.data], { type: "image/png" }), removed: r.removed };
    }
    if (kind === "webp") {
      const r = cleanWebp(bytes);
      return { blob: new Blob([r.data], { type: "image/webp" }), removed: r.removed };
    }
  } catch {
    // structural parse failed — fall back to re-encoding below
  }
  return canvasClean(file, kind);
}

// Fallback: re-encode through a canvas. Strips everything, at the cost of
// re-compression. Only used when byte-level parsing fails.
async function canvasClean(file: File, kind: FileKind | null): Promise<CleanOutcome> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const type = kind ? mimeFor(kind) : "image/png";
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
      type,
      0.92,
    ),
  );
  return { blob, removed: 1 };
}
