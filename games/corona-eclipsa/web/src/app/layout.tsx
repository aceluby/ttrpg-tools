import type { Metadata } from "next";
import { SoundboardProvider } from "@/components/soundboard-provider";
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
      <body className="h-full overflow-hidden">
        <SoundboardProvider>
          <div className="flex h-full min-h-0 flex-col overflow-hidden">
            {children}
          </div>
        </SoundboardProvider>
      </body>
    </html>
  );
}
