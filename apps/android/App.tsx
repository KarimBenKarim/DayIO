import React, { useState } from 'react';
import { TaskFlowApiClient } from '../../packages/shared/src/apiClient';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const client = new TaskFlowApiClient('http://10.0.2.2:3000/api');

  const handleLogin = async () => {
    try {
      await client.login(email, password);
      const res = await client.getTasks({ view: 'today' });
      setTasks(res.tasks);
      setLoggedIn(true);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh' }}>
      <h1>TaskMaster Android App</h1>
      {!loggedIn ? (
        <div>
          <h2>Sign In</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ display: 'block', margin: '10px 0', padding: 8, width: 250 }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            style={{ display: 'block', margin: '10px 0', padding: 8, width: 250 }}
          />
          <button onClick={handleLogin} style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: 4 }}>
            Login
          </button>
        </div>
      ) : (
        <div>
          <h2>Today's Tasks ({tasks.length})</h2>
          <ul>
            {tasks.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
