import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { PROGRESS_TRACKING } from '../data/phonemes';

// Initial state
const initialState = {
  user: null,
  progress: PROGRESS_TRACKING,
  currentWord: null,
  currentPhoneme: null,
  practiceMode: 'guided', // 'guided' or 'practice'
  achievements: [],
  settings: {
    soundEnabled: true,
    visualFeedback: true,
    signLanguageEnabled: true,
    difficulty: 'easy'
  }
};

// Action types
const ActionTypes = {
  SET_USER: 'SET_USER',
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  SET_CURRENT_WORD: 'SET_CURRENT_WORD',
  SET_CURRENT_PHONEME: 'SET_CURRENT_PHONEME',
  SET_PRACTICE_MODE: 'SET_PRACTICE_MODE',
  ADD_ACHIEVEMENT: 'ADD_ACHIEVEMENT',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  LOAD_USER_DATA: 'LOAD_USER_DATA',
  SAVE_USER_DATA: 'SAVE_USER_DATA'
};

// Reducer
const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return {
        ...state,
        user: action.payload
      };
    
    case ActionTypes.UPDATE_PROGRESS:
      return {
        ...state,
        progress: {
          ...state.progress,
          ...action.payload
        }
      };
    
    case ActionTypes.SET_CURRENT_WORD:
      return {
        ...state,
        currentWord: action.payload
      };
    
    case ActionTypes.SET_CURRENT_PHONEME:
      return {
        ...state,
        currentPhoneme: action.payload
      };
    
    case ActionTypes.SET_PRACTICE_MODE:
      return {
        ...state,
        practiceMode: action.payload
      };
    
    case ActionTypes.ADD_ACHIEVEMENT:
      return {
        ...state,
        achievements: [...state.achievements, action.payload]
      };
    
    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    
    case ActionTypes.LOAD_USER_DATA:
      return {
        ...state,
        ...action.payload
      };
    
    case ActionTypes.SAVE_USER_DATA:
      // This will be handled by useEffect
      return state;
    
    default:
      return state;
  }
};

// Context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load user data from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('vani_user_data');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        dispatch({
          type: ActionTypes.LOAD_USER_DATA,
          payload: parsedData
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }, []);

  // Save user data to localStorage whenever state changes
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('vani_user_data', JSON.stringify(state));
    }
  }, [state]);

  // Action creators
  const actions = {
    setUser: (user) => {
      dispatch({ type: ActionTypes.SET_USER, payload: user });
    },
    
    updateProgress: (progressData) => {
      dispatch({ type: ActionTypes.UPDATE_PROGRESS, payload: progressData });
    },
    
    setCurrentWord: (word) => {
      dispatch({ type: ActionTypes.SET_CURRENT_WORD, payload: word });
    },
    
    setCurrentPhoneme: (phoneme) => {
      dispatch({ type: ActionTypes.SET_CURRENT_PHONEME, payload: phoneme });
    },
    
    setPracticeMode: (mode) => {
      dispatch({ type: ActionTypes.SET_PRACTICE_MODE, payload: mode });
    },
    
    addAchievement: (achievement) => {
      dispatch({ type: ActionTypes.ADD_ACHIEVEMENT, payload: achievement });
    },
    
    updateSettings: (settings) => {
      dispatch({ type: ActionTypes.UPDATE_SETTINGS, payload: settings });
    },
    
    // Helper functions
    completePhoneme: (phonemeId) => {
      const currentProgress = state.progress;
      if (!currentProgress.phonemesLearned.includes(phonemeId)) {
        actions.updateProgress({
          phonemesLearned: [...currentProgress.phonemesLearned, phonemeId],
          totalPoints: currentProgress.totalPoints + 10,
          streak: currentProgress.streak + 1
        });
      }
    },
    
    completeWord: (wordId) => {
      const currentProgress = state.progress;
      if (!currentProgress.wordsCompleted.includes(wordId)) {
        actions.updateProgress({
          wordsCompleted: [...currentProgress.wordsCompleted, wordId],
          totalPoints: currentProgress.totalPoints + 50,
          streak: currentProgress.streak + 1
        });
      }
    },
    
    resetStreak: () => {
      actions.updateProgress({
        streak: 0
      });
    }
  };

  const value = {
    state,
    actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
