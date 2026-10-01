import { lexer, type Token, type Tokens } from "marked";
import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

export const MAX_MD_BYTES = 10 * 1024 * 1024;

export function validateMarkdownInput(name: string, size: number): string | null {
  if (!/\.md$/i.test(name) && !/\.markdown$/i.test(name)) {
    return "Please upload a .md / .markdown file (or paste Markdown below).";
  }
  if (size > MAX_MD_BYTES) return "File too large — 10MB limit.";
  return null;
}

export function docxBaseName(fileLabel: string): string {
  return (
    (fileLabel || "document.md")
      .replace(/\.docx$/i, "")
      .replace(/\.markdown$/i, "")
      .replace(/\.md$/i, "") || "document"
  );
}

type Ctx = { bold?: boolean; italics?: boolean; strike?: boolean };
type InlineChild = TextRun | ExternalHyperlink;

const HEADINGS = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

const numbering = {
  config: [
    {
      reference: "md-ordered",
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.START,
        },
      ],
    },
  ],
};

function walkInline(list: Token[], ctx: Ctx, out: InlineChild[]): void {
  for (const t of list) {
    switch (t.type) {
      case "strong":
        walkInline((t as Tokens.Strong).tokens ?? [], { ...ctx, bold: true }, out);
        break;
      case "em":
        walkInline((t as Tokens.Em).tokens ?? [], { ...ctx, italics: true }, out);
        break;
      case "del":
        walkInline((t as Tokens.Del).tokens ?? [], { ...ctx, strike: true }, out);
        break;
      case "codespan":
        out.push(new TextRun({ text: (t as Tokens.Codespan).text, font: "Courier New", ...ctx }));
        break;
      case "link": {
        const l = t as Tokens.Link;
        out.push(
          new ExternalHyperlink({
            link: l.href,
            children: [new TextRun({ text: l.text || l.href, style: "Hyperlink" })],
          }),
        );
        break;
      }
      case "image":
        out.push(new TextRun({ text: `[image: ${(t as Tokens.Image).text}]`, italics: true }));
        break;
      case "br":
        out.push(new TextRun({ break: 1 }));
        break;
      case "text":
      case "escape": {
        const inner = (t as Tokens.Text).tokens;
        if (inner && inner.length > 0) walkInline(inner, ctx, out);
        else out.push(new TextRun({ text: (t as Tokens.Text).text ?? "", ...ctx }));
        break;
      }
      default: {
        // Block-level wrapper (e.g. paragraph) when lexing a fragment
        const maybe = t as unknown as { tokens?: Token[]; text?: string };
        if (maybe.tokens && maybe.tokens.length > 0) walkInline(maybe.tokens, ctx, out);
        else if (maybe.text) out.push(new TextRun({ text: maybe.text, ...ctx }));
        break;
      }
    }
  }
}

export function runsFromInline(src: string, ctx: Ctx = {}): InlineChild[] {
  const out: InlineChild[] = [];
  walkInline(lexer(src ?? ""), ctx, out);
  return out;
}

function pushBlocks(tokens: Token[], out: (Paragraph | Table)[]): void {
  for (const tok of tokens) {
    switch (tok.type) {
      case "heading": {
        const h = tok as Tokens.Heading;
        out.push(
          new Paragraph({
            heading: HEADINGS[Math.min(Math.max(h.depth, 1), 6) - 1],
            children: runsFromInline(h.text),
          }),
        );
        break;
      }
      case "paragraph":
        out.push(new Paragraph({ children: runsFromInline((tok as Tokens.Paragraph).text) }));
        break;
      case "text": {
        const inner = (tok as Tokens.Text).tokens;
        if (inner && inner.length > 0) {
          const children: InlineChild[] = [];
          walkInline(inner, {}, children);
          out.push(new Paragraph({ children }));
        } else if ((tok as Tokens.Text).text) {
          out.push(new Paragraph({ children: [new TextRun({ text: (tok as Tokens.Text).text })] }));
        }
        break;
      }
      case "blockquote": {
        const b = tok as Tokens.Blockquote;
        for (const inner of b.tokens ?? []) {
          if (inner.type === "paragraph") {
            out.push(
              new Paragraph({
                style: "IntenseQuote",
                children: runsFromInline((inner as Tokens.Paragraph).text),
              }),
            );
          } else {
            // Nested lists/tables inside quotes convert as normal blocks
            pushBlocks([inner], out);
          }
        }
        break;
      }
      case "code": {
        const lines = (tok as Tokens.Code).text.split("\n");
        for (const line of lines) {
          out.push(
            new Paragraph({
              children: [new TextRun({ text: line || " ", font: "Courier New", size: 20 })],
            }),
          );
        }
        break;
      }
      case "hr":
        out.push(new Paragraph({ thematicBreak: true }));
        break;
      case "list": {
        const l = tok as Tokens.List;
        for (const item of l.items) {
          const children = runsFromInline((item as Tokens.ListItem).text ?? "");
          out.push(
            l.ordered
              ? new Paragraph({ numbering: { reference: "md-ordered", level: 0 }, children })
              : new Paragraph({ bullet: { level: 0 }, children }),
          );
        }
        break;
      }
      case "table": {
        const t = tok as Tokens.Table;
        const rows: TableRow[] = [
          new TableRow({
            children: t.header.map(
              (h) =>
                new TableCell({
                  children: [new Paragraph({ children: runsFromInline(h.text, { bold: true }) })],
                }),
            ),
          }),
          ...t.rows.map(
            (row) =>
              new TableRow({
                children: row.map(
                  (c) =>
                    new TableCell({
                      children: [new Paragraph({ children: runsFromInline(c.text) })],
                    }),
                ),
              }),
          ),
        ];
        out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
        break;
      }
      case "space":
      default:
        break;
    }
  }
}

export function markdownToDocxChildren(markdown: string): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  pushBlocks(lexer(markdown ?? ""), out);
  if (out.length === 0) out.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  return out;
}

export async function markdownToDocxBlob(markdown: string): Promise<Blob> {
  const doc = new Document({
    numbering,
    sections: [{ children: markdownToDocxChildren(markdown) }],
  });
  return Packer.toBlob(doc);
}

export function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}

export async function downloadDocx(markdown: string, fileLabel: string): Promise<void> {
  if (!markdown.trim()) return;
  const blob = await markdownToDocxBlob(markdown);
  triggerDownload(URL.createObjectURL(blob), `${docxBaseName(fileLabel)}.docx`);
}
