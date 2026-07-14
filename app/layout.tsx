import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BCA Contact Finder",
  description: "Find investment decision-makers at any firm, instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
