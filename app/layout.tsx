import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PurpleOS",
  description: "Modern web desktop OS experience with a customizable soundboard engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
