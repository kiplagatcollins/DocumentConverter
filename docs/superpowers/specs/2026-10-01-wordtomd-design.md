# WordToMD — Design Spec (2026-10-01)

## 1. Goal
Static web app (no backend) that converts a single `.docx` to Markdown with full fidelity, live preview, copy + download. Greenfield in `wordtomd/`, validated against 5 existing sample `.docx` files.

## 2. Decisions (from brainstorming)
- App type: Web app (user chose)
- Stack: No backend — pure HTML/CSS/JS, CDN + vendored fallback (user chose)
- Scope: Full fidelity — headings, bold/italic, lists, tables, images, links (user chose)
- V1 extras: Single file + preview only, no batch (user chose)
- Approach: A — vanilla `index.html` + `app.js` + `style.css` with mammoth.js + Turndown GFM (recommended over Vite build and over mammoth-only markdown)

## 3. Architecture
```
wordtomd/
  index.html
  app.js
  style.css
  vendor/ (mammoth.browser.min.js, turndown.js, turndown-plugin-gfm.js, jszip.min.js, marked.min.js)
  README.md
  docs/superpowers/specs/2026-10-01-wordtomd-design.md (this file)
```
Zero build step. Run via `python3 -m http.server`. Deploy to GitHub Pages / Netlify static. No server, no storage; all conversion in-browser via FileReader + ArrayBuffer.

## 4. Components
1. **Dropzone + FileInput** — drag-drop + click to browse, accepts `.docx` only (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), 50MB limit. Shows filename/size, drag-over state, mobile tap support.
2. **Conversion engine** — `mammoth.convertToHtml({arrayBuffer}, {styleMap, convertImage})` → HTML string → `TurndownService({headingStyle:'atx', codeBlockStyle:'fenced', gfm extensions: tables, strikethrough, taskList})` → Markdown string. StyleMap maps Word Heading1-6 → h1-h6, preserves bold/italic/underline-as-em.
3. **Image handler** — `convertImage: mammoth.images.imgElement→base64`. Store `{filename, dataUrl, buffer}`. In Markdown emit `![image-N.png](images/image-N.png)`. In preview use blob/data URLs. On "Download .zip", bundle `.md` + `images/` via JSZip.
4. **Preview pane** — two tabs/panes: Rendered (via `marked` or `markdown-it`) + Raw Markdown (textarea + `<pre><code>` with copy button). Live update on conversion.
5. **Actions bar** — Copy Markdown, Download `.md`, Download `.zip` (md+images), Clear/Reset. Status/toast area for errors.

## 5. Data flow
1. User drops/selects `file.docx` → validate extension/MIME/size.
2. `file.arrayBuffer()` → `mammoth.convertToHtml` with image callback collecting images (async).
3. HTML → Turndown + GFM → markdown string.
4. Render markdown → HTML preview (sanitized), fill raw textarea, enable buttons, show word/char stats.
5. Download `.md`: Blob `text/markdown`. Download `.zip`: JSZip with md + images. Copy: `navigator.clipboard.writeText` with fallback.

## 6. Error handling
- Wrong type (not .docx/.doc): toast "Please upload a .docx file (.doc not supported in v1)".
- Corrupt/encrypted docx: catch mammoth exception → "Could not parse this file. Try re-saving in Word."
- Empty doc: "No convertible content found."
- >50MB: reject upfront with size message.
- Image failure: fallback to skip image + warning, still emit rest of doc.
- Clipboard denied: fallback `execCommand('copy')` + manual select instruction.

## 7. Testing
- Manual matrix using repo samples: proposal.docx (headings/lists), SDD.docx (large, tables/images stress), SRS.docx, user manual.docx, FLOWER E.docx (small).
- Checks: headings map to `#`, tables to GFM pipes, bold/italic preserved, images counted and downloadable, links preserved.
- Smoke: drag-drop, browse, copy, download md, download zip, clear, mobile width 360px, offline (vendored libs).
- No automated test framework in v1 (YAGNI for static page); add Vitest later if batch/CLI added.

## 8. Non-goals (v1)
- No `.doc` (old binary), `.pdf`, `.odt` support.
- No batch/multi-file, no server, no auth, no persistence.
- No custom style mapping UI.

## 9. Open choices locked for implementation
- Turndown GFM for tables (not mammoth-only markdown).
- Images as separate `images/` + JSZip (not inline base64 in md by default).
- Vanilla JS (no Vite/React/Tailwind) for zero-build.

---
Approved direction: Approach A, single-file preview. Proceed to implementation plan.
