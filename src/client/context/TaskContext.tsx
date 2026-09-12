import React, { createContext, useContext, useState, useEffect } from 'react';
import { Task, List, Tag } from '../../../packages/shared/src/types';
import { useAuth } from './AuthContext';

type ActiveView = 'today' | 'upcoming' | 'inbox' | 'completed' | 'list' | 'tag';

interface TaskContextType {
  tasks: Task[];
  lists: List[];
  tags: Tag[];
  activeView: ActiveView;
  selectedListId: string | null;
  selectedTagId: string | null;
  selectedTask: Task | null;
  loading: boolean;
  setActiveView: (view: ActiveView, id?: string) => void;
  setSelectedTask: (task: Task | null) => void;
  refreshTasks: () => Promise<void>;
  createTask: (title: string, options?: Partial<Task>) => Promise<Task>;
  toggleTaskComplete: (taskId: string, completed: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createList: (name: string, color?: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string, completed: boolean) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { apiClient, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeView, setActiveViewViewState] = useState<ActiveView>('today');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params: any = {};
      if (['today', 'upcoming', 'inbox', 'completed'].includes(activeView)) {
        params.view = activeView;
      } else if (activeView === 'list' && selectedListId) {
        params.listId = selectedListId;
      } else if (activeView === 'tag' && selectedTagId) {
        params.tagId = selectedTagId;
      }

      const res = await apiClient.getTasks(params);
      setTasks(res.tasks);

      if (selectedTask) {
        const updated = res.tasks.find((t: Task) => t.id === selectedTask.id);
        if (updated) setSelectedTask(updated);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshListsAndTags = async () => {
    if (!token) return;
    try {
      const [listRes, tagRes] = await Promise.all([apiClient.getLists(), apiClient.getTags()]);
      setLists(listRes.lists);
      setTags(tagRes.tags);
    } catch (err) {
      console.error('Failed to fetch metadata', err);
    }
  };

  useEffect(() => {
    if (token) {
      refreshListsAndTags();
      refreshTasks();
    }
  }, [token, activeView, selectedListId, selectedTagId]);

  const setActiveView = (view: ActiveView, id?: string) => {
    setActiveViewViewState(view);
    if (view === 'list') {
      setSelectedListId(id || null);
      setSelectedTagId(null);
    } else if (view === 'tag') {
      setSelectedTagId(id || null);
      setSelectedListId(null);
    } else {
      setSelectedListId(null);
      setSelectedTagId(null);
    }
  };

  const createTask = async (title: string, options?: Partial<Task>) => {
    const taskData: any = {
      title,
      ...options,
    };

    if (activeView === 'today' && !taskData.due_date) {
      taskData.due_date = new Date().toISOString().split('T')[0];
    } else if (activeView === 'list' && selectedListId) {
      taskData.list_id = selectedListId;
    }

    const res = await apiClient.createTask(taskData);
    await refreshTasks();
    await refreshListsAndTags();
    return res.task;
  };

  const toggleTaskComplete = async (taskId: string, completed: boolean) => {
    await apiClient.updateTask(taskId, { completed });
    await refreshTasks();
  };

  const deleteTask = async (taskId: string) => {
    await apiClient.deleteTask(taskId);
    if (selectedTask?.id === taskId) setSelectedTask(null);
    await refreshTasks();
  };

  const createList = async (name: string, color?: string) => {
    await apiClient.createList(name, color);
    await refreshListsAndTags();
  };

  const addSubtask = async (taskId: string, title: string) => {
    await apiClient.addSubtask(taskId, title);
    await refreshTasks();
  };

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    await apiClient.updateSubtask(subtaskId, { completed });
    await refreshTasks();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        lists,
        tags,
        activeView,
        selectedListId,
        selectedTagId,
        selectedTask,
        loading,
        setActiveView,
        setSelectedTask,
        refreshTasks,
        createTask,
        toggleTaskComplete,
        deleteTask,
        createList,
        addSubtask,
        toggleSubtask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within TaskProvider');
  return context;
};
