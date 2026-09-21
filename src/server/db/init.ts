import { db } from './client.js';
import { initializeDatabase } from './schema.js';

initializeDatabase();
console.log('Database initialized successfully.');
