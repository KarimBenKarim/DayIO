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
  Modal,
  ScrollView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TaskFlowApiClient, TokenStorage } from '../../packages/shared/src/apiClient';
import { Task, List, Tag, Priority } from '../../packages/shared/src/types';
import { getLocalDateString } from '../../packages/shared/src/utils/date';

const TOKEN_KEY = 'taskmaster_mobile_auth_token';

// Persistent Expo SecureStore Strategy
const expoTokenStorage: TokenStorage = {
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  },
  setToken: async (token) => {
    try {
      if (token) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to update Expo SecureStore token:', e);
    }
  },
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
const apiClient = new TaskFlowApiClient(API_BASE_URL, null, expoTokenStorage);

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  // App Navigation & Task State
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'inbox' | 'completed' | 'lists' | 'tags'>('today');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newListTitle, setNewListTitle] = useState('');

  // Task Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('none');
  const [editListId, setEditListId] = useState<string | null>(null);
  const [editTagsInput, setEditTagsInput] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Session Restoration Check
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await expoTokenStorage.getToken();
        if (storedToken) {
          await apiClient.setToken(storedToken);
          const meRes = await apiClient.getCurrentUser();
          setUser(meRes.user);
          setLoggedIn(true);
        }
      } catch (err) {
        await apiClient.setToken(null);
      } finally {
        setInitializing(false);
      }
    }
    restoreSession();
  }, []);

  const fetchTaskData = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, tagRes] = await Promise.all([
        apiClient.getLists(),
        apiClient.getTags(),
      ]);
      setLists(listRes.lists);
      setTags(tagRes.tags);

      let taskParams: any = {};
      if (activeTab === 'lists') {
        if (selectedListId) taskParams.listId = selectedListId;
      } else if (activeTab === 'tags') {
        if (selectedTagId) taskParams.tagId = selectedTagId;
      } else {
        taskParams.view = activeTab;
      }

      const taskRes = await apiClient.getTasks(taskParams);
      setTasks(taskRes.tasks);

      if (selectedTask) {
        const updated = taskRes.tasks.find((t) => t.id === selectedTask.id);
        if (updated) {
          setSelectedTask(updated);
        }
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
  }, [loggedIn, activeTab, selectedListId, selectedTagId]);

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

  const handleLogout = async () => {
    await apiClient.setToken(null);
    setUser(null);
    setLoggedIn(false);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const options: any = {};
      if (activeTab === 'today') {
        options.due_date = getLocalDateString();
      } else if (activeTab === 'lists' && selectedListId) {
        options.list_id = selectedListId;
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

  const openTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditDueDate(task.due_date || '');
    setEditDueTime(task.due_time || '');
    setEditPriority(task.priority);
    setEditListId(task.list_id || null);
    setEditTagsInput(task.tags ? task.tags.map((t) => t.name).join(', ') : '');
    setModalVisible(true);
  };

  const handleSaveTaskDetail = async () => {
    if (!selectedTask) return;
    try {
      const tagList = editTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await apiClient.updateTask(selectedTask.id, {
        title: editTitle.trim() || selectedTask.title,
        notes: editNotes.trim() ? editNotes.trim() : null,
        due_date: editDueDate.trim() ? editDueDate.trim() : null,
        due_time: editDueTime.trim() ? editDueTime.trim() : null,
        priority: editPriority,
        list_id: editListId,
        tags: tagList as any,
      });

      setModalVisible(false);
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not save task details');
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await apiClient.deleteTask(selectedTask.id);
      setModalVisible(false);
      setSelectedTask(null);
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not delete task');
    }
  };

  const handleAddSubtask = async () => {
    if (!selectedTask || !newSubtaskTitle.trim()) return;
    try {
      await apiClient.addSubtask(selectedTask.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not add subtask');
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    try {
      await apiClient.updateSubtask(subtaskId, { completed: !currentCompleted });
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await apiClient.deleteSubtask(subtaskId);
      fetchTaskData();
    } catch (err: any) {
      setError(err.message || 'Could not delete subtask');
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

  if (initializing) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={[styles.subTitle, { marginTop: 12 }]}>Restoring session...</Text>
      </SafeAreaView>
    );
  }

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
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add Bar */}
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

      {/* Navigation Tabs */}
      <View style={styles.tabBar}>
        {(['today', 'upcoming', 'inbox', 'completed', 'lists', 'tags'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => {
              setActiveTab(tab);
              if (tab !== 'lists') setSelectedListId(null);
              if (tab !== 'tags') setSelectedTagId(null);
            }}
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
        ) : activeTab === 'lists' && !selectedListId ? (
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
                <Text style={styles.addButtonText}>Create List</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={lists}
              keyExtractor={(item: List) => item.id}
              renderItem={({ item }: { item: List }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => setSelectedListId(item.id)}
                >
                  <View style={[styles.colorDot, { backgroundColor: item.color || '#3b82f6' }]} />
                  <Text style={styles.listName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : activeTab === 'tags' && !selectedTagId ? (
          <View style={{ flex: 1 }}>
            <FlatList
              data={tags}
              keyExtractor={(item: Tag) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No tags created yet.</Text>}
              renderItem={({ item }: { item: Tag }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => setSelectedTagId(item.id)}
                >
                  <Text style={styles.listName}>#{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {(selectedListId || selectedTagId) && (
              <TouchableOpacity
                style={{ paddingVertical: 8, marginBottom: 8 }}
                onPress={() => {
                  setSelectedListId(null);
                  setSelectedTagId(null);
                }}
              >
                <Text style={{ color: '#38bdf8', fontSize: 13 }}>← Back to All {activeTab.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
            <FlatList
              data={tasks}
              keyExtractor={(item: Task) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No tasks found.</Text>
              }
              renderItem={({ item }: { item: Task }) => (
                <View style={styles.taskCard}>
                  <TouchableOpacity
                    style={[styles.checkbox, item.completed && styles.checkedBox]}
                    onPress={() => handleToggleTask(item)}
                  >
                    {item.completed && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => openTaskDetail(item)}
                  >
                    <Text style={[styles.taskTitle, item.completed && styles.completedTaskTitle]}>
                      {item.title}
                    </Text>
                    <View style={styles.metaRow}>
                      {item.due_date ? <Text style={styles.taskMeta}>Due: {item.due_date}</Text> : null}
                      {item.priority !== 'none' ? <Text style={[styles.taskMeta, { color: '#f59e0b', marginLeft: 8 }]}>{item.priority}</Text> : null}
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}
      </View>

      {/* Task Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Task Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={editTitle}
                onChangeText={setEditTitle}
              />

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 70 }]}
                multiline
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Add notes..."
                placeholderTextColor="#64748b"
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Due Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={editDueDate}
                    onChangeText={setEditDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Due Time (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    value={editDueTime}
                    onChangeText={setEditDueTime}
                    placeholder="14:00"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <Text style={styles.label}>Priority (none / low / medium / high)</Text>
              <TextInput
                style={styles.input}
                value={editPriority}
                onChangeText={(val: string) => setEditPriority(val as Priority)}
              />

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                value={editTagsInput}
                onChangeText={setEditTagsInput}
                placeholder="work, urgent"
                placeholderTextColor="#64748b"
              />

              {/* Subtasks */}
              <Text style={styles.label}>Subtasks</Text>
              {selectedTask?.subtasks?.map((sub) => (
                <View key={sub.id} style={styles.subtaskRow}>
                  <TouchableOpacity onPress={() => handleToggleSubtask(sub.id, sub.completed)}>
                    <Text style={sub.completed ? styles.completedTaskTitle : styles.taskTitle}>
                      {sub.completed ? '[✓] ' : '[ ] '} {sub.title}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteSubtask(sub.id)}>
                    <Text style={{ color: '#ef4444', fontSize: 12 }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="New subtask..."
                  placeholderTextColor="#64748b"
                  value={newSubtaskTitle}
                  onChangeText={setNewSubtaskTitle}
                />
                <TouchableOpacity style={styles.addButton} onPress={handleAddSubtask}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
                  <Text style={styles.deleteButtonText}>Delete Task</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTaskDetail}>
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 10,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    flex: 1,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#fca5a5',
    fontWeight: 'bold',
    fontSize: 13,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  userGreeting: {
    fontSize: 15,
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
    padding: 12,
    gap: 8,
  },
  quickAddInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingHorizontal: 4,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
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
    fontSize: 11,
    fontWeight: 'bold',
  },
  taskTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMeta: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 10,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  closeText: {
    fontSize: 16,
    color: '#94a3b8',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
  },
  subtaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
  },
});
