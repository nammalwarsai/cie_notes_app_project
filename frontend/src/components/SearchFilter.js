import React from 'react';
import { Form, Card } from 'react-bootstrap';

const SearchFilter = ({ searchTerm, setSearchTerm }) => {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Form.Group>
          <Form.Label className="fw-bold">🔍 Search Notes</Form.Label>
          <Form.Control
            type="text"
            placeholder="Search by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );
};

export default SearchFilter;
