"use client";

import { Suspense } from "react";
import { SettingsContent } from "@/components/settings-content";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function SettingsPage() {
  return (
    <Suspense 
      fallback={
        <DashboardLayout>
          <div className="flex h-screen items-center justify-center animate-pulse text-muted-foreground">
            Loading settings...
          </div>
        </DashboardLayout>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
