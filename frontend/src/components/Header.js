import React, { useState, useEffect } from 'react';
import { Navbar, Container, Nav, Button, Dropdown } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ isAuthenticated, setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    setUser(currentUser);
  }, [isAuthenticated, location]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow">
      <Container>
        <Navbar.Brand onClick={() => isAuthenticated && navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          📝 Notes App
        </Navbar.Brand>
        
        {isAuthenticated && (
          <>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
              <Nav className="ms-auto align-items-center">
                <Nav.Link onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Nav.Link>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                    👤 {user?.email}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => navigate('/profile')}>
                      Profile
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav>
            </Navbar.Collapse>
          </>
        )}
      </Container>
    </Navbar>
  );
};

export default Header;