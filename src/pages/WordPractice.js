import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Mic, MicOff, CheckCircle, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CORE_WORDS } from '../data/phonemes';

const WordPractice = () => {
  const { wordId } = useParams();
  const { state, actions } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const word = CORE_WORDS.find(w => w.id === wordId);

  if (!word) {
    return (
      <div className="main-content">
        <div className="error-page">
          <h2>Word not found</h2>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const handleRecording = () => {
    if (isRecording) {
      // Stop recording and simulate analysis
      setIsRecording(false);
      const simulatedAccuracy = Math.random() * 30 + 70; // 70-100%
      setAccuracy(simulatedAccuracy);
      setShowFeedback(true);
      
      if (simulatedAccuracy >= 80) {
        actions.completeWord(wordId);
        setIsCompleted(true);
      }
    } else {
      setIsRecording(true);
    }
  };

  const nextPhoneme = () => {
    if (currentPhonemeIndex < word.phonemes.length - 1) {
      setCurrentPhonemeIndex(currentPhonemeIndex + 1);
    }
  };

  const prevPhoneme = () => {
    if (currentPhonemeIndex > 0) {
      setCurrentPhonemeIndex(currentPhonemeIndex - 1);
    }
  };

  return (
    <div className="main-content">
      <div className="word-practice-container">
        {/* Header */}
        <div className="practice-header">
          <Link to="/" className="back-button">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          
          <div className="word-title">
            <h1>Practice: {word.word}</h1>
            <p>{word.meaning}</p>
          </div>
        </div>

        {/* Word Breakdown */}
        <div className="word-breakdown">
          <h2>Word Breakdown</h2>
          <div className="phonemes-display">
            {word.phonemes.map((phoneme, index) => (
              <motion.div
                key={index}
                className={`phoneme-card ${index === currentPhonemeIndex ? 'active' : ''} ${index < currentPhonemeIndex ? 'completed' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="phoneme-symbol">/{phoneme}/</div>
                <div className="phoneme-position">{index + 1}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Current Phoneme Practice */}
        <div className="current-phoneme-practice">
          <h3>Practice Phoneme: /{word.phonemes[currentPhonemeIndex]}/</h3>
          <div className="practice-controls">
            <button className="btn btn-secondary" onClick={prevPhoneme} disabled={currentPhonemeIndex === 0}>
              Previous
            </button>
            <button className="btn btn-primary" onClick={nextPhoneme} disabled={currentPhonemeIndex === word.phonemes.length - 1}>
              Next
            </button>
          </div>
        </div>

        {/* Word Practice */}
        <div className="word-practice-section">
          <h3>Now practice the complete word</h3>
          <div className="word-display">
            <motion.div
              className="word-text"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {word.word}
            </motion.div>
          </div>
          
          <motion.button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={handleRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
            {isRecording ? 'Stop Recording' : 'Record Word'}
          </motion.button>
        </div>

        {/* Feedback */}
        {showFeedback && (
          <motion.div
            className="feedback-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h4>Your Performance</h4>
            <div className="accuracy-display">
              <div className="accuracy-circle">
                <span className="accuracy-value">{Math.round(accuracy)}%</span>
              </div>
              <p className="accuracy-label">Pronunciation Accuracy</p>
            </div>
            
            {accuracy >= 80 ? (
              <div className="success-message">
                <CheckCircle size={24} />
                <span>Excellent! You've mastered "{word.word}"!</span>
              </div>
            ) : (
              <div className="improvement-message">
                <span>Good try! Practice more to improve.</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Completion Modal */}
        {isCompleted && (
          <motion.div
            className="completion-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="completion-content">
              <motion.div
                className="completion-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Star size={64} />
              </motion.div>
              <h2>Congratulations! 🎉</h2>
              <p>You've mastered the word "{word.word}"!</p>
              <div className="completion-actions">
                <Link to="/" className="btn btn-primary">
                  Continue Learning
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WordPractice;

