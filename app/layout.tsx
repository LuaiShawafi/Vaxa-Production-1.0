import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Växa Production",
  description:
    "Production operations and traceability for Växa Odling cultivation teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background text-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
