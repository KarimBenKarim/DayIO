import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Plus, Calendar, Flag, Tag } from 'lucide-react';
import { Priority } from '../../../packages/shared/src/types';

export const QuickAdd: React.FC = () => {
  const { createTask } = useTasks();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('none');
  const [tagInput, setTagInput] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await createTask(title.trim(), {
      due_date: dueDate || undefined,
      priority,
      tags: tags.length > 0 ? (tags as any) : undefined,
    });

    setTitle('');
    setDueDate('');
    setPriority('none');
    setTagInput('');
    setShowDetails(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-500" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setShowDetails(true)}
          placeholder="I want to..."
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm font-medium focus:outline-none"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Add Task
        </button>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-slate-900 flex flex-wrap items-center gap-3">
          {/* Due Date */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
            <Flag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none"
            >
              <option value="none" className="bg-slate-900 text-slate-300">Priority: None</option>
              <option value="low" className="bg-slate-900 text-blue-400">Low Priority</option>
              <option value="medium" className="bg-slate-900 text-amber-400">Medium Priority</option>
              <option value="high" className="bg-slate-900 text-red-400">High Priority</option>
            </select>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 flex-1 min-w-[150px]">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tags (comma separated)"
              className="w-full bg-transparent text-slate-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      )}
    </form>
  );
};
