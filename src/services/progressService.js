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
        totalWordsPracticed: 0,
        averageAccuracy: 0,
        lastSessionDate: null,
        sentenceHistory: [],
        wordHistory: [],
        currentSentences: [
          "I need help please",
          "Yes, I can do that", 
          "No, I don't want more",
          "Please stop that",
          "I am done eating"
        ],
        currentWords: [
          { id: 'help', word: 'help', phonemes: ['h', 'e', 'l', 'p'], meaning: 'To ask for assistance', priority: 1, examples: ['help me', 'I need help', 'can you help?'] },
          { id: 'yes', word: 'yes', phonemes: ['y', 'e', 's'], meaning: 'Agreement or confirmation', priority: 2, examples: ['yes please', 'yes I can', 'yes that\'s right'] },
          { id: 'no', word: 'no', phonemes: ['n', 'o'], meaning: 'Disagreement or refusal', priority: 3, examples: ['no thank you', 'no I can\'t', 'no problem'] },
          { id: 'stop', word: 'stop', phonemes: ['s', 't', 'o', 'p'], meaning: 'To halt or cease', priority: 4, examples: ['stop please', 'stop that', 'stop here'] },
          { id: 'more', word: 'more', phonemes: ['m', 'o', 'r'], meaning: 'Additional quantity', priority: 5, examples: ['more please', 'I want more', 'more food'] },
          { id: 'done', word: 'done', phonemes: ['d', 'o', 'n'], meaning: 'Completed or finished', priority: 6, examples: ['I\'m done', 'all done', 'done eating'] },
          { id: 'hot', word: 'hot', phonemes: ['h', 'o', 't'], meaning: 'High temperature', priority: 7, examples: ['it\'s hot', 'hot water', 'too hot'] },
          { id: 'please', word: 'please', phonemes: ['p', 'l', 'e', 's'], meaning: 'Polite request', priority: 8, examples: ['please help', 'please stop', 'please more'] }
        ],
        isUsingAISentences: false,
        isUsingAIWords: false,
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

  // Update word progress after a practice session
  updateWordProgress(word, accuracy, clarity, speed) {
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
    progress.totalWordsPracticed += 1;
    progress.lastSessionDate = new Date().toISOString();
    progress.lastPracticeDate = today;

    // Add to word history
    progress.wordHistory.push({
      word: word.word,
      wordId: word.id,
      accuracy,
      clarity,
      speed,
      timestamp: new Date().toISOString(),
      date: today
    });

    // Keep only last 50 word practice sessions
    if (progress.wordHistory.length > 50) {
      progress.wordHistory = progress.wordHistory.slice(-50);
    }

    // Update average accuracy based on both sentence and word practice
    const recentSentenceSessions = progress.sentenceHistory.slice(-5);
    const recentWordSessions = progress.wordHistory.slice(-5);
    const allRecentSessions = [...recentSentenceSessions, ...recentWordSessions];
    
    if (allRecentSessions.length > 0) {
      progress.averageAccuracy = allRecentSessions.reduce((sum, session) => sum + session.accuracy, 0) / allRecentSessions.length;
    }

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

  // Update current words (when AI generates new ones)
  updateCurrentWords(words) {
    const progress = this.getProgress();
    if (!progress) return;

    progress.currentWords = words;
    progress.isUsingAIWords = true;
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
      totalWordsPracticed: progress.totalWordsPracticed,
      averageAccuracy: Math.round(progress.averageAccuracy),
      streak: progress.streak,
      recentSessions: progress.sentenceHistory.slice(-5), // Last 5 sessions
      recentWordSessions: progress.wordHistory.slice(-5), // Last 5 word sessions
      isUsingAISentences: progress.isUsingAISentences,
      isUsingAIWords: progress.isUsingAIWords,
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
    
    const thisWeekSentenceSessions = progress.sentenceHistory.filter(session => 
      thisWeek.includes(session.date)
    );

    const thisWeekWordSessions = progress.wordHistory.filter(session => 
      thisWeek.includes(session.date)
    );

    const thisWeekSessions = [...thisWeekSentenceSessions, ...thisWeekWordSessions];

    const thisWeekAccuracy = thisWeekSessions.length > 0 
      ? thisWeekSessions.reduce((sum, session) => sum + session.accuracy, 0) / thisWeekSessions.length
      : 0;

    return {
      totalSessions: progress.totalSessions,
      totalSentencesPracticed: progress.totalSentencesPracticed,
      totalWordsPracticed: progress.totalWordsPracticed,
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

