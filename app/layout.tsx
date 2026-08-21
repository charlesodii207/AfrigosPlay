import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Film Streaming Platform",
  description: "Watch every movie with Premium, or rent titles individually.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
