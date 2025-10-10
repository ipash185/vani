import React from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  Calendar, 
  Award,
  TrendingUp,
  BookOpen,
  Mic
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CORE_WORDS } from '../data/phonemes';

const Progress = () => {
  const { state } = useApp();

  const progress = state.progress || {};
  const totalPhonemes = 12; // Total phonemes in the system
  const totalWords = CORE_WORDS.length;

  const achievements = [
    {
      id: 'first_phoneme',
      title: 'First Phoneme',
      description: 'Learned your first phoneme',
      icon: '🎯',
      unlocked: progress.phonemesLearned?.length > 0,
      date: '2024-01-15'
    },
    {
      id: 'phoneme_master',
      title: 'Phoneme Master',
      description: 'Learned 5 phonemes',
      icon: '🏆',
      unlocked: progress.phonemesLearned?.length >= 5,
      date: '2024-01-20'
    },
    {
      id: 'word_builder',
      title: 'Word Builder',
      description: 'Completed your first word',
      icon: '📚',
      unlocked: progress.wordsCompleted?.length > 0,
      date: '2024-01-18'
    },
    {
      id: 'streak_keeper',
      title: 'Streak Keeper',
      description: 'Maintained a 7-day streak',
      icon: '🔥',
      unlocked: progress.streak >= 7,
      date: '2024-01-25'
    }
  ];

  const weeklyProgress = [
    { day: 'Mon', phonemes: 2, words: 1 },
    { day: 'Tue', phonemes: 3, words: 2 },
    { day: 'Wed', phonemes: 1, words: 1 },
    { day: 'Thu', phonemes: 4, words: 3 },
    { day: 'Fri', phonemes: 2, words: 2 },
    { day: 'Sat', phonemes: 3, words: 1 },
    { day: 'Sun', phonemes: 1, words: 1 }
  ];

  const stats = [
    {
      label: 'Total Points',
      value: progress.totalPoints || 0,
      icon: Star,
      color: '#ffd700',
      change: '+25 this week'
    },
    {
      label: 'Current Streak',
      value: progress.streak || 0,
      icon: Target,
      color: '#ff6b6b',
      change: 'days'
    },
    {
      label: 'Phonemes Learned',
      value: progress.phonemesLearned?.length || 0,
      icon: BookOpen,
      color: '#4ecdc4',
      change: `of ${totalPhonemes}`
    },
    {
      label: 'Words Completed',
      value: progress.wordsCompleted?.length || 0,
      icon: Mic,
      color: '#45b7d1',
      change: `of ${totalWords}`
    }
  ];

  return (
    <div className="main-content">
      <div className="progress-container">
        {/* Header */}
        <div className="progress-header">
          <h1>Your Progress</h1>
          <p>Track your speech learning journey and achievements</p>
        </div>

        {/* Stats Overview */}
        <div className="stats-overview">
          <h2>Overview</h2>
          <div className="stats-grid">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="stat-icon" style={{ color: stat.color }}>
                    <Icon size={32} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-change">{stat.change}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="weekly-progress">
          <h2>Weekly Activity</h2>
          <div className="progress-chart">
            {weeklyProgress.map((day, index) => (
              <motion.div
                key={day.day}
                className="day-column"
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="day-label">{day.day}</div>
                <div className="day-bars">
                  <div 
                    className="phoneme-bar"
                    style={{ height: `${(day.phonemes / 5) * 100}%` }}
                    title={`${day.phonemes} phonemes`}
                  />
                  <div 
                    className="word-bar"
                    style={{ height: `${(day.words / 3) * 100}%` }}
                    title={`${day.words} words`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color phoneme-color"></div>
              <span>Phonemes</span>
            </div>
            <div className="legend-item">
              <div className="legend-color word-color"></div>
              <span>Words</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="achievements-section">
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="achievement-icon">
                  {achievement.unlocked ? achievement.icon : '🔒'}
                </div>
                <div className="achievement-content">
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  {achievement.unlocked && (
                    <div className="achievement-date">
                      <Calendar size={14} />
                      <span>{achievement.date}</span>
                    </div>
                  )}
                </div>
                {achievement.unlocked && (
                  <div className="achievement-badge">
                    <Award size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div className="learning-path">
          <h2>Learning Path</h2>
          <div className="path-progress">
            <div className="path-item completed">
              <div className="path-icon">🎯</div>
              <div className="path-content">
                <h3>Basic Phonemes</h3>
                <p>Learn fundamental sounds</p>
                <div className="path-progress-bar">
                  <div className="path-progress-fill" style={{ width: '75%' }} />
                </div>
                <span className="path-percentage">75%</span>
              </div>
            </div>
            
            <div className="path-item in-progress">
              <div className="path-icon">📚</div>
              <div className="path-content">
                <h3>Word Building</h3>
                <p>Combine phonemes into words</p>
                <div className="path-progress-bar">
                  <div className="path-progress-fill" style={{ width: '40%' }} />
                </div>
                <span className="path-percentage">40%</span>
              </div>
            </div>
            
            <div className="path-item locked">
              <div className="path-icon">🗣️</div>
              <div className="path-content">
                <h3>Sentence Practice</h3>
                <p>Practice complete sentences</p>
                <div className="path-progress-bar">
                  <div className="path-progress-fill" style={{ width: '0%' }} />
                </div>
                <span className="path-percentage">0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="recommendations">
          <h2>Recommendations</h2>
          <div className="recommendation-cards">
            <motion.div
              className="recommendation-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp size={24} />
              <h3>Continue Your Streak</h3>
              <p>You're on a {progress.streak || 0} day streak! Keep practicing daily to maintain your progress.</p>
            </motion.div>
            
            <motion.div
              className="recommendation-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BookOpen size={24} />
              <h3>Learn New Phonemes</h3>
              <p>You've mastered {progress.phonemesLearned?.length || 0} phonemes. Try learning the /r/ sound next!</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
