const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Public Routes (No JWT required)
app.use('/', require('./routes/google.routes'));

// Protected Routes (JWT automatically required for all sub-routes)
app.use('/api', require('./routes/protected.routes'));

// Import scheduler to start it
require('./services/scheduler');

app.get('/', (req, res) => {
  res.send('Faculty Reminder MCP API is running.');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
