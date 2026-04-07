import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Corona Eclipsa Table App",
  description: "Browse and edit linked Corona Eclipsa campaign markdown files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
