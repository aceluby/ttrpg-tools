import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spearhead Command Table",
  description: "Run a Warhammer Age of Sigmar: Spearhead match from setup through round four.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full overflow-hidden">
        <div className="flex h-full min-h-0 flex-col overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
