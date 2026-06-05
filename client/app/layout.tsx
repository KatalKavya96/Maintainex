import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityProvider } from "@/lib/activityStore";
import { AuthProvider } from "@/lib/authStore";

export const metadata: Metadata = {
  title: "Maintainex",
  description: "Personal open-source maintenance tracking dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <AuthProvider>
          <ActivityProvider>
            <AppShell>{children}</AppShell>
          </ActivityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
