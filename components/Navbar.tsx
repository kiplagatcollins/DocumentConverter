import { FileText } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight">WordToMD</span>
          <span className="text-xs text-muted-foreground">
            .docx ⇄ Markdown — 100% in your browser
          </span>
        </div>
        <nav className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="hidden sm:inline">No uploads. No server.</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}
