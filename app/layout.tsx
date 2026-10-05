import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "FastAPI Blog",
  description: "FastAPI Blog frontend rebuilt with Next.js and React",
  themeColor: "#527c9f",
  icons: { icon: "/icons/favicon.ico", apple: "/icons/icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
