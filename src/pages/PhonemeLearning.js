import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  Star,
  BookOpen,
  X,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { PHONEME_DATA, DIFFICULTY_LEVELS } from '../data/phonemes';

const PhonemeLearning = () => {
  const { phonemeId } = useParams();
  const { state, actions } = useApp();
  const navigate = useNavigate();
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
  
  // Real-time feedback meters state
  const [hMeterValue, setHMeterValue] = useState(0);
  const [mMeterValue, setMMeterValue] = useState(0);
  const [sMeterValue, setSMeterValue] = useState(0);
  const [isRealTimeRecording, setIsRealTimeRecording] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const durationTimerRef = useRef(null);
  
  // Real-time audio analysis refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Available phonemes for learning
  const availablePhonemes = ['h', 'l', 'p', 'eh'];
  
  const phoneme = phonemeId ? PHONEME_DATA[phonemeId] : null;
  const difficulty = phoneme ? DIFFICULTY_LEVELS[phoneme.difficulty] : null;

  const steps = [
    {
      title: 'Visual Guide',
      content: 'Learn the correct mouth and tongue position',
      component: 'VisualGuide'
    },
    {
      title: 'Test Your Skills',
      content: 'Record and get feedback',
      component: 'TestSkills'
    }
  ];

  useEffect(() => {
    // Check if phoneme is already learned
    if (phonemeId && state.progress?.phonemesLearned?.includes(phonemeId)) {
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopRealTimeRecording();
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
      
      // Start real-time recording for meters
      await startRealTimeRecording();
      
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
      
      // Stop real-time recording
      stopRealTimeRecording();
      
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

  // Real-time audio analysis functions
  const initRealTimeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      return true;
    } catch (error) {
      console.error('Error initializing real-time audio:', error);
      return false;
    }
  };

  const analyzeRealTimeAudio = () => {
    if (!analyserRef.current || !isRealTimeRecording) return;

    const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getFloatFrequencyData(dataArray);

    // Convert dB to linear magnitudes
    const magnitudes = Array.from(dataArray, v => Math.pow(10, v / 20));
    const sampleRate = audioContextRef.current.sampleRate;
    const binWidth = sampleRate / 2 / analyserRef.current.frequencyBinCount;

    // H-meter analysis (high-frequency energy and spectral flatness)
    let totalEnergy = 0;
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;
    const lowFreqLimit = 350;
    const highFreqStart = 1000;

    for (let i = 0; i < magnitudes.length; i++) {
      const freq = i * binWidth;
      const energy = magnitudes[i];
      totalEnergy += energy;
      if (freq < lowFreqLimit) lowFreqEnergy += energy;
      else if (freq > highFreqStart) highFreqEnergy += energy;
    }

    const lowRatio = totalEnergy > 0 ? lowFreqEnergy / totalEnergy : 0;
    const highRatio = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;

    // Calculate spectral flatness
    let logSum = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      const val = Math.max(magnitudes[i], 1e-12);
      logSum += Math.log(val);
    }
    const geoMean = Math.exp(logSum / magnitudes.length);
    const meanEnergy = totalEnergy / magnitudes.length;
    const spectralFlatness = geoMean / (meanEnergy + 1e-12);

    // H-meter value (0-100)
    const hValue = totalEnergy > 1e-2 && lowRatio < 0.15 && highRatio > 0.35 && spectralFlatness > 0.2 
      ? Math.min(100, (highRatio * 200 + spectralFlatness * 100)) 
      : 0;

    // M-meter analysis (pitch detection for tonal sounds)
    const byteDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(byteDataArray);
    
    // Simple pitch detection - find peak frequency
    let maxValue = 0;
    let maxIndex = 0;
    for (let i = 0; i < byteDataArray.length; i++) {
      if (byteDataArray[i] > maxValue) {
        maxValue = byteDataArray[i];
        maxIndex = i;
      }
    }
    
    const peakFreq = maxIndex * binWidth;
    const rms = Math.sqrt(byteDataArray.reduce((sum, val) => sum + val * val, 0) / byteDataArray.length);
    
    // M-meter value (0-100) - good for humming/tonal sounds
    const mValue = rms > 5 && peakFreq >= 70 && peakFreq <= 500 
      ? Math.min(100, (rms / 10) * 50 + (peakFreq > 100 && peakFreq < 400 ? 50 : 0))
      : 0;

    // S-meter analysis (hissing sounds in 4-8kHz range)
    const hissStartFreq = 4000;
    const hissEndFreq = 8000;
    const lowFreqEnd = 2000;
    
    let hissEnergy = 0;
    let lowEnergy = 0;

    for (let i = 0; i < byteDataArray.length; i++) {
      const freq = i * binWidth;
      const amplitude = byteDataArray[i] / 255.0;

      if (freq >= hissStartFreq && freq <= hissEndFreq) {
        hissEnergy += amplitude;
      } else if (freq < lowFreqEnd) {
        lowEnergy += amplitude;
      }
    }
    
    // S-meter value (0-100)
    const sValue = hissEnergy < 1.0 ? 0 : Math.min(100, (hissEnergy / (lowEnergy + 1)) * 20);

    setHMeterValue(hValue);
    setMMeterValue(mValue);
    setSMeterValue(sValue);

    if (isRealTimeRecording) {
      animationFrameRef.current = requestAnimationFrame(analyzeRealTimeAudio);
    }
  };

  const startRealTimeRecording = async () => {
    const success = await initRealTimeAudio();
    if (success) {
      setIsRealTimeRecording(true);
      analyzeRealTimeAudio();
    }
  };

  const stopRealTimeRecording = () => {
    setIsRealTimeRecording(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setHMeterValue(0);
    setMMeterValue(0);
    setSMeterValue(0);
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


  const TestSkills = () => (
    <div className="test-skills">
      <h3>Test Your Skills</h3>
      <p>Record yourself saying the phoneme and get feedback</p>
      
      <div className="recording-section">
        <div className="record-phoneme-card">
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
          
          {/* Real-time Feedback Meters */}
          <div className="real-time-meters" data-phoneme={phonemeId}>
            <div className="meter-container">
              <div className="meter-label">H-Meter</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill h-meter"
                  style={{ height: `${hMeterValue}%` }}
                ></div>
                <div className="meter-target h-target"></div>
              </div>
              <div className="meter-value">{Math.round(hMeterValue)}%</div>
            </div>
            
            <div className="meter-container">
              <div className="meter-label">M-Meter</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill m-meter"
                  style={{ height: `${mMeterValue}%` }}
                ></div>
                <div className="meter-target m-target"></div>
              </div>
              <div className="meter-value">{Math.round(mMeterValue)}%</div>
            </div>
            
            <div className="meter-container">
              <div className="meter-label">S-Meter</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill s-meter"
                  style={{ height: `${sMeterValue}%` }}
                ></div>
                <div className="meter-target s-target"></div>
              </div>
              <div className="meter-value">{Math.round(sMeterValue)}%</div>
            </div>
          </div>
          
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
          
          <AnimatePresence>
            {showFeedback && lastPrediction && (
              <motion.div
                className="performance-feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <h4>Your Performance</h4>
                
                <div className="performance-metrics-horizontal">
                  <div className="metric-card">
                    <div className="metric-icon">
                      🎯
                    </div>
                    <div className="metric-content">
                      <h5>Target Phoneme</h5>
                      <div className="metric-value target">{lastPrediction.target}</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">
                      🎤
                    </div>
                    <div className="metric-content">
                      <h5>You Said</h5>
                      <div className={`metric-value ${lastPrediction.isCorrect ? 'correct' : 'incorrect'}`}>
                        {lastPrediction.predicted}
                      </div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">
                      📊
                    </div>
                    <div className="metric-content">
                      <h5>Confidence</h5>
                      <div className="metric-value confidence">{Math.round(lastPrediction.confidence)}%</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">
                      ⭐
                    </div>
                    <div className="metric-content">
                      <h5>Accuracy</h5>
                      <div className="metric-value accuracy">{Math.round(accuracy)}%</div>
                    </div>
                  </div>
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
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case 'VisualGuide':
        return <VisualGuide />;
      case 'TestSkills':
        return <TestSkills />;
      default:
        return <VisualGuide />;
    }
  };

  // Phoneme Selection Component - inline like word practice
  const PhonemeSelection = () => (
    <div className="phoneme-selection">
      <div className="phonemes-header">
        <h3>Available Phonemes</h3>
        <p>Select a phoneme to start learning</p>
      </div>
      
      <div className="phonemes-list">
        {availablePhonemes.map((phonemeKey, index) => {
          const phonemeData = PHONEME_DATA[phonemeKey];
          const difficultyData = DIFFICULTY_LEVELS[phonemeData.difficulty];
          const isLearned = state.progress?.phonemesLearned?.includes(phonemeKey);
          
          return (
            <motion.div
              key={phonemeKey}
              className={`phoneme-card ${isLearned ? 'learned' : ''}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/phoneme/${phonemeKey}`)}
            >
              <div className="phoneme-content">
                <div className="phoneme-header">
                  <h4>{phonemeData.symbol}</h4>
                  <div 
                    className="difficulty-badge"
                    style={{ backgroundColor: difficultyData.color }}
                  >
                    {phonemeData.difficulty}
                  </div>
                  {isLearned && (
                    <div className="learned-badge">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </div>
                <p className="phoneme-description">{phonemeData.description}</p>
                <div className="phonemes-display">
                  <span className="phoneme-symbol">{phonemeData.symbol}</span>
                </div>
                <div className="practice-words-preview">
                  {phonemeData.practiceWords.slice(0, 3).map((word, idx) => (
                    <span key={idx} className="word-preview">{word}</span>
                  ))}
                </div>
              </div>
              <div className="phoneme-actions">
                <div className="points-info">
                  <Star size={14} />
                  <span>+{difficultyData.points}</span>
                </div>
                <button
                  className="start-learning-btn"
                  title={isLearned ? 'Review phoneme' : 'Start learning'}
                >
                  <BookOpen size={16} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Show phoneme selection if no phonemeId is provided
  if (!phonemeId) {
    return (
      <div className="main-content">
        <PhonemeSelection />
      </div>
    );
  }

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
          <Link to="/phoneme" className="back-button">
            <ArrowLeft size={20} />
            Back to Learn
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
                <button
                  className="close-modal-btn"
                  onClick={() => setIsCompleted(false)}
                >
                  <X size={24} />
                </button>
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
                  <button
                    onClick={() => setIsCompleted(false)}
                    className="btn btn-secondary"
                  >
                    View Results
                  </button>
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



