"use client";

import { useCallback, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ArrowRightLeft, Copy, Download, Eraser, FileDown } from "lucide-react";
import Navbar from "../components/Navbar";
import Dropzone from "../components/Dropzone";
import StatusBar from "../components/StatusBar";
import Preview from "../components/Preview";
import MarkdownPane from "../components/MarkdownPane";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  convertArrayBuffer,
  validateFile,
  type ConvertedImage,
} from "../lib/convert";
import { downloadMarkdown, downloadZip } from "../lib/download";
import { downloadDocx, validateMarkdownInput } from "../lib/md-to-docx";

export default function Home() {
  // ---- Word -> Markdown state ----
  const [markdown, setMarkdown] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [images, setImages] = useState<ConvertedImage[]>([]);
  const [fileLabel, setFileLabel] = useState("");
  const [fileMeta, setFileMeta] = useState("");
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  // ---- Markdown -> Word state ----
  const [mdInput, setMdInput] = useState("");
  const [mdFileLabel, setMdFileLabel] = useState("");
  const [mdFileMeta, setMdFileMeta] = useState("");
  const [mdStatus, setMdStatus] = useState("");
  const [mdDragging, setMdDragging] = useState(false);
  const [mdBusy, setMdBusy] = useState(false);

  const hasResult = markdown.length > 0;
  const hasMdInput = mdInput.trim().length > 0;

  const renderPreview = useCallback((md: string) => {
    try {
      const html = marked.parse(md) as string;
      setPreviewHtml(DOMPurify.sanitize(html));
    } catch {
      setPreviewHtml(`<pre>${md.replace(/</g, "&lt;")}</pre>`);
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file || busy) return;
      const err = validateFile(file.name, file.size);
      if (err) {
        setStatus(err);
        return;
      }
      setBusy(true);
      setStatus(`Converting ${file.name}...`);
      try {
        const buf = await file.arrayBuffer();
        const res = await convertArrayBuffer(buf);
        setMarkdown(res.markdown);
        setImages(res.images);
        setFileLabel(file.name);
        setFileMeta(
          `${file.name} — ${(file.size / 1024).toFixed(1)} KB, ${res.images.length} image(s)`,
        );
        setStatus(res.markdown.trim() ? "Done." : "No convertible content found.");
        renderPreview(res.markdown);
      } catch (e) {
        console.error(e);
        setStatus("Could not parse this file. Try re-saving it in Word as .docx.");
      } finally {
        setBusy(false);
      }
    },
    [busy, renderPreview],
  );

  const handleCopy = useCallback(async () => {
    if (!markdown) {
      setStatus("Nothing to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus("Copied to clipboard.");
    } catch {
      try {
        const ta = document.getElementById("rawOutput") as HTMLTextAreaElement | null;
        ta?.select();
        document.execCommand("copy");
        setStatus("Copied to clipboard.");
      } catch {
        setStatus("Copy blocked — select the text manually.");
      }
    }
  }, [markdown]);

  const handleDownloadMd = useCallback(() => {
    if (!markdown) {
      setStatus("Nothing to download yet.");
      return;
    }
    downloadMarkdown(markdown, fileLabel || "document.docx");
  }, [markdown, fileLabel]);

  const handleDownloadZip = useCallback(async () => {
    if (!markdown) {
      setStatus("Nothing to download yet.");
      return;
    }
    await downloadZip(markdown, fileLabel || "document.docx", images);
  }, [markdown, fileLabel, images]);

  const handleClear = useCallback(() => {
    setMarkdown("");
    setPreviewHtml("");
    setImages([]);
    setFileLabel("");
    setFileMeta("");
    setStatus("");
    const fi = document.getElementById("fileInput") as HTMLInputElement | null;
    if (fi) fi.value = "";
  }, []);

  // ---- Markdown -> Word handlers ----
  const handleMdFile = useCallback(
    async (file: File) => {
      if (!file || mdBusy) return;
      const err = validateMarkdownInput(file.name, file.size);
      if (err) {
        setMdStatus(err);
        return;
      }
      setMdBusy(true);
      setMdStatus(`Reading ${file.name}...`);
      try {
        const text = await file.text();
        setMdInput(text);
        setMdFileLabel(file.name);
        setMdFileMeta(`${file.name} — ${(file.size / 1024).toFixed(1)} KB`);
        setMdStatus(text.trim() ? "Loaded. Edit below if needed, then download." : "File is empty — paste Markdown below.");
      } catch (e) {
        console.error(e);
        setMdStatus("Could not read this file. Try pasting the Markdown below.");
      } finally {
        setMdBusy(false);
      }
    },
    [mdBusy],
  );

  const handleDownloadDocx = useCallback(async () => {
    if (!mdInput.trim()) {
      setMdStatus("Nothing to download yet.");
      return;
    }
    setMdBusy(true);
    setMdStatus("Building .docx...");
    try {
      await downloadDocx(mdInput, mdFileLabel || "document.md");
      setMdStatus("Done.");
    } catch (e) {
      console.error(e);
      setMdStatus("Could not build this file. Check the Markdown and try again.");
    } finally {
      setMdBusy(false);
    }
  }, [mdInput, mdFileLabel]);

  const handleMdClear = useCallback(() => {
    setMdInput("");
    setMdFileLabel("");
    setMdFileMeta("");
    setMdStatus("");
    const fi = document.getElementById("mdFileInput") as HTMLInputElement | null;
    if (fi) fi.value = "";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="w2m" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="w2m">Word → Markdown</TabsTrigger>
            <TabsTrigger value="m2w">Markdown → Word</TabsTrigger>
          </TabsList>

          <TabsContent value="w2m">
            <div className="mt-4">
              <Dropzone
                fileMeta={fileMeta}
                dragging={dragging}
                accept=".docx"
                hint="Drag & drop a .docx here or"
                onDrag={setDragging}
                onFile={handleFile}
              />
              <div className="mt-2">
                <StatusBar message={status} />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Preview html={previewHtml} empty={!markdown} />
                <MarkdownPane
                  markdown={markdown}
                  hasResult={hasResult}
                  onCopy={handleCopy}
                  onDownloadMd={handleDownloadMd}
                  onDownloadZip={handleDownloadZip}
                  onClear={handleClear}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="m2w">
            <div className="mt-4">
              <Dropzone
                fileMeta={mdFileMeta}
                dragging={mdDragging}
                accept=".md,.markdown"
                inputId="mdFileInput"
                zoneId="mdDropzone"
                metaId="mdFileMeta"
                hint="Drag & drop a .md file here, or paste below"
                onDrag={setMdDragging}
                onFile={handleMdFile}
              />
              <div className="mt-2">
                <StatusBar message={mdStatus} />
              </div>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowRightLeft className="h-4 w-4" />
                    Markdown source
                  </CardTitle>
                  <CardDescription>
                    Paste or load Markdown, then download a .docx. Supports headings,
                    bold/italic, lists, tables, code and links.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="mdInput"
                    value={mdInput}
                    onChange={(e) => setMdInput(e.target.value)}
                    placeholder="# Paste Markdown here..."
                    className="min-h-[300px] font-mono"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      id="copyMdBtn"
                      size="sm"
                      variant="secondary"
                      disabled={!hasMdInput}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(mdInput);
                          setMdStatus("Copied to clipboard.");
                        } catch {
                          setMdStatus("Copy blocked — select the text manually.");
                        }
                      }}
                    >
                      <Copy /> Copy
                    </Button>
                    <Button
                      id="downloadDocxBtn"
                      size="sm"
                      disabled={!hasMdInput || mdBusy}
                      onClick={handleDownloadDocx}
                    >
                      <FileDown /> Download .docx
                    </Button>
                    <Button
                      id="downloadMdSrcBtn"
                      size="sm"
                      variant="secondary"
                      disabled={!hasMdInput}
                      onClick={() => downloadMarkdown(mdInput, mdFileLabel || "document.md")}
                    >
                      <Download /> Download .md
                    </Button>
                    <Button
                      id="mdClearBtn"
                      size="sm"
                      variant="ghost"
                      disabled={!hasMdInput && !mdFileMeta}
                      onClick={handleMdClear}
                    >
                      <Eraser /> Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
