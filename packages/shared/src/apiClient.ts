import { AuthResponse, List, Task, Tag, Subtask, User } from './types.js';

export class TaskFlowApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('taskmaster_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('taskmaster_token', token);
      } else {
        localStorage.removeItem('taskmaster_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API Request failed');
    }

    return data as T;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(res.token);
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  async getLists(): Promise<{ lists: List[] }> {
    return this.request<{ lists: List[] }>('/lists');
  }

  async createList(name: string, color?: string, icon?: string): Promise<{ list: List }> {
    return this.request<{ list: List }>('/lists', {
      method: 'POST',
      body: JSON.stringify({ name, color, icon }),
    });
  }

  async getTasks(params?: { view?: string; listId?: string; tagId?: string }): Promise<{ tasks: Task[] }> {
    const query = new URLSearchParams();
    if (params?.view) query.append('view', params.view);
    if (params?.listId) query.append('listId', params.listId);
    if (params?.tagId) query.append('tagId', params.tagId);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ tasks: Task[] }>(`/tasks${queryString}`);
  }

  async createTask(taskData: Partial<Task> & { title: string }): Promise<{ task: Task }> {
    return this.request<{ task: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId: string, taskData: Partial<Task>): Promise<{ task: Task }> {
    return this.request<{ task: Task }>(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(taskId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async addSubtask(taskId: string, title: string): Promise<{ subtask: Subtask }> {
    return this.request<{ subtask: Subtask }>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async updateSubtask(subtaskId: string, updates: Partial<Subtask>): Promise<{ subtask: Subtask }> {
    return this.request<{ subtask: Subtask }>(`/subtasks/${subtaskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteSubtask(subtaskId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/subtasks/${subtaskId}`, {
      method: 'DELETE',
    });
  }

  async getTags(): Promise<{ tags: Tag[] }> {
    return this.request<{ tags: Tag[] }>('/tags');
  }
}
