import React, { useEffect, useState } from 'react';
import { Container, Alert, Spinner } from 'react-bootstrap';
import NoteForm from './NoteForm';
import NotesList from './NotesList';
import NotesStats from './NotesStats';
import SearchFilter from './SearchFilter';
import { notesAPI, checkHealth } from '../services/api';

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      await checkBackendConnection();
      await fetchNotes();
    };
    initializeDashboard();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNotes(filtered);
    } else {
      setFilteredNotes(notes);
    }
  }, [notes, searchTerm]);

  const checkBackendConnection = async () => {
    try {
      await checkHealth();
      setUseBackend(true);
      console.log('✅ Backend connected successfully');
      return true;
    } catch (error) {
      setUseBackend(false);
      console.log('⚠️ Backend not available, using localStorage');
      return false;
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');

      // Check backend connection first
      let isBackendAvailable = useBackend;
      if (!isBackendAvailable) {
        isBackendAvailable = await checkBackendConnection();
      }

      if (isBackendAvailable) {
        // Fetch from backend
        const fetchedNotes = await notesAPI.getAllNotes();
        setNotes(fetchedNotes);
      } else {
        // Fallback to localStorage
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const userNotes = user ? storedNotes.filter(note => note.userEmail === user.email) : [];
        setNotes(userNotes);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      // Fallback to localStorage
      const user = JSON.parse(localStorage.getItem('currentUser'));
      const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
      const userNotes = user ? storedNotes.filter(note => note.userEmail === user.email) : [];
      setNotes(userNotes);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (noteData) => {
    try {
      if (useBackend) {
        // Add via backend
        const response = await notesAPI.createNote(noteData);
        setNotes([...notes, response.note]);
      } else {
        // Fallback to localStorage
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const newNote = {
          ...noteData,
          id: Date.now(),
          userEmail: user.email,
          createdAt: new Date().toISOString(),
          category: noteData.category || 'General',
          priority: noteData.priority || 'Medium'
        };
        
        const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const updatedNotes = [...storedNotes, newNote];
        localStorage.setItem('notes', JSON.stringify(updatedNotes));
        setNotes([...notes, newNote]);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setError('Failed to add note. Please try again.');
    }
  };

  const deleteNote = async (noteId) => {
    try {
      // Check backend connection
      let isBackendAvailable = useBackend;
      
      if (isBackendAvailable) {
        try {
          // Delete via backend
          await notesAPI.deleteNote(noteId);
          console.log('✅ Note deleted from backend');
        } catch (backendError) {
          console.error('Backend delete failed, falling back to localStorage:', backendError);
          isBackendAvailable = false;
          setUseBackend(false);
        }
      }
      
      if (!isBackendAvailable) {
        // Fallback to localStorage
        const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const updatedNotes = storedNotes.filter(note => note.id !== noteId);
        localStorage.setItem('notes', JSON.stringify(updatedNotes));
        console.log('✅ Note deleted from localStorage');
      }
      
      // Update local state regardless of storage method
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note. Please try again.');
    }
  };

  const updateNote = async (noteId, updatedData) => {
    try {
      if (useBackend) {
        // Update via backend
        const response = await notesAPI.updateNote(noteId, updatedData);
        setNotes(notes.map(note => note.id === noteId ? response.note : note));
      } else {
        // Fallback to localStorage
        const updatedNotes = notes.map(note => 
          note.id === noteId ? { ...note, ...updatedData } : note
        );
        setNotes(updatedNotes);
        
        const storedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
        const allUpdatedNotes = storedNotes.map(note => 
          note.id === noteId ? { ...note, ...updatedData } : note
        );
        localStorage.setItem('notes', JSON.stringify(allUpdatedNotes));
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note. Please try again.');
    }
  };

  return (
    <Container className="py-4">
      {!useBackend && (
        <Alert variant="warning" className="mb-3">
          ⚠️ Backend server is not running. Using local storage mode.
        </Alert>
      )}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your notes...</p>
        </div>
      ) : (
        <>
          <NotesStats notes={filteredNotes} />
          <SearchFilter searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          <NoteForm addNote={addNote} />
          <NotesList 
            notes={filteredNotes} 
            deleteNote={deleteNote}
            updateNote={updateNote}
          />
        </>
      )}
    </Container>
  );
};

export default Dashboard;
