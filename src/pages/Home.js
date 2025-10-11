import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  BookOpen, 
  Mic, 
  BarChart3, 
  Trophy, 
  Star,
  Target,
  Users,
  Clock,
  Award,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CORE_WORDS } from '../data/phonemes';
import progressService from '../services/progressService';

const Home = () => {
  const { state } = useApp();
  const [realProgress, setRealProgress] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Load real progress data
  useEffect(() => {
    const currentProgress = progressService.getProgress();
    const currentStats = progressService.getStatistics();
    setRealProgress(currentProgress);
    setStatistics(currentStats);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  const quickActions = [
    {
      title: 'Learn Phonemes',
      description: 'Start with individual sounds',
      icon: BookOpen,
      link: '/phoneme/h',
      color: 'linear-gradient(45deg, #ff6b6b, #ff8e8e)',
      progress: state.progress?.phonemesLearned?.length || 0,
      total: 12
    },
    {
      title: 'Practice Words',
      description: 'Combine sounds into words',
      icon: Mic,
      link: '/word/help',
      color: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
      progress: state.progress?.wordsCompleted?.length || 0,
      total: CORE_WORDS.length
    },
    {
      title: 'Sentence Analysis',
      description: 'Practice full sentences',
      icon: BarChart3,
      link: '/sentence',
      color: 'linear-gradient(45deg, #45b7d1, #96c93d)',
      progress: realProgress?.totalSentencesPracticed || 0,
      total: 50
    },
    {
      title: 'View Progress',
      description: 'Track your achievements',
      icon: Trophy,
      link: '/progress',
      color: 'linear-gradient(45deg, #f093fb, #f5576c)',
      progress: realProgress?.totalSessions || 0,
      total: 100
    }
  ];

  const stats = [
    {
      label: 'Sessions Completed',
      value: realProgress?.totalSessions || 0,
      icon: BarChart3,
      color: '#ffd700'
    },
    {
      label: 'Current Streak',
      value: realProgress?.streak || 0,
      icon: Target,
      color: '#ff6b6b'
    },
    {
      label: 'Sentences Practiced',
      value: realProgress?.totalSentencesPracticed || 0,
      icon: Mic,
      color: '#4ecdc4'
    },
    {
      label: 'Average Accuracy',
      value: Math.round(realProgress?.averageAccuracy || 0),
      icon: TrendingUp,
      color: '#45b7d1'
    }
  ];

  return (
    <div className="main-content">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="home-container"
      >
        {/* Welcome Section */}
        <motion.div variants={itemVariants} className="welcome-section">
          <div className="welcome-content">
            <h1>Welcome to VANI! 🎯</h1>
            <p>Your speech learning adventure starts here. Let's practice together and improve your communication skills!</p>
          </div>
          <div className="welcome-illustration">
            <motion.div
              className="floating-emoji"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              🗣️
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div variants={itemVariants} className="stats-section">
          <h2>Your Progress</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="stat-card"
                  whileHover={{ scale: 1.05 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="stat-icon" style={{ color: stat.color }}>
                    <Icon size={24} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="quick-actions-section">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const progressPercentage = (action.progress / action.total) * 100;
              
              return (
                <motion.div
                  key={action.title}
                  className="action-card"
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={action.link} className="action-link">
                    <div 
                      className="action-header"
                      style={{ background: action.color }}
                    >
                      <Icon size={32} />
                    </div>
                    <div className="action-content">
                      <h3>{action.title}</h3>
                      <p>{action.description}</p>
                      <div className="action-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${progressPercentage}%`,
                              background: action.color
                            }}
                          />
                        </div>
                        <span className="progress-text">
                          {action.progress}/{action.total}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Learning Modes */}
        <motion.div variants={itemVariants} className="learning-modes-section">
          <h2>Choose Your Learning Mode</h2>
          <div className="modes-grid">
            <motion.div 
              className="mode-card guided-mode"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="mode-icon">🎯</div>
              <h3>Guided Learning</h3>
              <p>Follow structured lessons designed by speech therapists</p>
              <ul>
                <li>Step-by-step phoneme practice</li>
                <li>Visual guides and animations</li>
                <li>Progress tracking</li>
              </ul>
              <Link to="/phoneme/h" className="btn btn-primary">
                <Play size={20} />
                Start Guided Learning
              </Link>
            </motion.div>

            <motion.div 
              className="mode-card practice-mode"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="mode-icon">🎮</div>
              <h3>Practice Mode</h3>
              <p>AI-powered personalized practice sessions</p>
              <ul>
                <li>Adaptive difficulty</li>
                <li>Real-time feedback</li>
                <li>Gamified challenges</li>
              </ul>
              <Link to="/word/help" className="btn btn-secondary">
                <Mic size={20} />
                Start Practice
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div variants={itemVariants} className="daily-challenge-section">
          <div className="challenge-card">
            <div className="challenge-header">
              <h3>🌟 Daily Challenge</h3>
              <div className="challenge-timer">
                <Clock size={16} />
                <span>23:45:12</span>
              </div>
            </div>
            <p>Practice the phoneme /h/ 5 times today to earn bonus points!</p>
            <div className="challenge-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }} />
              </div>
              <span>3/5 completed</span>
            </div>
            <Link to="/phoneme/h" className="btn btn-success">
              Take Challenge
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Home;

