import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  markdown: string;
  hasResult: boolean;
  onCopy: () => void;
  onDownloadMd: () => void;
  onDownloadZip: () => void;
  onClear: () => void;
}

export default function MarkdownPane({
  markdown,
  hasResult,
  onCopy,
  onDownloadMd,
  onDownloadZip,
  onClear,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Markdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          id="rawOutput"
          readOnly
          value={markdown}
          placeholder="Markdown appears here..."
          className="min-h-[300px] font-mono"
        />
        <div className="actions mt-3 flex flex-wrap gap-2">
          <Button id="copyBtn" size="sm" variant="secondary" disabled={!hasResult} onClick={onCopy}>
            Copy
          </Button>
          <Button id="downloadMdBtn" size="sm" variant="secondary" disabled={!hasResult} onClick={onDownloadMd}>
            Download .md
          </Button>
          <Button id="downloadZipBtn" size="sm" variant="secondary" disabled={!hasResult} onClick={onDownloadZip}>
            Download .zip
          </Button>
          <Button id="clearBtn" size="sm" variant="ghost" disabled={!hasResult} onClick={onClear}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
