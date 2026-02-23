"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/utils";
import { Clock, AlertTriangle } from "lucide-react";

interface CountdownTimerProps {
  dueDate: string;
  compact?: boolean;
}

export function CountdownTimer({ dueDate, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(dueDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(dueDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [dueDate]);

  if (timeLeft.overdue) {
    return (
      <div className="flex items-center gap-1.5 text-orange-500 dark:text-orange-400">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-semibold">Overdue</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-sm font-medium">
          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Clock className="h-4 w-4 text-primary" />
      <div className="flex gap-2">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hrs" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sec" },
        ].map((unit) => (
          <div
            key={unit.label}
            className="flex flex-col items-center rounded-lg bg-muted/50 px-2.5 py-1.5 min-w-[48px]"
          >
            <span className="text-lg font-bold tabular-nums text-foreground">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
