import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';

const NoteForm = ({ addNote }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('Medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    
    addNote({ title, content, category, priority });
    setTitle('');
    setContent('');
    setCategory('General');
    setPriority('Medium');
  };

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Body>
        <Card.Title className="mb-3">✏️ Add New Note</Card.Title>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Enter note title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={4} 
              placeholder="Enter note content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Button variant="primary" type="submit" className="w-100">
            Add Note
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default NoteForm;