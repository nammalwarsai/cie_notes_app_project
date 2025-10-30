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
  const [backendAvailable, setBackendAvailable] = useState(false);

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
      setBackendAvailable(true);
      console.log('✅ Backend connected successfully');
      return true;
    } catch (error) {
      setBackendAvailable(false);
      setError('⚠️ Backend server is not running. Please start the backend server.');
      console.error('❌ Backend not available:', error);
      return false;
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');

      const fetchedNotes = await notesAPI.getAllNotes();
      console.log('📋 Fetched notes:', fetchedNotes);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('❌ Error fetching notes:', error);
      setError('Failed to fetch notes. Please ensure backend is running.');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (noteData) => {
    try {
      const response = await notesAPI.createNote(noteData);
      console.log('✅ Note created:', response.note);
      setNotes([...notes, response.note]);
      setError('');
    } catch (error) {
      console.error('❌ Error adding note:', error);
      setError('Failed to add note. Please ensure backend is running.');
    }
  };

  const deleteNote = async (noteId) => {
    try {
      console.log('🗑️ Attempting to delete note:', noteId);
      await notesAPI.deleteNote(noteId);
      console.log('✅ Note deleted successfully from backend');
      
      // Update local state - remove the deleted note
      setNotes(prevNotes => prevNotes.filter(note => note.SK !== noteId));
      setError('');
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      setError('Failed to delete note. Please ensure backend is running.');
    }
  };

  return (
    <Container className="py-4">
      {!backendAvailable && (
        <Alert variant="danger" className="mb-3">
          ⚠️ Backend server is not running. Please start the backend server to use the application.
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
          />
        </>
      )}
    </Container>
  );
};

export default Dashboard;
