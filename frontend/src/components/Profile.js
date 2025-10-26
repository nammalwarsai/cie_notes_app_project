import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Try backend API first
      await authAPI.updatePassword(newPassword);
      setSuccess('Password updated successfully!');
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (apiError) {
      // Fallback to localStorage
      console.log('API password update failed, using localStorage fallback');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.email === user.email);
      
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        localStorage.setItem('users', JSON.stringify(users));
        setSuccess('Password updated successfully!');
        setIsEditing(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError('Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Profile</h2>
              
              <div className="mb-4 p-3 bg-light rounded">
                <h5>Account Information</h5>
                <hr />
                <p className="mb-2">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="mb-0">
                  <strong>Password:</strong> ••••••••
                </p>
              </div>

              {!isEditing ? (
                <Button 
                  variant="primary" 
                  onClick={() => setIsEditing(true)}
                  className="w-100"
                >
                  Change Password
                </Button>
              ) : (
                <>
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control 
                        type="password" 
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control 
                        type="password" 
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </Form.Group>

                    <div className="d-grid gap-2">
                      <Button variant="success" type="submit" disabled={loading}>
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Updating...
                          </>
                        ) : (
                          'Update Password'
                        )}
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => {
                          setIsEditing(false);
                          setNewPassword('');
                          setConfirmPassword('');
                          setError('');
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
