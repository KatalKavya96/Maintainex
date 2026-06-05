import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ActivityProvider } from "@/lib/activityStore";

export const metadata: Metadata = {
  title: "Maintainex",
  description: "Personal open-source maintenance tracking dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ActivityProvider>
          <AppShell>{children}</AppShell>
        </ActivityProvider>
      </body>
    </html>
  );
}
