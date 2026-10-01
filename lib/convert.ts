import mammoth from "mammoth";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

export interface ConvertedImage {
  filename: string;
  contentType: string;
  buffer: ArrayBuffer;
}

export interface ConvertResult {
  markdown: string;
  html: string;
  images: ConvertedImage[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[];
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function isDocxName(name: string): boolean {
  return /\.docx$/i.test(name);
}

export function validateFile(name: string, size: number): string | null {
  if (!isDocxName(name)) return "Please upload a .docx file (.doc not supported in v1).";
  if (size > MAX_FILE_BYTES) return "File too large — 50MB limit.";
  return null;
}

function buildTurndown(): TurndownService {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  try {
    if (gfm) td.use(gfm);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    /* GFM plugin optional — core conversion still works */
  }
  td.addRule("underline", {
    filter: ["u"],
    replacement: (content: string) => `_${content}_`,
  });
  return td;
}

export function htmlToMarkdown(html: string): string {
  if (!html) return "\n";
  const clean = html.replace(/<o:p>.*?<\/o:p>/g, "");
  return (
    buildTurndown().turndown(clean).replace(/\n{3,}/g, "\n\n").trim() + "\n"
  );
}

export async function convertArrayBuffer(
  arrayBuffer: ArrayBuffer,
): Promise<ConvertResult> {
  const images: ConvertedImage[] = [];
  let counter = 0;
  const out = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convertImage: mammoth.images.imgElement(async (img: any) => {
        counter += 1;
        const buf: ArrayBuffer = await img.readAsArrayBuffer();
        const ext = ((img.contentType || "image/png").split("/")[1] || "png").split("+")[0];
        const filename = `images/image-${counter}.${ext}`;
        images.push({ filename, contentType: img.contentType, buffer: buf });
        return { src: filename };
      }),
    },
  );
  const markdown = htmlToMarkdown(out.value);
  return { markdown, html: out.value, images: [...images], messages: out.messages };
}

export function baseNameNoExt(fileMetaFirst: string): string {
  return (fileMetaFirst || "document.docx")
    .replace(/\.docx$/i, "")
    .replace(/\.markdown$/i, "")
    .replace(/\.md$/i, "");
}
