# WordToMD
Next.js (App Router + TypeScript + Tailwind + shadcn-style UI) two-way converter: Word (.docx) ⇄ Markdown. No backend, runs 100% in browser.
## Run
bun install
bun run dev
# open http://localhost:3000
## Use
- **Word → Markdown tab:** drag a .docx onto the dropzone (or Choose file). Read the Preview, copy from the Markdown pane. Download .md, or .zip (md + images/).
- **Markdown → Word tab:** drag a .md file (or paste Markdown). Download .docx (or copy / download the .md source).
## Test
bun run test
bun run typecheck
bun run build
Manual: try all 5 sample .docx files, check headings/tables/images; paste Markdown with headings/lists/tables/code and check the .docx output.
## Deploy
Any Node host or static export: `bun run build && bun run start`. For GitHub Pages / Netlify static, `next build` output in `.next/`.
## Libraries (bun, bundled)
- mammoth 1.9.1 (docx → html)
- turndown 7.2.0 + turndown-plugin-gfm 1.0.2 (html → markdown)
- marked 12.0.0 (markdown preview + md → docx parsing)
- docx 9.x (markdown → .docx generation)
- jszip 3.10.1 (md + images zip)
- dompurify 3.0.9 (preview sanitizing)
- shadcn-style UI: class-variance-authority, clsx, tailwind-merge, lucide-react, @radix-ui/react-slot, @radix-ui/react-tabs, tailwindcss-animate
## Structure
- `app/page.tsx` — client page with Word→MD / Markdown→Word tabs
- `app/layout.tsx`, `app/globals.css` — shell + Tailwind + shadcn theme tokens
- `components/Navbar.tsx` — sticky navbar
- `components/ui/` — button, card, tabs, textarea (shadcn-style)
- `components/` — Dropzone, Preview, MarkdownPane, StatusBar
- `lib/convert.ts` — mammoth → turndown pipeline (pure, unit-tested)
- `lib/md-to-docx.ts` — marked lexer → docx Document (pure, unit-tested)
- `lib/download.ts` — .md / .zip / .docx download helpers
## Notes
- Markdown → Word supports headings, bold/italic/strikethrough, inline code, code blocks, bullet/ordered lists, GFM tables, blockquotes, links, hr. Markdown images become `[image: alt]` placeholders (not embedded) in v1.
# DocumentConverter
