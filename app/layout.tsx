import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: "#527c9f",
};

export const metadata: Metadata = {
  title: {
    default: "FastAPI Blog",
    template: "%s | FastAPI Blog",
  },
  description: "FastAPI Blog frontend rebuilt with Next.js and React",
  icons: { icon: "/icons/favicon.ico", apple: "/icons/icon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
          <Toaster richColors position="bottom-right" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}

