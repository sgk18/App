"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeadlineStore } from "@/store/deadline-store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Priority } from "@/types";
import { CalendarPlus, Save } from "lucide-react";

export default function AddDeadlinePage() {
  const router = useRouter();
  const { addDeadline } = useDeadlineStore();

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // We must be logged in to create a deadline
      if (!auth.currentUser) throw new Error("You must be logged in to add a deadline.");
      const token = await auth.currentUser.getIdToken();

      // Create deadline object
      const deadlineData = {
        subject,
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        priority
      };

      // Save to Backend API instead of direct Firestore
      const response = await fetch("http://localhost:5000/api/deadlines/create-deadline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(deadlineData)
      });

      if (!response.ok) {
        throw new Error("Failed to save deadline via API.");
      }

      const responseData = await response.json();

      // Save to local Zustand store for immediate UI update
      addDeadline(responseData);

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary">
            <CalendarPlus className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add New Deadline</h1>
            <p className="text-sm text-muted-foreground">
              Create a new assignment or project deadline
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="space-y-2">
              <label htmlFor="subject" className="text-sm font-medium text-foreground">
                Subject Name
              </label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Data Structures & Algorithms"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                Assignment Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Binary Tree Assignment"
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the assignment requirements..."
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label htmlFor="dueDate" className="text-sm font-medium text-foreground">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-foreground">
                  Priority
                </label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none"
                >
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-all active:scale-[0.98]"
            >
              <Save className="h-4 w-4" />
              Save Deadline
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
