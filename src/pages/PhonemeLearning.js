import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Volume2,
  Mic,
  MicOff,
  Trophy,
  Star
} from 'lucide-react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { PHONEME_DATA, DIFFICULTY_LEVELS } from '../data/phonemes';

const PhonemeLearning = () => {
  const { phonemeId } = useParams();
  const { state, actions } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPrediction, setLastPrediction] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const durationTimerRef = useRef(null);

  const phoneme = PHONEME_DATA[phonemeId];
  const difficulty = DIFFICULTY_LEVELS[phoneme.difficulty];

  const steps = [
    {
      title: 'Visual Guide',
      content: 'Learn the correct mouth and tongue position',
      component: 'VisualGuide'
    },
    {
      title: 'Listen & Repeat',
      content: 'Listen to the sound and practice',
      component: 'ListenRepeat'
    },
    {
      title: 'Practice Words',
      content: 'Practice with example words',
      component: 'PracticeWords'
    },
    {
      title: 'Test Your Skills',
      content: 'Record and get feedback',
      component: 'TestSkills'
    }
  ];

  useEffect(() => {
    // Check if phoneme is already learned
    if (state.progress?.phonemesLearned?.includes(phonemeId)) {
      setIsCompleted(true);
    }
    
    // Cleanup function to clear timers on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [phonemeId, state.progress]);


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      
      // Set recording duration to 2 seconds for phoneme recording
      const duration = 2000;
      setRecordingDuration(0);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        classifyPhoneme(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Update duration for UI display
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);
      
      // Auto-stop after 2 seconds
      recordingTimerRef.current = setTimeout(() => {
        stopRecording();
      }, duration);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Error accessing microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    // CORRECTED: Instead of checking the potentially stale `isRecording` state,
    // we check the actual state of the MediaRecorder instance. This is the
    // source of truth and avoids the stale closure problem.
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      // Clear timers
      if (recordingTimerRef.current) {
        clearTimeout(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      // Stop all tracks to release microphone
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const classifyPhoneme = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await axios.post('http://localhost:5000/api/classify-phoneme', formData);

      console.log('response', response);
      const result = await response.data;
      setIsProcessing(false);

      if (result.success) {
        const predictedPhoneme = result.phoneme;
        const confidence = result.confidence_percentage;
        
        // Calculate accuracy based on whether the predicted phoneme matches the target
        const isCorrect = predictedPhoneme.toLowerCase() === phonemeId.toLowerCase();
        const calculatedAccuracy = isCorrect ? Math.max(confidence, 80) : Math.min(confidence, 60);
        
        setAccuracy(calculatedAccuracy);
        setLastPrediction({
          predicted: predictedPhoneme,
          target: phonemeId,
          confidence: confidence,
          isCorrect: isCorrect
        });
        setShowFeedback(true);
        setPracticeCount(prev => prev + 1);
        
        // Check if practice is complete
        if (practiceCount >= 4) {
          actions.completePhoneme(phonemeId);
          setIsCompleted(true);
        }
      } else {
        console.error('Classification failed:', result.error);
        alert('Classification failed: ' + result.error);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error classifying phoneme:', error);
      alert('Error processing audio. Please try again.');
      setIsProcessing(false);
    }
  };

  const playPhoneme = () => {
    setIsPlaying(true);
    // Simulate audio playback
    setTimeout(() => {
      setIsPlaying(false);
    }, 1000);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetPractice = () => {
    setPracticeCount(0);
    setAccuracy(0);
    setShowFeedback(false);
    setIsCompleted(false);
    setLastPrediction(null);
    setIsProcessing(false);
    setRecordingDuration(0);
    
    // Clear any active timers
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };


  const VisualGuide = () => (
    <div className="visual-guide">
      <div className="mouth-animation">
        <motion.div
          className="mouth-visual"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {phoneme.visualGuide}
        </motion.div>
      </div>
      
      <div className="phoneme-info">
        <h3>Phoneme: {phoneme.symbol}</h3>
        <p className="description">{phoneme.description}</p>
        
        <div className="position-guides">
          <div className="guide-item">
            <h4>👅 Tongue Position</h4>
            <p>{phoneme.tonguePosition}</p>
          </div>
          <div className="guide-item">
            <h4>👄 Lip Position</h4>
            <p>{phoneme.lipPosition}</p>
          </div>
        </div>
        
        <div className="example-words">
          <h4>Example Words:</h4>
          <div className="word-list">
            {phoneme.practiceWords.map((word, index) => (
              <motion.span
                key={word}
                className="example-word"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const ListenRepeat = () => (
    <div className="listen-repeat">
      <div className="audio-section">
        <motion.button
          className="play-button"
          onClick={playPhoneme}
          disabled={isPlaying}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </motion.button>
        
        <div className="phoneme-display">
          <motion.div
            className="phoneme-symbol"
            animate={isPlaying ? {
              scale: [1, 1.2, 1],
              color: ['#667eea', '#ff6b6b', '#667eea']
            } : {}}
            transition={{ duration: 1 }}
          >
            {phoneme.symbol}
          </motion.div>
          <p>Click to hear the sound</p>
        </div>
      </div>
      
      <div className="practice-section">
        <h3>Now you try!</h3>
        <p>Repeat the sound after listening</p>
        
        <motion.button
          className={`record-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isProcessing ? (
            <div className="spinner" />
          ) : isRecording ? (
            <MicOff size={24} />
          ) : (
            <Mic size={24} />
          )}
          {isProcessing ? 'Processing...' : isRecording ? `Recording... ${(2000 - recordingDuration) / 1000}s` : 'Start Recording'}
        </motion.button>
      </div>
    </div>
  );

  const PracticeWords = () => (
    <div className="practice-words">
      <h3>Practice with Words</h3>
      <p>Try saying these words that contain the {phoneme.symbol} sound:</p>
      
      <div className="words-grid">
        {phoneme.practiceWords.map((word, index) => (
          <motion.div
            key={word}
            className="word-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="word-text">{word}</div>
            <div className="phoneme-highlight">
              {word.split('').map((letter, letterIndex) => (
                <span
                  key={letterIndex}
                  className={letter.toLowerCase() === phonemeId ? 'highlighted' : ''}
                >
                  {letter}
                </span>
              ))}
            </div>
            <button className="play-word-btn">
              <Play size={16} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const TestSkills = () => (
    <div className="test-skills">
      <h3>Test Your Skills</h3>
      <p>Record yourself saying the phoneme and get feedback</p>
      
      <div className="recording-section">
        <motion.button
          className={`record-button large ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isProcessing ? (
            <div className="spinner" />
          ) : isRecording ? (
            <MicOff size={32} />
          ) : (
            <Mic size={32} />
          )}
          {isProcessing ? 'Processing...' : isRecording ? `Recording... ${(2000 - recordingDuration) / 1000}s` : 'Record Phoneme'}
        </motion.button>
        
        <div className="practice-stats">
          <div className="stat">
            <span className="stat-label">Practice Count:</span>
            <span className="stat-value">{practiceCount}/5</span>
          </div>
          <div className="stat">
            <span className="stat-label">Difficulty:</span>
            <span 
              className="stat-value difficulty"
              style={{ color: difficulty.color }}
            >
              {phoneme.difficulty}
            </span>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showFeedback && lastPrediction && (
          <motion.div
            className="feedback-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h4>Your Performance</h4>
            
            <div className="prediction-results">
              <div className="prediction-item">
                <span className="prediction-label">Target Phoneme:</span>
                <span className="prediction-value target">{lastPrediction.target}</span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">You Said:</span>
                <span className={`prediction-value ${lastPrediction.isCorrect ? 'correct' : 'incorrect'}`}>
                  {lastPrediction.predicted}
                </span>
              </div>
              <div className="prediction-item">
                <span className="prediction-label">Confidence:</span>
                <span className="prediction-value confidence">{Math.round(lastPrediction.confidence)}%</span>
              </div>
            </div>
            
            <div className="accuracy-display">
              <div className="accuracy-circle">
                <span className="accuracy-value">{Math.round(accuracy)}%</span>
              </div>
              <p className="accuracy-label">Pronunciation Accuracy</p>
            </div>
            
            {lastPrediction.isCorrect ? (
              <div className="success-message">
                <CheckCircle size={24} />
                <span>Excellent! You got it right!</span>
              </div>
            ) : (
              <div className="improvement-message">
                <span>Good try! The target was '{lastPrediction.target}', you said '{lastPrediction.predicted}'. Keep practicing!</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case 'VisualGuide':
        return <VisualGuide />;
      case 'ListenRepeat':
        return <ListenRepeat />;
      case 'PracticeWords':
        return <PracticeWords />;
      case 'TestSkills':
        return <TestSkills />;
      default:
        return <VisualGuide />;
    }
  };

  if (!phoneme) {
    return (
      <div className="main-content">
        <div className="error-page">
          <h2>Phoneme not found</h2>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="phoneme-learning-container">
        {/* Header */}
        <div className="learning-header">
          <Link to="/" className="back-button">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          
          <div className="phoneme-title">
            <h1>Learning: {phoneme.symbol}</h1>
            <p>{phoneme.description}</p>
          </div>
          
          <div className="difficulty-badge" style={{ backgroundColor: difficulty.color }}>
            {phoneme.difficulty}
          </div>
        </div>

        {/* Progress Steps */}
        <div className="steps-container">
          <div className="steps-progress">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              >
                <div className="step-number">
                  {index < currentStep ? <CheckCircle size={16} /> : index + 1}
                </div>
                <div className="step-info">
                  <h4>{step.title}</h4>
                  <p>{step.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          className="step-content"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>

        {/* Navigation */}
        <div className="step-navigation">
          <button
            className="btn btn-secondary"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft size={20} />
            Previous
          </button>
          
          <div className="step-indicator">
            Step {currentStep + 1} of {steps.length}
          </div>
          
          {currentStep === steps.length - 1 ? (
            <motion.button
              className="btn btn-success"
              onClick={resetPractice}
              whileHover={{ scale: 1.05 }}
            >
              <RotateCcw size={20} />
              Practice Again
            </motion.button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={nextStep}
            >
              Next
              <ArrowRight size={20} />
            </button>
          )}
        </div>

        {/* Completion Modal */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              className="completion-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="completion-content">
                <motion.div
                  className="completion-icon"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Trophy size={64} />
                </motion.div>
                <h2>Congratulations! 🎉</h2>
                <p>You've mastered the {phoneme.symbol} phoneme!</p>
                <div className="completion-stats">
                  <div className="stat">
                    <Star size={20} />
                    <span>+{difficulty.points} points earned</span>
                  </div>
                </div>
                <div className="completion-actions">
                  <Link to="/" className="btn btn-primary">
                    Continue Learning
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PhonemeLearning;



