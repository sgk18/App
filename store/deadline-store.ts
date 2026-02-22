import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Deadline } from "@/types";
import { mockDeadlines } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";

interface DeadlineState {
  deadlines: Deadline[];
  setDeadlines: (deadlines: Deadline[]) => void;
  addDeadline: (deadline: Omit<Deadline, "id" | "createdAt">) => void;
  updateDeadline: (id: string, deadline: Partial<Deadline>) => void;
  deleteDeadline: (id: string) => void;
  getDeadlineById: (id: string) => Deadline | undefined;
}

export const useDeadlineStore = create<DeadlineState>()(
  persist(
    (set, get) => ({
      deadlines: [],
      setDeadlines: (deadlines) => set({ deadlines }),
      addDeadline: (deadline) =>
        set((state) => ({
          deadlines: [
            ...state.deadlines,
            {
              ...deadline,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateDeadline: (id, updates) =>
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),
      deleteDeadline: (id) =>
        set((state) => ({
          deadlines: state.deadlines.filter((d) => d.id !== id),
        })),
      getDeadlineById: (id) => get().deadlines.find((d) => d.id === id),
    }),
    {
      name: "deadline-storage",
    }
  )
);
