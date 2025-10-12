import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PhonemeLearning from './pages/PhonemeLearning';
import WordPractice from './pages/WordPractice';
import SentenceAnalysis from './pages/SentenceAnalysis';
import Progress from './pages/Progress';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Context
import { AppProvider } from './context/AppContext';

// Styles
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (using localStorage for now)
    const user = localStorage.getItem('vani_user');
    if (user) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <motion.div
          className="loading-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          🎯
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          VANI
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Speech Practice for Hearing-Impaired Children
        </motion.p>
      </div>
    );
  }

  return (
    <AppProvider>
      <Router>
        <div className="App">
          <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
          
          <AnimatePresence mode="wait">
            <Routes>
              <Route 
                path="/" 
                element={
                  isAuthenticated ? 
                    <Home /> : 
                    <Navigate to="/login" replace />
                } 
              />
              <Route 
                path="/login" 
                element={
                  !isAuthenticated ? 
                    <Login setIsAuthenticated={setIsAuthenticated} /> : 
                    <Navigate to="/" replace />
                } 
              />
              <Route 
                path="/signup" 
                element={
                  !isAuthenticated ? 
                    <Signup setIsAuthenticated={setIsAuthenticated} /> : 
                    <Navigate to="/" replace />
                } 
              />
              <Route 
                path="/phoneme" 
                element={
                  isAuthenticated ? 
                    <PhonemeLearning /> : 
                    <Navigate to="/login" replace />
                } 
              />
              <Route 
                path="/phoneme/:phonemeId" 
                element={
                  isAuthenticated ? 
                    <PhonemeLearning /> : 
                    <Navigate to="/login" replace />
                } 
              />
              <Route 
                path="/word/:wordId" 
                element={
                  isAuthenticated ? 
                    <WordPractice /> : 
                    <Navigate to="/login" replace />
                } 
              />
              <Route 
                path="/sentence" 
                element={
                  isAuthenticated ? 
                    <SentenceAnalysis /> : 
                    <Navigate to="/login" replace />
                } 
              />
              <Route 
                path="/progress" 
                element={
                  isAuthenticated ? 
                    <Progress /> : 
                    <Navigate to="/login" replace />
                } 
              />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;

