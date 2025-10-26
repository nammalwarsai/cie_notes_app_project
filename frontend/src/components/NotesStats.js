import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';

const NotesStats = ({ notes }) => {
  const totalNotes = notes.length;
  const highPriority = notes.filter(n => n.priority === 'High').length;
  const categories = [...new Set(notes.map(n => n.category))].length;

  const stats = [
    { title: 'Total Notes', value: totalNotes, bg: 'primary', icon: '📝' },
    { title: 'High Priority', value: highPriority, bg: 'danger', icon: '⚠️' },
    { title: 'Categories', value: categories, bg: 'success', icon: '📂' },
  ];

  return (
    <Row className="mb-4">
      {stats.map((stat, index) => (
        <Col key={index} md={4} className="mb-3">
          <Card className={`text-white bg-${stat.bg} shadow`}>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">{stat.title}</h6>
                  <h2 className="mb-0">{stat.value}</h2>
                </div>
                <div style={{ fontSize: '3rem' }}>{stat.icon}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default NotesStats;
