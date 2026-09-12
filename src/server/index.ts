import { app } from './app.js';
import { initializeDatabase } from './db/schema.js';

const PORT = process.env.PORT || 3000;

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Task Master Server running on http://localhost:${PORT}`);
});
