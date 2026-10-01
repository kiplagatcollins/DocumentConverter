import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordToMD — Word to Markdown",
  description: "Convert .docx to Markdown — 100% in your browser",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
