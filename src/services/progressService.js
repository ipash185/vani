// Progress tracking service for localStorage
class ProgressService {
  constructor() {
    this.STORAGE_KEY = 'vani_speech_progress';
    this.initializeProgress();
  }

  // Initialize progress if it doesn't exist
  initializeProgress() {
    const existingProgress = this.getProgress();
    if (!existingProgress) {
      const initialProgress = {
        totalSessions: 0,
        totalSentencesPracticed: 0,
        averageAccuracy: 0,
        lastSessionDate: null,
        sentenceHistory: [],
        currentSentences: [
          "I need help please",
          "Yes, I can do that", 
          "No, I don't want more",
          "Please stop that",
          "I am done eating"
        ],
        isUsingAISentences: false,
        streak: 0,
        lastPracticeDate: null
      };
      this.saveProgress(initialProgress);
    }
  }

  // Get current progress
  getProgress() {
    try {
      const progress = localStorage.getItem(this.STORAGE_KEY);
      return progress ? JSON.parse(progress) : null;
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  }

  // Save progress
  saveProgress(progress) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  // Update progress after a practice session
  updateProgress(sentence, accuracy, clarity, speed) {
    const progress = this.getProgress();
    if (!progress) return;

    const today = new Date().toISOString().split('T')[0];
    const lastDate = progress.lastPracticeDate;

    // Update streak
    if (lastDate === today) {
      // Already practiced today, no streak change
    } else if (lastDate && this.isConsecutiveDay(lastDate, today)) {
      progress.streak += 1;
    } else {
      progress.streak = 1;
    }

    // Update session data
    progress.totalSessions += 1;
    progress.totalSentencesPracticed += 1;
    progress.lastSessionDate = new Date().toISOString();
    progress.lastPracticeDate = today;

    // Add to sentence history
    progress.sentenceHistory.push({
      sentence,
      accuracy,
      clarity,
      speed,
      timestamp: new Date().toISOString(),
      date: today
    });

    // Keep only last 50 practice sessions
    if (progress.sentenceHistory.length > 50) {
      progress.sentenceHistory = progress.sentenceHistory.slice(-50);
    }

    // Update average accuracy
    const recentSessions = progress.sentenceHistory.slice(-10); // Last 10 sessions
    progress.averageAccuracy = recentSessions.reduce((sum, session) => sum + session.accuracy, 0) / recentSessions.length;

    this.saveProgress(progress);
    return progress;
  }

  // Check if two dates are consecutive days
  isConsecutiveDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  }

  // Update current sentences (when AI generates new ones)
  updateCurrentSentences(sentences) {
    const progress = this.getProgress();
    if (!progress) return;

    progress.currentSentences = sentences;
    progress.isUsingAISentences = true;
    this.saveProgress(progress);
    return progress;
  }

  // Get progress summary for AI
  getProgressSummary() {
    const progress = this.getProgress();
    if (!progress) return null;

    return {
      totalSessions: progress.totalSessions,
      totalSentencesPracticed: progress.totalSentencesPracticed,
      averageAccuracy: Math.round(progress.averageAccuracy),
      streak: progress.streak,
      recentSessions: progress.sentenceHistory.slice(-5), // Last 5 sessions
      isUsingAISentences: progress.isUsingAISentences,
      lastSessionDate: progress.lastSessionDate
    };
  }

  // Reset progress (for testing)
  resetProgress() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.initializeProgress();
  }

  // Get statistics
  getStatistics() {
    const progress = this.getProgress();
    if (!progress) return null;

    const today = new Date().toISOString().split('T')[0];
    const thisWeek = this.getWeekDates();
    
    const thisWeekSessions = progress.sentenceHistory.filter(session => 
      thisWeek.includes(session.date)
    );

    const thisWeekAccuracy = thisWeekSessions.length > 0 
      ? thisWeekSessions.reduce((sum, session) => sum + session.accuracy, 0) / thisWeekSessions.length
      : 0;

    return {
      totalSessions: progress.totalSessions,
      totalSentencesPracticed: progress.totalSentencesPracticed,
      averageAccuracy: Math.round(progress.averageAccuracy),
      streak: progress.streak,
      thisWeekSessions: thisWeekSessions.length,
      thisWeekAccuracy: Math.round(thisWeekAccuracy),
      lastSessionDate: progress.lastSessionDate
    };
  }

  // Get dates for current week
  getWeekDates() {
    const today = new Date();
    const week = [];
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date.toISOString().split('T')[0]);
    }
    
    return week;
  }
}

export default new ProgressService();
