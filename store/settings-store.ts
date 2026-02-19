import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  googleCalendarSync: boolean;
  toggleGoogleCalendarSync: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      googleCalendarSync: false,
      toggleGoogleCalendarSync: () =>
        set((state) => ({ googleCalendarSync: !state.googleCalendarSync })),
    }),
    {
      name: "settings-storage",
    }
  )
);
