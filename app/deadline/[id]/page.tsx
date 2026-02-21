"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDeadlineStore } from "@/store/deadline-store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CountdownTimer } from "@/components/countdown-timer";
import { PriorityBadge } from "@/components/priority-badge";
import { formatDate } from "@/lib/utils";
import { Priority } from "@/types";
import {
  BookOpen,
  Calendar,
  FileText,
  Pencil,
  Trash2,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";

export default function DeadlineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { deadlines, updateDeadline, deleteDeadline } = useDeadlineStore();
  const [isEditing, setIsEditing] = useState(false);

  const deadline = deadlines.find((d) => d.id === params.id);

  const [editData, setEditData] = useState({
    subject: "",
    title: "",
    description: "",
    dueDate: "",
    priority: "medium" as Priority,
  });

  useEffect(() => {
    if (deadline) {
      setEditData({
        subject: deadline.subject,
        title: deadline.title,
        description: deadline.description,
        dueDate: new Date(deadline.dueDate).toISOString().slice(0, 16),
        priority: deadline.priority,
      });
    }
  }, [deadline]);

  if (!deadline) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-lg font-medium text-foreground">Deadline not found</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = () => {
    updateDeadline(deadline.id, {
      ...editData,
      dueDate: new Date(editData.dueDate).toISOString(),
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    deleteDeadline(deadline.id);
    router.push("/dashboard");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Priority accent bar */}
          <div
            className={`h-1.5 w-full ${
              deadline.priority === "high"
                ? "bg-red-500"
                : deadline.priority === "medium"
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
          />

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editData.subject}
                      onChange={(e) =>
                        setEditData({ ...editData, subject: e.target.value })
                      }
                      className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Subject"
                    />
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData({ ...editData, title: e.target.value })
                      }
                      className="w-full rounded-xl border border-input bg-background px-4 py-3 text-xl font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Title"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{deadline.subject}</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                      {deadline.title}
                    </h1>
                  </>
                )}
              </div>
              <PriorityBadge priority={isEditing ? editData.priority : deadline.priority} />
            </div>

            {/* Countdown */}
            <div className="mt-6 rounded-xl bg-muted/30 border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Time Remaining
              </p>
              <CountdownTimer dueDate={deadline.dueDate} />
            </div>

            {/* Details */}
            <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Due Date</p>
                  {isEditing ? (
                    <input
                      type="datetime-local"
                      value={editData.dueDate}
                      onChange={(e) =>
                        setEditData({ ...editData, dueDate: e.target.value })
                      }
                      className="mt-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {formatDate(deadline.dueDate)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Description</p>
                  {isEditing ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData({ ...editData, description: e.target.value })
                      }
                      rows={4}
                      className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {deadline.description}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Priority</p>
                    <select
                      value={editData.priority}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          priority: e.target.value as Priority,
                        })
                      }
                      className="rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                Created: {formatDate(deadline.createdAt)}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-all"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 px-5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
