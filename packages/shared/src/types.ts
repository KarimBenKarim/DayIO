export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon?: string | null;
  position: number;
  created_at?: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at?: string;
}

export interface Recurrence {
  id: string;
  task_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  by_days?: string;
  end_date?: string;
}

export interface Reminder {
  id: string;
  task_id: string;
  remind_at: string;
  sent: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  list_id?: string | null;
  title: string;
  notes?: string | null;
  completed: boolean;
  due_date?: string | null;
  due_time?: string | null;
  priority: Priority;
  position: number;
  created_at?: string;
  updated_at?: string;
  subtasks: Subtask[];
  tags: Tag[];
  recurrence?: Recurrence | null;
  reminders?: Reminder[];
}

export interface AuthResponse {
  token: string;
  user: User;
}
