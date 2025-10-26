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

// Get current user profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ email: user.email, id: user.id });
});

// Update password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = users.find(u => u.id === req.user.id);
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

// Get all notes for logged-in user
app.get('/api/notes', authenticateToken, (req, res) => {
  const userNotes = notes.filter(note => note.userId === req.user.id);
  res.json(userNotes);
});

// Get single note
app.get('/api/notes/:id', authenticateToken, (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id) && n.userId === req.user.id);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  res.json(note);
});

// Create a new note
app.post('/api/notes', authenticateToken, (req, res) => {
  try {
    const { title, content, category, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const newNote = {
      id: Date.now(),
      userId: req.user.id,
      userEmail: req.user.email,
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

// Update a note
app.put('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const { title, content, category, priority } = req.body;

    const noteIndex = notes.findIndex(n => n.id === noteId && n.userId === req.user.id);
    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
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

// Delete a note
app.delete('/api/notes/:id', authenticateToken, (req, res) => {
  try {
    const noteId = parseInt(req.params.id);
    const noteIndex = notes.findIndex(n => n.id === noteId && n.userId === req.user.id);

    if (noteIndex === -1) {
      return res.status(404).json({ error: 'Note not found' });
    }

    notes.splice(noteIndex, 1);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Server error while deleting note' });
  }
});

// ============ STATS ROUTE ============

// Get user statistics
app.get('/api/stats', authenticateToken, (req, res) => {
  const userNotes = notes.filter(note => note.userId === req.user.id);
  
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 API Documentation:`);
  console.log(`   - POST /api/auth/register - Register new user`);
  console.log(`   - POST /api/auth/login - Login user`);
  console.log(`   - GET  /api/auth/profile - Get user profile`);
  console.log(`   - PUT  /api/auth/password - Update password`);
  console.log(`   - GET  /api/notes - Get all notes`);
  console.log(`   - POST /api/notes - Create note`);
  console.log(`   - PUT  /api/notes/:id - Update note`);
  console.log(`   - DELETE /api/notes/:id - Delete note`);
  console.log(`   - GET  /api/stats - Get user statistics`);
  console.log(`   - GET  /api/health - Health check`);
});