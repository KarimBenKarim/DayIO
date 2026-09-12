import React from 'react';
import { Task } from '../../../packages/shared/src/types';
import { useTasks } from '../context/TaskContext';
import { Check, Calendar, Tag as TagIcon, Flag } from 'lucide-react';

export const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { toggleTaskComplete, selectedTask, setSelectedTask } = useTasks();

  const isSelected = selectedTask?.id === task.id;

  const priorityColors = {
    none: 'text-slate-500',
    low: 'text-blue-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };

  return (
    <div
      onClick={() => setSelectedTask(task)}
      className={`group flex items-center justify-between p-3.5 mb-2 rounded-xl bg-slate-950 border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500/50 shadow-md shadow-blue-500/5 bg-slate-900/60'
          : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskComplete(task.id, !task.completed);
          }}
          className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-600 hover:border-blue-500 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium transition-colors truncate ${
              task.completed ? 'line-through text-slate-500' : 'text-slate-100'
            }`}
          >
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
            {task.due_date && (
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>{task.due_date}</span>
              </span>
            )}

            {task.priority !== 'none' && (
              <span className={`flex items-center gap-0.5 ${priorityColors[task.priority]}`}>
                <Flag className="w-3 h-3 fill-current" />
                <span className="capitalize">{task.priority}</span>
              </span>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <span className="text-slate-500">
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
              </span>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400"
                  >
                    <TagIcon className="w-2.5 h-2.5" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
