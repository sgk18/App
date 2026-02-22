"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { useCalendarStore } from "@/store/calendar-store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Moon, Sun, Calendar, LogOut, Shield, Bell, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, toggleTheme } = useThemeStore();
  const { calendars, isLoadingCalendars, fetchCalendars, selectCalendar } = useCalendarStore();

  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Handle the redirect success from OAuth
    if (searchParams.get("calendar_connected") === "true") {
      toast.success("Google Calendar connected successfully!", {
        duration: 4000,
        icon: '🎉'
      });
      // Remove query param to clean up URL
      router.replace("/settings");
    }

    // Always fetch available calendars on load
    fetchCalendars();
  }, [searchParams, router, fetchCalendars]);

  const handleLogout = () => {
    router.push("/");
  };

  const handleCalendarChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const calendarId = e.target.value;
    setSelectedCalendarId(calendarId);
    
    if (calendarId) {
      setIsLinking(true);
      try {
        await selectCalendar(calendarId);
        toast.success("Calendar successfully linked for syncing!");
      } catch (error) {
        console.error("Failed to link calendar:", error);
        toast.error("Failed to link calendar. Please try again.");
      } finally {
        setIsLinking(false);
      }
    }
  };

  const handleGoogleCalendarLink = async () => {
    try {
      if (!user) {
        console.error("User not logged in");
        return;
      }
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const response = await fetch(`${backendUrl}/auth/google?teacherId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        // Redirect the user to the Google OAuth consent screen
        window.location.href = data.url;
      } else {
        console.error("Failed to get Google Auth URL");
      }
    } catch (error) {
      console.error("Error linking Google Calendar:", error);
    }
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
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Integrations
            </h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 mt-1 rounded-xl bg-muted text-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Google Calendar Sync
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Automatically sync deadlines and fetch external events.
                  </p>
                  
                  {isLoadingCalendars ? (
                    <div className="text-xs text-muted-foreground animate-pulse">Loading calendars...</div>
                  ) : calendars.length > 0 ? (
                    <div className="relative">
                      <select 
                        value={selectedCalendarId}
                        onChange={handleCalendarChange}
                        disabled={isLinking}
                        className="w-full sm:w-64 appearance-none rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                      >
                        <option value="" disabled>Select a calendar to link...</option>
                        {calendars.map((cal) => (
                          <option key={cal.id} value={cal.id}>
                            {cal.summary} {cal.primary ? "(Primary)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleCalendarLink}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Connect Google Calendar
                    </button>
                  )}
                  {isLinking && <p className="text-xs text-primary mt-2">Linking calendar...</p>}
                </div>
              </div>
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

export default function SettingsPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex h-screen items-center justify-center animate-pulse text-muted-foreground">Loading settings...</div></DashboardLayout>}>
      <SettingsContent />
    </Suspense>
  );
}
