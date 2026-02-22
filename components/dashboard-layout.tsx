"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { User } from "firebase/auth";
import { Sidebar } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Bell } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const userName = user?.displayName || user?.email?.split("@")[0] || "Professor";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main content area */}
      <div className="lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6 py-4">
          <div className="pl-12 lg:pl-0" />

          <div className="flex items-center gap-3">
            <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm hover:bg-accent transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                3
              </span>
            </button>

            <ThemeToggle />

            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {userInitial}
              </div>
              <span className="hidden sm:block text-sm font-medium text-foreground">
                {userName}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
