"use client";

import { useDeadlineStore } from "@/store/deadline-store";
import { useCalendarStore } from "@/store/calendar-store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DeadlineCard } from "@/components/deadline-card";
import { Plus, CalendarDays, AlertCircle, CheckCircle2, CalendarPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const { deadlines, setDeadlines } = useDeadlineStore();
  const { events, fetchEvents } = useCalendarStore();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let unsubscribe: () => void;
    
    const fetchAllData = async () => {
      unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const token = await user.getIdToken();
            setUserName(user.email?.split('@')[0] || "Professor");
            
            // 1. Fetch internal deadlines
            const response = await fetch(`/api/deadlines/${user.uid}`, {
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });

            if (response.ok) {
              const data = await response.json();
              setDeadlines(data);
            } else {
              console.error("Failed to fetch deadlines from backend");
            }
            
            // 2. Fetch external events (Google, Outlook, iCal)
            await fetchEvents();
            
          } catch (error) {
            console.error("Error fetching dashboard data:", error);
          }
        }
      });
    };

    fetchAllData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [setDeadlines, fetchEvents]);

  const handleGoogleCalendarLink = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("User not logged in");
        return;
      }
      
      const response = await fetch(`/api/auth/google?teacherId=${user.uid}`);
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

  // Merge Native Deadlines with External Google Events
  const allMixedDeadlines = [
    ...deadlines,
    ...events.map((event) => ({
      id: event.eventId,
      teacherId: "external-calendar",
      title: event.summary,
      description: event.description || "Google Calendar Event",
      course: "External",
      subject: "External",
      dueDate: event.start,
      priority: "medium" as const,
      status: "pending" as const,
      createdAt: event.start,
      updatedAt: event.start,
      isGoogleEvent: true, // Tag it so we can optionally style it differently in the card later
      htmlLink: event.htmlLink
    }))
  ];

  const sortedDeadlines = allMixedDeadlines.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const upcomingCount = deadlines.filter(
    (d) => new Date(d.dueDate).getTime() > Date.now()
  ).length;
  const overdueCount = deadlines.filter(
    (d) => new Date(d.dueDate).getTime() <= Date.now()
  ).length;
  const highPriorityCount = deadlines.filter((d) => d.priority === "high").length;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Hello, {userName} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here&apos;s an overview of your upcoming deadlines
            </p>
          </div>
          
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-border px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <CalendarPlus className="h-4 w-4 text-primary" />
            Manage Calendars
          </Link>
        </div>

        {/* Combined Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Upcoming",
              value: upcomingCount,
              icon: CalendarDays,
              color: "text-sky-500",
              bg: "bg-sky-100 dark:bg-sky-900/30",
            },
            {
              label: "High Priority",
              value: highPriorityCount,
              icon: AlertCircle,
              color: "text-red-500",
              bg: "bg-red-100 dark:bg-red-900/30",
            },
            {
              label: "Overdue",
              value: overdueCount,
              icon: CheckCircle2,
              color: "text-orange-500",
              bg: "bg-orange-100 dark:bg-orange-900/30",
            },
            {
              label: "External Events",
              value: events.length || 0,
              icon: CalendarPlus,
              color: "text-sky-500",
              bg: "bg-sky-100 dark:bg-sky-900/30",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div
                className={`flex items-center justify-center h-12 w-12 rounded-xl ${stat.bg} ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Deadlines Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Upcoming Deadlines
          </h2>
          <span className="text-sm text-muted-foreground">
            {deadlines.length} total
          </span>
        </div>

        {/* Deadline Grid */}
        {sortedDeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No deadlines yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first deadline to get started
            </p>
            <Link
              href="/add"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Add Deadline
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {sortedDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        )}

        {/* Google Events List was merged above! */}

        {/* Floating Add Button */}
        <Link
          href="/add"
          className="fixed bottom-8 right-8 flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all z-30"
          aria-label="Add deadline"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </div>
    </DashboardLayout>
  );
}
