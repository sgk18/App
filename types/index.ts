export type Priority = "high" | "medium" | "low";

export interface Deadline {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  createdAt: string;
  isGoogleEvent?: boolean;
  htmlLink?: string;
}

export interface User {
  name: string;
  email: string;
}
