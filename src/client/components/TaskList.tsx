import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { CheckCircle2 } from 'lucide-react';

export const TaskList: React.FC = () => {
  const { tasks, activeView, lists, selectedListId, loading } = useTasks();

  const getTitle = () => {
    switch (activeView) {
      case 'today':
        return "Today's Focus";
      case 'upcoming':
        return 'Upcoming Tasks';
      case 'inbox':
        return 'Inbox';
      case 'completed':
        return 'Completed Tasks';
      case 'list': {
        const currentList = lists.find((l) => l.id === selectedListId);
        return currentList ? currentList.name : 'Custom List';
      }
      case 'tag':
        return 'Tagged Tasks';
      default:
        return 'Tasks';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">{getTitle()}</h1>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-2xl p-8">
          <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">All clear!</p>
          <p className="text-slate-500 text-xs mt-1">No tasks in this view. Add one above to get started.</p>
        </div>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};
