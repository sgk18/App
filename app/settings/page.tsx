"use client";

import { useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { useSettingsStore } from "@/store/settings-store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Moon, Sun, Calendar, LogOut, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeStore();
  const { googleCalendarSync, toggleGoogleCalendarSync } = useSettingsStore();

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Appearance
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted text-foreground">
                  {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {isDark ? "Dark theme is active" : "Light theme is active"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isDark ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isDark ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Integrations
            </h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted text-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Sync with Google Calendar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Automatically sync deadlines to your calendar
                  </p>
                </div>
              </div>
              <button
                onClick={toggleGoogleCalendarSync}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  googleCalendarSync ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    googleCalendarSync ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted text-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Push Notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receive browser notifications for due dates
                  </p>
                </div>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Account
            </h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted text-foreground">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Account Info</p>
                  <p className="text-xs text-muted-foreground">surya@university.edu</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
