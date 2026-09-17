import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroPathway Ecosystem",
  description: "AI-assisted early identification and lifelong support for neurodivergent people and their support networks.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
