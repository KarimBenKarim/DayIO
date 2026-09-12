import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, Calendar, Flag, Plus, Check, List as ListIcon } from 'lucide-react';
import { Priority } from '../../../packages/shared/src/types';

export const TaskDetailDrawer: React.FC = () => {
  const { selectedTask, setSelectedTask, deleteTask, addSubtask, toggleSubtask, lists, refreshTasks } = useTasks();
  const { apiClient } = useAuth();

  const [notes, setNotes] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (selectedTask) {
      setNotes(selectedTask.notes || '');
    }
  }, [selectedTask]);

  if (!selectedTask) return null;

  const handleNotesBlur = async () => {
    if (notes !== (selectedTask.notes || '')) {
      await apiClient.updateTask(selectedTask.id, { notes });
      await refreshTasks();
    }
  };

  const handleAddSubtaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    await addSubtask(selectedTask.id, newSubtask.trim());
    setNewSubtask('');
  };

  return (
    <div className="w-80 bg-slate-950 border-l border-slate-800 h-screen flex flex-col justify-between p-4 overflow-y-auto">
      <div>
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Task Details</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => deleteTask(selectedTask.id)}
              title="Delete task"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTask(null)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title & Completion */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-100 mb-1">{selectedTask.title}</h2>
          <p className="text-xs text-slate-500">Created: {new Date(selectedTask.created_at || '').toLocaleDateString()}</p>
        </div>

        {/* Quick Attributes */}
        <div className="space-y-3 mb-6">
          {/* List */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ListIcon className="w-3.5 h-3.5" /> List
            </span>
            <select
              value={selectedTask.list_id || ''}
              onChange={async (e) => {
                await apiClient.updateTask(selectedTask.id, { list_id: e.target.value || null });
                await refreshTasks();
              }}
              className="bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">No List (Inbox)</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Flag className="w-3.5 h-3.5" /> Priority
            </span>
            <select
              value={selectedTask.priority}
              onChange={async (e) => {
                await apiClient.updateTask(selectedTask.id, { priority: e.target.value as Priority });
                await refreshTasks();
              }}
              className="bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due Date */}
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" /> Due Date
            </span>
            <input
              type="date"
              value={selectedTask.due_date || ''}
              onChange={async (e) => {
                await apiClient.updateTask(selectedTask.id, { due_date: e.target.value || null });
                await refreshTasks();
              }}
              className="bg-slate-900 text-slate-200 border border-slate-800 rounded px-2 py-1 text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="mb-6">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Subtasks
          </span>
          <div className="space-y-1.5 mb-2">
            {selectedTask.subtasks?.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSubtask(sub.id, !sub.completed)}
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      sub.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <span className={`text-xs ${sub.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {sub.title}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubtaskSubmit} className="flex items-center gap-1">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              placeholder="Add subtask..."
              className="flex-1 bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newSubtask.trim()}
              className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Notes Section */}
        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Notes & Description
          </span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add extra context or details..."
            className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-lg p-2.5 text-xs focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
