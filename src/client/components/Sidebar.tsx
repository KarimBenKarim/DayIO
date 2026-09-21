import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import {
  Sun,
  Calendar,
  Inbox,
  CheckCircle2,
  FolderPlus,
  LogOut,
  Tag as TagIcon
} from 'lucide-react';

export const Sidebar: React.FC<{ onOpenAddList: () => void }> = ({ onOpenAddList }) => {
  const { user, logout } = useAuth();
  const { activeView, selectedListId, selectedTagId, lists, tags, setActiveView } = useTasks();

  const navItems = [
    { id: 'today', label: 'Today', icon: Sun, color: 'text-amber-400' },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar, color: 'text-purple-400' },
    { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-blue-400' },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-screen p-4 select-none">
      <div>
        {/* User Info Header */}
        <div className="flex items-center justify-between pb-6 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-slate-100 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* System Views */}
        <div className="space-y-1 mb-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Lists */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 px-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lists</span>
            <button
              onClick={onOpenAddList}
              className="text-slate-400 hover:text-blue-400 p-0.5 rounded hover:bg-slate-900"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            {lists.map((list) => {
              const isActive = activeView === 'list' && selectedListId === list.id;
              return (
                <button
                  key={list.id}
                  onClick={() => setActiveView('list', list.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/10"
                    style={{ backgroundColor: list.color || '#3b82f6' }}
                  />
                  <span className="truncate">{list.name}</span>
                </button>
              );
            })}
            {lists.length === 0 && (
              <p className="px-3 text-xs text-slate-500 italic">No custom lists yet</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Tags
            </span>
            <div className="flex flex-wrap gap-1 px-3">
              {tags.map((tag) => {
                const isActive = activeView === 'tag' && selectedTagId === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setActiveView('tag', tag.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-medium'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <TagIcon className="w-3 h-3" />
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 px-3 py-2 border-t border-slate-900">
        TaskMaster v0.1 • Personal Use
      </div>
    </aside>
  );
};
