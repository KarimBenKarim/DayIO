import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { Sidebar } from './components/Sidebar';
import { QuickAdd } from './components/QuickAdd';
import { TaskList } from './components/TaskList';
import { TaskDetailDrawer } from './components/TaskDetailDrawer';
import { AuthModal } from './components/AuthModal';
import { AddListModal } from './components/AddListModal';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [isAddListOpen, setIsAddListOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Initializing TaskMaster...
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <TaskProvider>
      <div className="flex h-screen w-screen bg-slate-900 overflow-hidden">
        <Sidebar onOpenAddList={() => setIsAddListOpen(true)} />

        <main className="flex-1 flex flex-col h-screen overflow-hidden max-w-4xl mx-auto p-6">
          <QuickAdd />
          <TaskList />
        </main>

        <TaskDetailDrawer />
        <AddListModal isOpen={isAddListOpen} onClose={() => setIsAddListOpen(false)} />
      </div>
    </TaskProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
