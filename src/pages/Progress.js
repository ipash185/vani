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
import { CORE_WORDS, PHONEME_DATA } from '../data/phonemes';
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
  const totalPhonemes = Object.keys(PHONEME_DATA).length; // Total phonemes in the system
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
  const generateWeeklyProgress = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekDates = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - today.getDay() + i);
      return date.toISOString().split('T')[0];
    });

    const practiceHistory = [
      ...(realProgress?.sentenceHistory || []),
      ...(realProgress?.wordHistory || []),
    ];

    const weeklyData = weekDates.map((date, index) => {
      const daySessions = practiceHistory.filter(
        (session) => session.date === date
      );
      const sessions = daySessions.length;
      const accuracy =
        sessions > 0
          ? daySessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions
          : 0;

      return {
        day: weekDays[new Date(date).getDay()],
        sessions,
        accuracy: Math.round(accuracy),
      };
    });

    return weeklyData;
  };

  const weeklyProgress = generateWeeklyProgress();

  const phonemesLearnedCount = realProgress?.phonemesLearned?.length || 0;
  const wordsLearnedCount = realProgress?.wordsLearned?.length || 0;
  const sentencesPracticedCount = realProgress?.totalSentencesPracticed || 0;

  const learningPath = [
    {
      id: 'phonemes',
      title: 'Basic Phonemes',
      description: 'Learn fundamental sounds',
      icon: '🎯',
      progress: (phonemesLearnedCount / totalPhonemes) * 100,
      status: phonemesLearnedCount > 0 ? (phonemesLearnedCount === totalPhonemes ? 'completed' : 'in-progress') : 'locked',
    },
    {
      id: 'words',
      title: 'Word Building',
      description: 'Combine phonemes into words',
      icon: '📚',
      progress: (wordsLearnedCount / totalWords) * 100,
      status: wordsLearnedCount > 0 ? (wordsLearnedCount === totalWords ? 'completed' : 'in-progress') : 'locked',
    },
    {
      id: 'sentences',
      title: 'Sentence Practice',
      description: 'Practice complete sentences',
      icon: '🗣️',
      progress: (sentencesPracticedCount / 50) * 100, // Assuming 50 sentences is the goal
      status: sentencesPracticedCount > 0 ? (sentencesPracticedCount >= 50 ? 'completed' : 'in-progress') : 'locked',
    },
  ];

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
      label: 'Words Practiced',
      value: realProgress?.totalWordsPracticed || 0,
      icon: BookOpen,
      color: '#9b59b6',
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
        {((realProgress?.sentenceHistory && realProgress.sentenceHistory.length > 0) || 
          (realProgress?.wordHistory && realProgress.wordHistory.length > 0)) && (
          <div className="recent-activity">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {(() => {
                // Combine sentence and word history, sort by timestamp, and take last 5
                const allHistory = [
                  ...(realProgress.sentenceHistory || []).map(session => ({ ...session, type: 'sentence' })),
                  ...(realProgress.wordHistory || []).map(session => ({ ...session, type: 'word' }))
                ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

                return allHistory.map((session, index) => (
                  <motion.div
                    key={`${session.type}-${index}`}
                    className="activity-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="activity-icon">
                      <CheckCircle size={20} />
                    </div>
                    <div className="activity-content">
                      <div className="activity-text">
                        {session.type === 'sentence' ? `"${session.sentence}"` : `Word: "${session.word}"`}
                      </div>
                      <div className="activity-details">
                        <span className="accuracy">{Math.round(session.accuracy)}% accuracy</span>
                        <span className="date">{new Date(session.timestamp).toLocaleDateString()}</span>
                        <span className="type">{session.type}</span>
                      </div>
                    </div>
                    <div className="activity-score">
                      <div className="score-circle" style={{ 
                        background: `conic-gradient(${session.type === 'sentence' ? '#4ecdc4' : '#9b59b6'} ${session.accuracy * 3.6}deg, #e2e8f0 0deg)` 
                      }}>
                        <span>{Math.round(session.accuracy)}%</span>
                      </div>
                    </div>
                  </motion.div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Learning Path */}
        <div className="learning-path">
          <h2>Learning Path</h2>
          <div className="path-progress">
            {learningPath.map((item, index) => (
              <motion.div
                key={item.id}
                className={`path-item ${item.status}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <div className="path-icon">{item.icon}</div>
                <div className="path-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="path-progress-bar">
                    <div
                      className="path-progress-fill"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="path-percentage">{Math.round(item.progress)}%</span>
                </div>
              </motion.div>
            ))}
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
              <p>You're on a {realProgress?.streak || 0} day streak! Keep practicing daily to maintain your progress.</p>
            </motion.div>
            
            <motion.div
              className="recommendation-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BookOpen size={24} />
              <h3>Learn New Phonemes</h3>
              <p>You've mastered {realProgress?.phonemesLearned?.length || 0} phonemes. Try learning the /h/ sound next!</p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;

