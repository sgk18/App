"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useThemeStore } from "@/store/theme-store";
import { useCalendarStore } from "@/store/calendar-store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Moon, Sun, Calendar, LogOut, Shield, Bell, ChevronDown, Plus, Trash2, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";

export function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark, toggleTheme } = useThemeStore();
  const { calendars, isLoadingCalendars, fetchCalendars, selectCalendar } = useCalendarStore();

  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("");
  const [isLinking, setIsLinking] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // iCal states
  const [icalUrl, setIcalUrl] = useState("");
  const [icalLabel, setIcalLabel] = useState("");
  const [icalFeeds, setIcalFeeds] = useState<any[]>([]);
  const [isAddingIcal, setIsAddingIcal] = useState(false);
  
  // Public Google Calendar state
  const [publicGcalId, setPublicGcalId] = useState("");
  const [isAddingPublicGcal, setIsAddingPublicGcal] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Handle the redirect success from OAuth
    if (searchParams.get("calendar_connected") === "true") {
      toast.success("Google Calendar connected successfully!");
      router.replace("/settings");
    }
    if (searchParams.get("outlook_connected") === "true") {
      toast.success("Outlook Calendar connected successfully!");
      router.replace("/settings");
    }

    fetchCalendars();
    fetchIcalFeeds();
  }, [searchParams, router, fetchCalendars]);

  const fetchIcalFeeds = async () => {
    if (!auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('/api/calendar/ical/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIcalFeeds(data.feeds || []);
      }
    } catch (err) {
      console.error("Failed to fetch iCal feeds", err);
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.push("/");
    });
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
        toast.error("Failed to link calendar.");
      } finally {
        setIsLinking(false);
      }
    }
  };

  const handleGoogleCalendarLink = async () => {
    try {
      if (!user) return toast.error("You must be logged in.");
      const response = await fetch(`/api/auth/google?teacherId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleOutlookLink = async () => {
    try {
      if (!user) return toast.error("You must be logged in.");
      const response = await fetch(`/api/auth/outlook?teacherId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    }
  };

  const handleAddIcal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icalUrl || !user) return;
    
    setIsAddingIcal(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/calendar/ical/link', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ icalUrl, label: icalLabel })
      });

      if (response.ok) {
        toast.success("iCal feed added!");
        setIcalUrl("");
        setIcalLabel("");
        fetchIcalFeeds();
      } else {
        toast.error("Failed to add iCal feed.");
      }
    } catch (err) {
      toast.error("Error adding iCal feed.");
    } finally {
      setIsAddingIcal(false);
    }
  };

  const handleAddPublicGcal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicGcalId || !user) return;
    
    const gcalId = publicGcalId.trim();
    const icalFromGcal = gcalId.includes('http') 
      ? gcalId 
      : `https://calendar.google.com/calendar/ical/${encodeURIComponent(gcalId)}/public/basic.ics`;
    
    setIsAddingPublicGcal(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/calendar/ical/link', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ icalUrl: icalFromGcal, label: "Public Google Calendar" })
      });

      if (response.ok) {
        toast.success("Public Google Calendar linked!");
        setPublicGcalId("");
        fetchIcalFeeds();
      } else {
        toast.error("Failed to link calendar. Ensure it is set to 'Public'.");
      }
    } catch (err) {
      toast.error("Error linking public calendar.");
    } finally {
      setIsAddingPublicGcal(false);
    }
  };

  const removeIcalFeed = async (id: string) => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/calendar/ical/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success("iCal feed removed.");
        fetchIcalFeeds();
      }
    } catch (err) {
      toast.error("Error removing iCal feed.");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
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
          <div className="px-6 py-5 space-y-6">
            {/* Google */}
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center h-10 w-10 mt-1 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Google Calendar (OAuth)</p>
                <p className="text-xs text-muted-foreground mb-3">Sync events from your private Google account.</p>
                {isLoadingCalendars ? (
                  <div className="text-xs text-muted-foreground animate-pulse">Loading...</div>
                ) : calendars.length > 0 ? (
                  <div className="relative w-full sm:w-64">
                    <select 
                      value={selectedCalendarId}
                      onChange={handleCalendarChange}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" disabled>Select calendar...</option>
                      {calendars.map((cal) => <option key={cal.id} value={cal.id}>{cal.summary}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                ) : (
                  <button onClick={handleGoogleCalendarLink} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Connect Google Account
                  </button>
                )}
              </div>
            </div>

            {/* Public Google Calendar */}
            <div className="flex items-start gap-4 pt-6 border-t border-border">
              <div className="flex items-center justify-center h-10 w-10 mt-1 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Public Google Calendar</p>
                <p className="text-xs text-muted-foreground mb-3">Add a public calendar via its ID or iCal URL.</p>
                
                <form onSubmit={handleAddPublicGcal} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="example@group.calendar.google.com" 
                    value={publicGcalId} 
                    onChange={(e) => setPublicGcalId(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button 
                    type="submit" 
                    disabled={isAddingPublicGcal || !publicGcalId}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50 min-w-[80px]"
                  >
                    {isAddingPublicGcal ? "Adding..." : "Add"}
                  </button>
                </form>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  The calendar must be set to "Public" in Google Calendar settings.
                </p>
              </div>
            </div>

            {/* Outlook */}
            <div className="flex items-start gap-4 pt-6 border-t border-border">
              <div className="flex items-center justify-center h-10 w-10 mt-1 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Outlook Calendar</p>
                <p className="text-xs text-muted-foreground mb-3">Sync events from your Microsoft account.</p>
                <button onClick={handleOutlookLink} className="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline">
                  Connect Outlook Account
                </button>
              </div>
            </div>

            {/* iCal */}
            <div className="flex items-start gap-4 pt-6 border-t border-border">
              <div className="flex items-center justify-center h-10 w-10 mt-1 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Custom iCal Feeds</p>
                <p className="text-xs text-muted-foreground mb-4">Add read-only calendar feeds (e.g., Apple Calendar, Canvas).</p>
                
                <form onSubmit={handleAddIcal} className="space-y-3 mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      placeholder="Feed URL (https://...)" 
                      value={icalUrl} 
                      onChange={(e) => setIcalUrl(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input 
                      type="text" 
                      placeholder="Label (e.g. Work)" 
                      value={icalLabel} 
                      onChange={(e) => setIcalLabel(e.target.value)}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isAddingIcal || !icalUrl}
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {isAddingIcal ? "Adding..." : "Add Feed"}
                  </button>
                </form>

                {icalFeeds.length > 0 && (
                  <div className="space-y-2">
                    {icalFeeds.map((feed) => (
                      <div key={feed.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
                        <div>
                          <p className="text-sm font-medium">{feed.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{feed.url}</p>
                        </div>
                        <button onClick={() => removeIcalFeed(feed.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-muted text-foreground">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Account Info</p>
                <p className="text-xs text-muted-foreground">{user?.email || "Loading user..."}</p>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
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

