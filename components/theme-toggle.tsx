"use client";

import { useThemeStore } from "@/store/theme-store";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground shadow-sm transition-all duration-300 hover:bg-accent hover:shadow-md"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400 transition-transform duration-300 rotate-0" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-500 transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}
