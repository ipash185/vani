import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  Mic, 
  BarChart3, 
  Settings, 
  LogOut,
  Menu,
  X,
  Trophy,
  Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { state } = useApp();

  const handleLogout = () => {
    localStorage.removeItem('vani_user');
    localStorage.removeItem('vani_user_data');
    setIsAuthenticated(false);
    setIsMenuOpen(false);
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/phoneme/h', icon: BookOpen, label: 'Learn' },
    { path: '/word/help', icon: Mic, label: 'Practice' },
    { path: '/sentence', icon: BarChart3, label: 'Sentences' },
    { path: '/progress', icon: Trophy, label: 'Progress' }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🎯 VANI
          </motion.div>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    className="navbar-link-indicator"
                    layoutId="navbar-indicator"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* User Info & Actions */}
        <div className="navbar-actions">
          {/* Points Display */}
          <div className="points-display">
            <Star className="points-icon" size={16} />
            <span>{state.progress?.totalPoints || 0}</span>
          </div>

          {/* Streak Display */}
          <div className="streak-display">
            <Trophy className="streak-icon" size={16} />
            <span>{state.progress?.streak || 0}</span>
          </div>

          {/* Settings */}
          <Link to="/settings" className="navbar-action-btn">
            <Settings size={20} />
          </Link>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className="navbar-action-btn logout-btn"
            title="Logout"
          >
            <LogOut size={20} />
          </button>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ 
          opacity: isMenuOpen ? 1 : 0, 
          height: isMenuOpen ? 'auto' : 0 
        }}
        transition={{ duration: 0.3 }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
