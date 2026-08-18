import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rento",
  description: "Modern rental platform for hostels, apartments and commercial spaces",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}