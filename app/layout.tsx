import type { Metadata } from "next";

import "@/app/globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export const metadata: Metadata = {
  title: "Learn N Grow Admin",
  description: "Business management app for an English coaching center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background">
        <ThemeProvider>
          <AuthProvider>
            <AppDataProvider>
              <AppShell>{children}</AppShell>
            </AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
