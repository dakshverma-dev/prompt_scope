import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptScope",
  description: "The DevTools for prompt engineering",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
