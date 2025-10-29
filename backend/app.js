const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import services
const userService = require('./services/userService');
const notesService = require('./services/notesService');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user in DynamoDB
    const newUser = await userService.createUser(email, password);

    // Generate JWT token
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Server error during registration' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in DynamoDB
    const user = await userService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await userService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.PK, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.PK, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile (No Auth Required)
app.get('/api/auth/profile', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ email: user.email, id: user.PK });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
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

    await userService.updatePassword(email, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: error.message || 'Server error during password update' });
  }
});

// ============ NOTES ROUTES ============

// Get all notes for user (No Auth Required)
app.get('/api/notes', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    
    console.log('📝 GET /api/notes - Email:', userEmail);
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    console.log('👤 User found:', user ? user.PK : 'NOT FOUND');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userNotes = await notesService.getUserNotes(user.PK);
    console.log('📋 Notes fetched:', userNotes.length);
    res.json(userNotes);
  } catch (error) {
    console.error('❌ Get notes error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error fetching notes', details: error.message });
  }
});

// Get single note (No Auth Required)
app.get('/api/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const userEmail = req.headers['x-user-email'] || req.query.email;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const note = await notesService.getNote(user.PK, noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ error: 'Server error fetching note' });
  }
});

// Create a new note (No Auth Required)
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, category, priority, userEmail } = req.body;

    console.log('✍️ POST /api/notes - Data:', { title, userEmail, category, priority });

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    console.log('👤 User found for note creation:', user ? user.PK : 'NOT FOUND');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newNote = await notesService.createNote(user.PK, {
      title,
      content,
      category,
      priority
    });

    console.log('✅ Note created:', newNote.noteId);
    res.status(201).json({ message: 'Note created successfully', note: newNote });
  } catch (error) {
    console.error('❌ Create note error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error while creating note', details: error.message });
  }
});

// Update a note (No Auth Required)
app.put('/api/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const { title, content, category, priority, userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if note exists
    const existingNote = await notesService.getNote(user.PK, noteId);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Update note
    const updatedNote = await notesService.updateNote(user.PK, noteId, {
      title: title || existingNote.title,
      content: content || existingNote.content,
      category: category || existingNote.category,
      priority: priority || existingNote.priority
    });

    res.json({ message: 'Note updated successfully', note: updatedNote });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Server error while updating note' });
  }
});

// Delete a note (No Auth Required)
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const noteId = req.params.id;
    const userEmail = req.headers['x-user-email'] || req.query.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if note exists
    const existingNote = await notesService.getNote(user.PK, noteId);
    if (!existingNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await notesService.deleteNote(user.PK, noteId);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error while deleting note' });
  }
});

// ============ STATS ROUTE ============

// Get user statistics (No Auth Required)
app.get('/api/stats', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'] || req.query.email;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const user = await userService.findUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await notesService.getUserStats(user.PK);
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// Get public statistics (no authentication required)
app.get('/api/stats/public', async (req, res) => {
  try {
    // For public stats, we would need to scan all users and notes
    // This is a simplified version
    res.json({
      totalUsers: 0,
      totalNotes: 0,
      notesByPriority: {
        High: 0,
        Medium: 0,
        Low: 0
      },
      notesByCategory: {},
      message: 'Public stats require scanning all data - implement as needed'
    });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ error: 'Server error fetching public stats' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running with DynamoDB',
    timestamp: new Date().toISOString(),
    database: 'AWS DynamoDB',
    table: process.env.DYNAMODB_TABLE_NAME
  });
});

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    message: '📝 Notes App API - AWS DynamoDB Backend',
    version: '2.0.0',
    database: 'AWS DynamoDB',
    authentication: 'Email-based (No token required for operations)',
    endpoints: {
      health: 'GET /api/health - Health check',
      auth: {
        register: 'POST /api/auth/register - Register new user',
        login: 'POST /api/auth/login - Login user',
        profile: 'GET /api/auth/profile?email=user@example.com - Get user profile',
        updatePassword: 'PUT /api/auth/password - Update password'
      },
      notes: {
        getAll: 'GET /api/notes - Get all notes (requires email)',
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
    note: 'Data stored in AWS DynamoDB!'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`☁️  Connected to AWS DynamoDB`);
  console.log(`📊 Table: ${process.env.DYNAMODB_TABLE_NAME}`);
  console.log(`📝 API Documentation:`);
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
  console.log(`   ✅ Data stored in AWS DynamoDB!`);
});