import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Target, 
  Calendar, 
  Award,
  TrendingUp,
  BookOpen,
  Mic,
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CORE_WORDS } from '../data/phonemes';
import progressService from '../services/progressService';

const Progress = () => {
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

  const progress = state.progress || {};
  const totalPhonemes = 12; // Total phonemes in the system
  const totalWords = CORE_WORDS.length;

  const achievements = [
    {
      id: 'first_session',
      title: 'First Session',
      description: 'Completed your first practice session',
      icon: '🎯',
      unlocked: realProgress?.totalSessions > 0,
      date: realProgress?.lastSessionDate ? new Date(realProgress.lastSessionDate).toLocaleDateString() : null
    },
    {
      id: 'sentence_practitioner',
      title: 'Sentence Practitioner',
      description: 'Practiced 5 sentences',
      icon: '🏆',
      unlocked: realProgress?.totalSentencesPracticed >= 5,
      date: realProgress?.totalSentencesPracticed >= 5 ? 'Recently' : null
    },
    {
      id: 'accuracy_master',
      title: 'Accuracy Master',
      description: 'Achieved 80% average accuracy',
      icon: '📚',
      unlocked: realProgress?.averageAccuracy >= 80,
      date: realProgress?.averageAccuracy >= 80 ? 'Recently' : null
    },
    {
      id: 'streak_keeper',
      title: 'Streak Keeper',
      description: 'Maintained a 3-day streak',
      icon: '🔥',
      unlocked: realProgress?.streak >= 3,
      date: realProgress?.streak >= 3 ? 'Recently' : null
    },
    {
      id: 'ai_explorer',
      title: 'AI Explorer',
      description: 'Used AI-generated sentences',
      icon: '🤖',
      unlocked: realProgress?.isUsingAISentences || false,
      date: realProgress?.isUsingAISentences ? 'Recently' : null
    },
    {
      id: 'dedicated_learner',
      title: 'Dedicated Learner',
      description: 'Completed 10 practice sessions',
      icon: '⭐',
      unlocked: realProgress?.totalSessions >= 10,
      date: realProgress?.totalSessions >= 10 ? 'Recently' : null
    }
  ];

  // Generate weekly progress from real data
// In Progress.js

  // Generate weekly progress from real data
  const generateWeeklyProgress = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Helper function to get all dates (YYYY-MM-DD) for the current week
    const getWeekDates = () => {
      const today = new Date();
      const week = [];
      const startOfWeek = new Date(today);
      // Set to the Sunday of the current week
      startOfWeek.setDate(today.getDate() - today.getDay()); 
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        week.push(date.toISOString().split('T')[0]);
      }
      return week;
    };

    const currentWeekDates = getWeekDates();

    // Use a Map for efficient data aggregation
    const weeklyDataMap = new Map();
    currentWeekDates.forEach((date, index) => {
      weeklyDataMap.set(date, {
        day: weekDays[index],
        sessions: 0,
        totalAccuracy: 0,
        count: 0,
      });
    });

    if (realProgress?.sentenceHistory) {
      // 1. Filter history to only include sessions from the current week
      const thisWeekHistory = realProgress.sentenceHistory.filter(session =>
        currentWeekDates.includes(session.date)
      );
      
      thisWeekHistory.forEach(session => {
        const dayData = weeklyDataMap.get(session.date);
        if (dayData) {
          dayData.sessions += 1;
          dayData.totalAccuracy += session.accuracy;
          dayData.count += 1;
        }
      });
    }
    
    // Convert the map to an array and calculate the final average accuracy
    return Array.from(weeklyDataMap.values()).map(data => ({
      day: data.day,
      sessions: data.sessions,
      // 2. Correctly calculate average accuracy
      accuracy: data.count > 0 ? Math.round(data.totalAccuracy / data.count) : 0,
    }));
  };

  const weeklyProgress = generateWeeklyProgress();

  const stats = [
    {
      label: 'Total Sessions',
      value: realProgress?.totalSessions || 0,
      icon: BarChart3,
      color: '#ffd700',
      change: `+${statistics?.thisWeekSessions || 0} this week`
    },
    {
      label: 'Current Streak',
      value: realProgress?.streak || 0,
      icon: Target,
      color: '#ff6b6b',
      change: 'days'
    },
    {
      label: 'Sentences Practiced',
      value: realProgress?.totalSentencesPracticed || 0,
      icon: Mic,
      color: '#4ecdc4',
      change: 'total'
    },
    {
      label: 'Average Accuracy',
      value: Math.round(realProgress?.averageAccuracy || 0),
      icon: TrendingUp,
      color: '#45b7d1',
      change: '%'
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
                    className="session-bar"
                    style={{ height: `${Math.min((day.sessions / 3) * 100, 100)}%` }}
                    title={`${day.sessions} sessions`}
                  />
                  <div 
                    className="accuracy-bar"
                    style={{ height: `${day.accuracy}%` }}
                    title={`${day.accuracy}% accuracy`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color session-color"></div>
              <span>Sessions</span>
            </div>
            <div className="legend-item">
              <div className="legend-color accuracy-color"></div>
              <span>Accuracy %</span>
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

        {/* Recent Activity */}
        {realProgress?.sentenceHistory && realProgress.sentenceHistory.length > 0 && (
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {realProgress.sentenceHistory.slice(-5).reverse().map((session, index) => (
                <motion.div
                  key={index}
                  className="activity-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="activity-icon">
                    <CheckCircle size={20} />
                  </div>
                  <div className="activity-content">
                    <div className="activity-sentence">"{session.sentence}"</div>
                    <div className="activity-details">
                      <span className="accuracy">{Math.round(session.accuracy)}% accuracy</span>
                      <span className="date">{new Date(session.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="activity-score">
                    <div className="score-circle" style={{ 
                      background: `conic-gradient(#4ecdc4 ${session.accuracy * 3.6}deg, #e2e8f0 0deg)` 
                    }}>
                      <span>{Math.round(session.accuracy)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

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

