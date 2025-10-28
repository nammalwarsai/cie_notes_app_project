const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your-secret-key-change-in-production';

// In-memory storage (for development - use database in production)
let users = [];
let notes = [];

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// ============ AUTH ROUTES ============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: Date.now(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile (No Auth Required)
app.get('/api/auth/profile', (req, res) => {
  const userEmail = req.headers['x-user-email'] || req.query.email;
  
  if (!userEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = users.find(u => u.email === userEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ email: user.email, id: user.id });
});

// Update password (No Auth Required)
app.put('/api/auth/password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Server error during password update' });
  }
});

// ============ NOTES ROUTES ============

// Get all notes for user (No Auth Required)
app.get('/api/notes', (req, res) => {
  const userEmail = req.headers['x-user-email'] || req.query.email;
  
  if (userEmail) {
    const user = users.find(u => u.email === userEmail);
    if (user) {
      const userNotes = notes.filter(note => note.userId === user.id);
      return res.json(userNotes);
    }
  }
  
  // Return all notes if no email provided
  res.json(notes);
});

// Get single note (No Auth Required)
app.get('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  res.json(note);
});

// Create a new note (No Auth Required)
app.post('/api/notes', (req, res) => {
  try {
    const { title, content, category, priority, userEmail } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = users.find(u => u.email === userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newNote = {
      id: Date.now(),
      userId: user.id,
      userEmail: user.email,
      title,
      content,
      category: category || 'General',
      priority: priority || 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    notes.push(newNote);
    res.status(201).json({ message: 'Note created successfully', note: newNote });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Server error while creating note' });
  }
});

// Update a note (No Auth Required)
app.put('/api/notes/:id', (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const { title, content, category, priority, userEmail } = req.body;

    const noteIndex = notes.findIndex(n => n.id === noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Optional: Verify user ownership if email is provided
    if (userEmail && notes[noteIndex].userEmail !== userEmail) {
      return res.status(403).json({ error: 'Not authorized to update this note' });
    }

    // Update note
    notes[noteIndex] = {
      ...notes[noteIndex],
      title: title || notes[noteIndex].title,
      content: content || notes[noteIndex].content,
      category: category || notes[noteIndex].category,
      priority: priority || notes[noteIndex].priority,
      updatedAt: new Date().toISOString()
    };

    res.json({ message: 'Note updated successfully', note: notes[noteIndex] });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Server error while updating note' });
  }
});

// Delete a note (No Auth Required)
app.delete('/api/notes/:id', (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const userEmail = req.headers['x-user-email'] || req.query.email;
    
    const noteIndex = notes.findIndex(n => n.id === noteId);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Optional: Verify user ownership if email is provided
    if (userEmail && notes[noteIndex].userEmail !== userEmail) {
      return res.status(403).json({ error: 'Not authorized to delete this note' });
    }

    notes.splice(noteIndex, 1);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error while deleting note' });
  }
});

// ============ STATS ROUTE ============

// Get user statistics (No Auth Required)
app.get('/api/stats', (req, res) => {
  const userEmail = req.headers['x-user-email'] || req.query.email;
  
  let userNotes = notes;
  
  // Filter by user email if provided
  if (userEmail) {
    const user = users.find(u => u.email === userEmail);
    if (user) {
      userNotes = notes.filter(note => note.userId === user.id);
    }
  }
  
  const stats = {
    totalNotes: userNotes.length,
    highPriority: userNotes.filter(n => n.priority === 'High').length,
    categories: [...new Set(userNotes.map(n => n.category))].length,
    byCategory: {},
    byPriority: {
      High: userNotes.filter(n => n.priority === 'High').length,
      Medium: userNotes.filter(n => n.priority === 'Medium').length,
      Low: userNotes.filter(n => n.priority === 'Low').length
    }
  };

  // Count notes by category
  userNotes.forEach(note => {
    stats.byCategory[note.category] = (stats.byCategory[note.category] || 0) + 1;
  });

  res.json(stats);
});

// Get public statistics (no authentication required)
app.get('/api/stats/public', (req, res) => {
  const stats = {
    totalUsers: users.length,
    totalNotes: notes.length,
    notesByPriority: {
      High: notes.filter(n => n.priority === 'High').length,
      Medium: notes.filter(n => n.priority === 'Medium').length,
      Low: notes.filter(n => n.priority === 'Low').length
    },
    notesByCategory: {}
  };

  // Count all notes by category
  notes.forEach(note => {
    stats.notesByCategory[note.category] = (stats.notesByCategory[note.category] || 0) + 1;
  });

  res.json(stats);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    users: users.length,
    notes: notes.length
  });
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    message: '📝 Notes App API - NO AUTH REQUIRED',
    version: '1.0.0',
    authentication: 'DISABLED - All endpoints are publicly accessible',
    endpoints: {
      health: 'GET /api/health - Health check',
      auth: {
        register: 'POST /api/auth/register - Register new user',
        login: 'POST /api/auth/login - Login user',
        profile: 'GET /api/auth/profile?email=user@example.com - Get user profile',
        updatePassword: 'PUT /api/auth/password - Update password'
      },
      notes: {
        getAll: 'GET /api/notes - Get all notes (or ?email=user@example.com for user notes)',
        getOne: 'GET /api/notes/:id - Get single note',
        create: 'POST /api/notes - Create note (include userEmail in body)',
        update: 'PUT /api/notes/:id - Update note',
        delete: 'DELETE /api/notes/:id - Delete note'
      },
      stats: {
        user: 'GET /api/stats?email=user@example.com - Get user statistics',
        public: 'GET /api/stats/public - Get public statistics'
      }
    },
    note: 'All endpoints are open - No authentication required!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation - ALL ENDPOINTS NO AUTH REQUIRED:`);
  console.log(``);
  console.log(`   Auth Endpoints:`);
  console.log(`   - POST /api/auth/register    - Register new user`);
  console.log(`   - POST /api/auth/login       - Login user`);
  console.log(`   - GET  /api/auth/profile     - Get user profile`);
  console.log(`   - PUT  /api/auth/password    - Update password`);
  console.log(``);
  console.log(`   Notes Endpoints:`);
  console.log(`   - GET  /api/notes            - Get all notes`);
  console.log(`   - GET  /api/notes/:id        - Get single note`);
  console.log(`   - POST /api/notes            - Create note`);
  console.log(`   - PUT  /api/notes/:id        - Update note`);
  console.log(`   - DELETE /api/notes/:id      - Delete note`);
  console.log(``);
  console.log(`   Stats & Utility:`);
  console.log(`   - GET  /api/stats            - Get statistics`);
  console.log(`   - GET  /api/stats/public     - Get public statistics`);
  console.log(`   - GET  /api/health           - Health check`);
  console.log(`   - GET  /                     - API documentation`);
  console.log(``);
  console.log(`   ✅ NO AUTHENTICATION REQUIRED - All endpoints are open!`);
});