import React, { useState } from 'react';
import { Form, Button, Card, Container, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Try API login first
      const response = await authAPI.login(email, password);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (apiError) {
      // Fallback to localStorage if API fails
      console.log('API login failed, using localStorage fallback');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);

      if (user) {
        localStorage.setItem('currentUser', JSON.stringify({ email }));
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <Card className="shadow">
          <Card.Body className="p-4">
            <h2 className="text-center mb-4">Login</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control 
                  type="email" 
                  placeholder="Enter email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
              
              <div className="text-center">
                <span>Don't have an account? </span>
                <Button variant="link" onClick={() => navigate('/signup')} className="p-0">
                  Sign Up
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Login;
