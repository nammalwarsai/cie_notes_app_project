import React from 'react';
import { Row, Col, Card, Button, Badge } from 'react-bootstrap';

const NotesList = ({ notes, deleteNote }) => {
  const getPriorityVariant = (priority) => {
    switch(priority) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'General': '📌',
      'Work': '💼',
      'Personal': '👤',
      'Study': '📚',
      'Ideas': '💡'
    };
    return icons[category] || '📝';
  };

  return (
    <div>
      <h2 className="mb-3">📋 My Notes</h2>
      {notes.length === 0 ? (
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <h4 className="text-muted">No notes yet!</h4>
            <p className="text-muted">Add your first note above to get started.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {notes.map((note) => (
            <Col key={note.SK || note.noteId || note.id}>
              <Card className="h-100 shadow-sm hover-shadow" style={{ transition: 'all 0.3s' }}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Badge bg={getPriorityVariant(note.priority)}>
                      {note.priority}
                    </Badge>
                    <Badge bg="secondary">
                      {getCategoryIcon(note.category)} {note.category}
                    </Badge>
                  </div>
                  <Card.Title className="mb-3">{note.title}</Card.Title>
                  <Card.Text style={{ 
                    maxHeight: '100px', 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis' 
                  }}>
                    {note.content}
                  </Card.Text>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </small>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this note?')) {
                          deleteNote(note.SK || note.noteId || note.id);
                        }
                      }}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default NotesList;