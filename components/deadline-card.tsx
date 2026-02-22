"use client";

import Link from "next/link";
import { Deadline } from "@/types";
import { formatDate } from "@/lib/utils";
import { PriorityBadge } from "./priority-badge";
import { CountdownTimer } from "./countdown-timer";
import { BookOpen, ArrowRight, ExternalLink, CalendarDays } from "lucide-react";

interface DeadlineCardProps {
  deadline: Deadline;
}

export function DeadlineCard({ deadline }: DeadlineCardProps) {
  const CardContent = (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1">
      {/* Priority accent bar */}
      <div
        className={`absolute top-0 left-0 h-1 w-full ${
          deadline.priority === "high"
            ? "bg-red-500"
            : deadline.priority === "medium"
            ? "bg-amber-500"
            : "bg-emerald-500"
        }`}
      />

      <div className="flex items-start justify-between gap-3 mt-1">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {deadline.isGoogleEvent ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CalendarDays className="h-3 w-3" />
              Google Calendar
            </span>
          ) : (
            <>
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">{deadline.subject}</span>
            </>
          )}
        </div>
        {!deadline.isGoogleEvent && <PriorityBadge priority={deadline.priority} />}
      </div>

      <h3 className="mt-3 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {deadline.title}
      </h3>

      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
        {deadline.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {deadline.isGoogleEvent ? "Starts: " : "Due: "}{formatDate(deadline.dueDate)}
          </p>
          <CountdownTimer dueDate={deadline.dueDate} compact />
        </div>
        <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View</span>
          {deadline.isGoogleEvent ? <ExternalLink className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </div>
      </div>
    </div>
  );

  if (deadline.isGoogleEvent && deadline.htmlLink) {
    return (
      <a href={deadline.htmlLink} target="_blank" rel="noopener noreferrer">
        {CardContent}
      </a>
    );
  }

  return (
    <Link href={`/deadline/${deadline.id}`}>
      {CardContent}
    </Link>
  );
}
