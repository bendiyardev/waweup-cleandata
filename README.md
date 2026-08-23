# CleanData — by WaweUp

Remove hidden metadata before sharing. A single-purpose, privacy-first tool page:
upload a photo, inspect its hidden metadata (EXIF, GPS, device, dates, software,
author), clean it, and download the clean file. Everything runs locally in the
browser — no file ever leaves the device.

**Domain:** https://cleandata.waweup.com

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Geist / Geist Mono
- [exifr](https://github.com/MikeKovarik/exifr) for metadata inspection
- Custom byte-level strippers for cleaning (no re-encoding, no quality loss)

## How cleaning works

`lib/formats.ts` rewrites the file at the byte level:

- **JPEG** — drops APPn metadata segments (EXIF, XMP, IPTC/Photoshop), comments,
  and any trailing data after EOI (e.g. embedded motion-photo video). Keeps
  JFIF, ICC profile and Adobe color-transform segments so the image renders
  identically.
- **PNG** — keeps only chunks required for rendering (whitelist); drops
  `tEXt`/`zTXt`/`iTXt`/`tIME`/`eXIf` and unknown chunks.
- **WebP** — drops `EXIF` and `XMP ` RIFF chunks and clears the corresponding
  VP8X flags.

If structural parsing fails, it falls back to a canvas re-encode.
`lib/metadata.ts` (exifr) inspects the file before and after so the UI can show
a real before/after field count.

## Development

```bash
npm install
npm run dev
```

Deploy as a standalone Vercel project — no configuration needed.
