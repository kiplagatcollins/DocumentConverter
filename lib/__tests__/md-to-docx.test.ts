import { describe, expect, it } from "vitest";
import { Paragraph, Table, TextRun } from "docx";
import {
  docxBaseName,
  markdownToDocxBlob,
  markdownToDocxChildren,
  runsFromInline,
  validateMarkdownInput,
} from "../md-to-docx";

describe("validateMarkdownInput", () => {
  it("accepts .md and .markdown", () => {
    expect(validateMarkdownInput("notes.md", 100)).toBeNull();
    expect(validateMarkdownInput("NOTES.MD", 100)).toBeNull();
    expect(validateMarkdownInput("doc.markdown", 100)).toBeNull();
  });

  it("rejects non-markdown files", () => {
    expect(validateMarkdownInput("notes.txt", 100)).toMatch(/\.md/);
    expect(validateMarkdownInput("doc.docx", 100)).toMatch(/\.md/);
  });

  it("rejects files over 10MB", () => {
    expect(validateMarkdownInput("big.md", 11 * 1024 * 1024)).toMatch(/10MB/);
  });
});

describe("docxBaseName", () => {
  it("strips markdown extensions", () => {
    expect(docxBaseName("notes.md")).toBe("notes");
    expect(docxBaseName("doc.markdown")).toBe("doc");
    expect(docxBaseName("report.docx")).toBe("report");
  });
});

describe("runsFromInline", () => {
  it("produces runs for formatted text", () => {
    const runs = runsFromInline("hello **bold** and *it*");
    expect(runs.length).toBeGreaterThan(0);
    expect(runs.every((r) => r instanceof TextRun || r !== undefined)).toBe(true);
  });

  it("handles links and code", () => {
    const runs = runsFromInline("[x](https://example.com) `code`");
    expect(runs.length).toBeGreaterThan(0);
  });
});

describe("markdownToDocxChildren", () => {
  it("maps headings, paragraphs, lists, tables, code", () => {
    const md = [
      "# Title",
      "",
      "Some **bold** text.",
      "",
      "- a",
      "- b",
      "",
      "1. one",
      "2. two",
      "",
      "| a | b |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      "```",
      "code()",
      "```",
      "",
      "> quote",
      "",
      "---",
      "",
    ].join("\n");
    const children = markdownToDocxChildren(md);
    expect(children.length).toBeGreaterThan(8);
    expect(children.some((c) => c instanceof Table)).toBe(true);
    expect(children.every((c) => c instanceof Paragraph || c instanceof Table)).toBe(true);
  });

  it("returns a placeholder for empty input", () => {
    const children = markdownToDocxChildren("   ");
    expect(children.length).toBe(1);
    expect(children[0]).toBeInstanceOf(Paragraph);
  });
});

describe("markdownToDocxBlob", () => {
  it("builds a valid .docx (zip) blob", async () => {
    const blob = await markdownToDocxBlob("# Hi\n\nHello **world**.\n");
    expect(blob.size).toBeGreaterThan(1000);
    const buf = Buffer.from(await blob.arrayBuffer());
    // OOXML is a zip: starts with PK
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });
});
