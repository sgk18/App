import { create } from 'zustand';
import { auth } from '../lib/firebase'; 

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = await auth.currentUser?.getIdToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  headers.set('Content-Type', 'application/json');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const res = await fetch(`${backendUrl}${url}`, { ...options, headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw { response: { data: errorData } }; 
  }
  
  return res.json();
};

export interface GoogleCalendar {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string;
}

export interface GoogleEvent {
  eventId: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  htmlLink: string;
}

interface CalendarState {
  calendars: GoogleCalendar[];
  events: GoogleEvent[];
  isLoadingCalendars: boolean;
  isLoadingEvents: boolean;
  error: string | null;

  fetchCalendars: () => Promise<void>;
  selectCalendar: (calendarId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  calendars: [],
  events: [],
  isLoadingCalendars: false,
  isLoadingEvents: false,
  error: null,

  fetchCalendars: async () => {
    set({ isLoadingCalendars: true, error: null });
    try {
      const data = await fetchWithAuth('/api/calendar/list');
      set({ calendars: data.calendars || [], isLoadingCalendars: false });
    } catch (error: any) {
      console.error('Error fetching Google Calendars:', error);
      set({ 
        error: error.response?.data?.error || 'Failed to fetch calendars.',
        isLoadingCalendars: false 
      });
    }
  },

  selectCalendar: async (calendarId: string) => {
    set({ error: null });
    try {
      await fetchWithAuth('/api/calendar/select', {
        method: 'POST',
        body: JSON.stringify({ calendarId })
      });
      // We don't need to update state immediately, the backend handles the save.
      // But we could optionally refresh the calendar list here if needed.
    } catch (error: any) {
      console.error('Error saving linked calendar:', error);
      set({ error: error.response?.data?.error || 'Failed to link calendar.' });
      throw error; // Re-throw so the UI can show a toast
    }
  },

  fetchEvents: async () => {
    set({ isLoadingEvents: true, error: null });
    try {
      const data = await fetchWithAuth('/api/calendar/events');
      set({ events: data.events || [], isLoadingEvents: false });
    } catch (error: any) {
      console.error('Error fetching Google Events:', error);
      // It's normal to have a 400 if they haven't linked a calendar yet
      set({ 
        error: null, // Don't crash the UI for unlinked calendars
        isLoadingEvents: false 
      });
    }
  }
}));
