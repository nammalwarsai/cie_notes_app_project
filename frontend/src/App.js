import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Header from './components/Header';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      setIsAuthenticated(true);
    }
  }, []);

  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <Header isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Login setIsAuthenticated={setIsAuthenticated} />
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <Signup />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/profile" 
            element={
              isAuthenticated ? 
              <Profile /> : 
              <Navigate to="/login" />
            } 
          />
          <Route 
            path="/" 
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;