import React, { useState } from 'react';
import { Row, Col, Card, Button, Badge, Modal, Form } from 'react-bootstrap';

const NotesList = ({ notes, deleteNote, updateNote }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');

  const handleEdit = (note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setEditPriority(note.priority);
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    updateNote(editingNote.id, {
      title: editTitle,
      content: editContent,
      category: editCategory,
      priority: editPriority
    });
    setShowEditModal(false);
  };

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
            <Col key={note.id}>
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
                    <div>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEdit(note)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this note?')) {
                            deleteNote(note.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control 
                type="text" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Content</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    <option value="General">General</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Study">Study</option>
                    <option value="Ideas">Ideas</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select 
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NotesList;