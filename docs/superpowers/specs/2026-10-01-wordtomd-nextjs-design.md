# WordToMD — Next.js Migration Spec (2026-10-01)

## 1. Goal
Convert existing static app (`index.html` + `app.js` + `style.css` + `vendor/`) to Next.js App Router + TypeScript + Tailwind, in-place at repo root. Same behavior, 100% client-side, no API routes.

## 2. Decisions
- Scope: in-place replacement (user chose)
- Router: App Router + TS (user chose)
- Libs: npm packages, delete `vendor/` (user chose): mammoth 1.9.1, turndown 7.2.0, turndown-plugin-gfm 1.0.2, marked 12.0.0, jszip 3.10.1, dompurify 3.0.9
- Styling: Tailwind CSS (user chose), port of dropzone/preview/markdown panes
- Approach: single `use client` page + isolated `lib/` units (recommended)

## 3. Architecture
```
app/layout.tsx      # metadata + globals.css
app/page.tsx        # "use client" state machine: idle|converting|done|error
app/globals.css     # tailwind + minimal custom (dropzone drag state)
lib/convert.ts      # htmlToMarkdown(), convertArrayBuffer() — pure, testable
lib/download.ts     # downloadMarkdown(), downloadZip() helpers
components/Dropzone.tsx, Preview.tsx, MarkdownPane.tsx, StatusBar.tsx
tests (vitest): lib/__tests__/convert.test.ts, components smoke
```
No `app/api/`. `next.config.js` default. Deletes: `index.html`, `app.js`, `style.css`, `vendor/`.

## 4. Data flow
File → `arrayBuffer()` → `mammoth.convertToHtml({arrayBuffer}, {styleMap H1-H3, convertImage → images/image-N.ext})` → `TurndownService({headingStyle atx, fenced, bullet -}) + gfm + underline→_x_` → markdown → React state `{markdown, images, fileMeta, status}` → `marked.parse` + `DOMPurify.sanitize` preview → Blob/JSZip downloads.

## 5. Validation preserved
- `.docx` only (reject `.doc`), 50MB limit, empty-html → `"\n"`, `<o:p>` strip, `\n{3,}` collapse
- Status messages identical: "Libraries still loading" N/A (bundled), "Please upload a .docx…", "File too large", "Converting …", "Done." / "No convertible content", "Could not parse…", "Copied…", "Nothing to…"
- Buttons: copyBtn, downloadMdBtn, downloadZipBtn, clearBtn with same enable/disable logic; IDs kept as `id=` for test parity.

## 6. Testing
- `npm test` (vitest run): convert unit (headings, gfm table, underline, image naming, empty input) + IDs present
- `npm run build` + `tsc --noEmit` must pass
- Manual: all 5 sample `.docx` convert identically to old version

## 7. Self-review
- No TBDs. No contradictions (client-only, no API). Scope is single-page port — focused. Unambiguous: npm versions pinned, file deletions explicit.
