import JSZip from "jszip";
import type { ConvertedImage } from "./convert";
import { baseNameNoExt } from "./convert";

export function markdownBlob(markdown: string): Blob {
  return new Blob([markdown], { type: "text/markdown" });
}

export function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}

export function downloadMarkdown(markdown: string, fileLabel: string): void {
  if (!markdown) return;
  const url = URL.createObjectURL(markdownBlob(markdown));
  triggerDownload(url, `${baseNameNoExt(fileLabel)}.md`);
}

export async function downloadZip(
  markdown: string,
  fileLabel: string,
  images: ConvertedImage[],
): Promise<void> {
  if (!markdown) return;
  const base = baseNameNoExt(fileLabel);
  const zip = new JSZip();
  zip.file(`${base}.md`, markdown);
  for (const img of images) zip.file(img.filename, img.buffer);
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(URL.createObjectURL(blob), `${base}.zip`);
}
