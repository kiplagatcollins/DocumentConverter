import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  htmlToMarkdown,
  validateFile,
  isDocxName,
  baseNameNoExt,
} from "../convert";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("htmlToMarkdown", () => {
  it("returns newline for empty input", () => {
    expect(htmlToMarkdown("")).toBe("\n");
  });

  it("converts headings to atx style", () => {
    expect(htmlToMarkdown("<h1>Hello</h1>").trim()).toBe("# Hello");
    expect(htmlToMarkdown("<h2>Sub</h2>").trim()).toBe("## Sub");
    expect(htmlToMarkdown("<h3>Sub3</h3>").trim()).toBe("### Sub3");
  });

  it("preserves bold and italic", () => {
    const md = htmlToMarkdown("<p><strong>bold</strong> and <em>it</em></p>");
    expect(md).toContain("**bold**");
    expect(md).toMatch(/[*_]it[*_]/);
  });

  it("converts underline to emphasis (legacy app.js rule)", () => {
    expect(htmlToMarkdown("<p><u>under</u></p>").trim()).toBe("_under_");
  });

  it("strips Word <o:p> tags", () => {
    const md = htmlToMarkdown("<p>hi</p><o:p>junk</o:p>");
    expect(md).not.toContain("o:p");
    expect(md).toContain("hi");
  });

  it("collapses 3+ newlines", () => {
    const md = htmlToMarkdown("<p>a</p><p>b</p><p>c</p><p>d</p>");
    expect(md).not.toMatch(/\n{3,}/);
  });

  it("converts GFM tables", () => {
    const md = htmlToMarkdown(
      "<table><thead><tr><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>",
    );
    expect(md).toContain("|");
    expect(md).toContain("a");
  });
});

describe("file validation (parity with app.js guards)", () => {
  it("accepts .docx case-insensitively", () => {
    expect(isDocxName("doc.docx")).toBe(true);
    expect(isDocxName("DOC.DOCX")).toBe(true);
  });

  it("rejects .doc", () => {
    expect(validateFile("old.doc", 100)).toMatch(/\.docx/);
  });

  it("rejects files over 50MB", () => {
    expect(validateFile("big.docx", 51 * 1024 * 1024)).toMatch(/50MB/);
  });

  it("accepts a normal docx", () => {
    expect(validateFile("ok.docx", 1024)).toBeNull();
  });
});

describe("baseNameNoExt", () => {
  it("strips .docx extension", () => {
    expect(baseNameNoExt("report.docx")).toBe("report");
    expect(baseNameNoExt("document.docx")).toBe("document");
  });
});

describe("page shell (parity with legacy test_shell)", () => {
  it("keeps required element IDs", () => {
    const page = readFileSync(join(ROOT, "app", "page.tsx"), "utf8");
    const drop = readFileSync(join(ROOT, "components", "Dropzone.tsx"), "utf8");
    const pane = readFileSync(join(ROOT, "components", "MarkdownPane.tsx"), "utf8");
    const status = readFileSync(join(ROOT, "components", "StatusBar.tsx"), "utf8");
    const preview = readFileSync(join(ROOT, "components", "Preview.tsx"), "utf8");
    const all = page + drop + pane + status + preview;
    for (const id of [
      "dropzone",
      "fileInput",
      "fileMeta",
      "status",
      "preview",
      "rawOutput",
      "copyBtn",
      "downloadMdBtn",
      "downloadZipBtn",
      "clearBtn",
    ]) {
      expect(all, `missing #${id}`).toContain(id);
    }
  });

  it("sanitizes preview with DOMPurify", () => {
    const page = readFileSync(join(ROOT, "app", "page.tsx"), "utf8");
    expect(page).toContain("DOMPurify");
    expect(page).toContain("sanitize");
  });

  it("wires mammoth + turndown + gfm + images", () => {
    const lib = readFileSync(join(ROOT, "lib", "convert.ts"), "utf8");
    expect(lib).toContain("mammoth.convertToHtml");
    expect(lib).toContain("TurndownService");
    expect(lib).toContain("gfm");
    expect(lib).toContain("convertImage");
    expect(lib).toContain('image/png');
  });
});

describe("sample docs still present", () => {
  it("at least one .docx sample exists", async () => {
    const { readdirSync } = await import("node:fs");
    const files = readdirSync(ROOT).filter((f) => f.endsWith(".docx"));
    expect(files.length).toBeGreaterThanOrEqual(1);
  });

  it("status messages preserved", () => {
    const page = readFileSync(join(ROOT, "app", "page.tsx"), "utf8");
    const lib = readFileSync(join(ROOT, "lib", "convert.ts"), "utf8");
    const all = page + lib;
    for (const msg of [
      "Please upload a .docx file",
      "File too large",
      "Converting",
      "Done.",
      "Could not parse this file",
    ]) {
      expect(all, `missing status: ${msg}`).toContain(msg);
    }
  });

  it("package.json uses npm libs (no vendor/)", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    for (const dep of ["mammoth", "turndown", "marked", "jszip", "dompurify"]) {
      expect(pkg.dependencies, `missing dep ${dep}`).toHaveProperty(dep);
    }
    expect(existsSync(join(ROOT, "vendor", "mammoth.browser.min.js"))).toBe(false);
  });
});
