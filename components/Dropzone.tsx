import { useRef } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  fileMeta: string;
  dragging: boolean;
  accept: string;
  inputId?: string;
  zoneId?: string;
  metaId?: string;
  hint?: string;
  onFile: (file: File) => void;
  onDrag: (dragging: boolean) => void;
}

export default function Dropzone({
  fileMeta,
  dragging,
  accept,
  inputId = "fileInput",
  zoneId = "dropzone",
  metaId = "fileMeta",
  hint = "Drag & drop a .docx here or",
  onFile,
  onDrag,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      id={zoneId}
      tabIndex={0}
      className={cn(
        "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragging ? "drag border-primary bg-accent" : "border-input bg-card",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        onDrag(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        onDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <UploadCloud className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{hint}</p>
      <input
        type="file"
        id={inputId}
        ref={inputRef}
        accept={accept}
        className="hidden"
        onChange={() => {
          const f = inputRef.current?.files?.[0];
          if (f) onFile(f);
        }}
      />
      <label
        htmlFor={inputId}
        className="btn mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
      >
        Choose file
      </label>
      <div id={metaId} className="mt-2 min-h-5 text-sm text-muted-foreground">
        {fileMeta}
      </div>
    </div>
  );
}
