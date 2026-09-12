import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { TaskFlowApiClient, TokenStorage } from '../../packages/shared/src/apiClient';
import { Task, List } from '../../packages/shared/src/types';

// Mobile Secure/Memory Storage Strategy
let memoryToken: string | null = null;
const mobileTokenStorage: TokenStorage = {
  getToken: () => memoryToken,
  setToken: (token) => {
    memoryToken = token;
  },
};

const apiClient = new TaskFlowApiClient('http://10.0.2.2:3000/api', null, mobileTokenStorage);

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  // App Navigation & Task State
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'inbox' | 'completed' | 'lists'>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newListTitle, setNewListTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTaskData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'lists') {
        const res = await apiClient.getLists();
        setLists(res.lists);
      } else {
        const res = await apiClient.getTasks({ view: activeTab });
        setTasks(res.tasks);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loggedIn) {
      fetchTaskData();
    }
  }, [loggedIn, activeTab]);

  const handleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      let authRes;
      if (isRegistering) {
        authRes = await apiClient.register(email, password, name);
      } else {
        authRes = await apiClient.login(email, password);
      }
      setUser(authRes.user);
      setLoggedIn(true);
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const options: any = {};
      if (activeTab === 'today') {
        options.due_date = new Date().toISOString().split('T')[0];
      }
      await apiClient.createTask({ title: newTaskTitle.trim(), ...options });
      setNewTaskTitle('');
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not create task');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await apiClient.updateTask(task.id, { completed: !task.completed });
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not update task');
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    try {
      await apiClient.createList(newListTitle.trim());
      setNewListTitle('');
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not create list');
    }
  };

  if (!loggedIn) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.authCard}>
          <Text style={styles.appTitle}>TaskMaster Mobile</Text>
          <Text style={styles.subTitle}>Any.do-inspired task manager</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isRegistering && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#64748b"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>{isRegistering ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text style={styles.toggleAuthText}>
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.userGreeting}>Hello, {user?.name || 'User'}</Text>
        <TouchableOpacity
          onPress={() => {
            setLoggedIn(false);
            apiClient.setToken(null);
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add Bar */}
      {activeTab !== 'lists' && (
        <View style={styles.quickAddContainer}>
          <TextInput
            style={styles.quickAddInput}
            placeholder="I want to..."
            placeholderTextColor="#64748b"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />
          <TouchableOpacity style={styles.addButton} onPress={handleCreateTask}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        {(['today', 'upcoming', 'inbox', 'completed', 'lists'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Content List */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#3b82f6" />
        ) : activeTab === 'lists' ? (
          <View style={{ flex: 1 }}>
            <View style={styles.quickAddContainer}>
              <TextInput
                style={styles.quickAddInput}
                placeholder="New list name..."
                placeholderTextColor="#64748b"
                value={newListTitle}
                onChangeText={setNewListTitle}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleCreateList}>
                <Text style={styles.addButtonText}>Create</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={lists}
              keyExtractor={(item: List) => item.id}
              renderItem={({ item }: { item: List }) => (
                <View style={styles.listItem}>
                  <View style={[styles.colorDot, { backgroundColor: item.color || '#3b82f6' }]} />
                  <Text style={styles.listName}>{item.name}</Text>
                </View>
              )}
            />
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item: Task) => item.id}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No tasks found in {activeTab}.</Text>
            }
            renderItem={({ item }: { item: Task }) => (
              <TouchableOpacity style={styles.taskCard} onPress={() => handleToggleTask(item)}>
                <View style={[styles.checkbox, item.completed && styles.checkedBox]}>
                  {item.completed && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, item.completed && styles.completedTaskTitle]}>
                    {item.title}
                  </Text>
                  {item.due_date ? <Text style={styles.taskMeta}>Due: {item.due_date}</Text> : null}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  toggleAuthText: {
    color: '#38bdf8',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userGreeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  logoutText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  quickAddContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 8,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 30,
  },
});
