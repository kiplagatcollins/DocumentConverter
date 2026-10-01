import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface Props {
  html: string;
  empty: boolean;
}

export default function Preview({ html, empty }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div id="preview" className="min-h-[300px] overflow-auto text-sm">
          {empty ? (
            <em className="text-muted-foreground">Nothing converted yet.</em>
          ) : (
            // sanitized upstream with DOMPurify
            <div dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
