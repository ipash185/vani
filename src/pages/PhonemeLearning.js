import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// A key for storing all phoneme progress in localStorage
const PROGRESS_STORAGE_KEY = 'phonemeProgress';

/**
 * Retrieves progress for a specific phoneme from localStorage.
 * @param {string} phonemeId - The ID of the phoneme (e.g., 'h').
 * @returns {{ accuracy: number, practiceCount: number }}
 */
const getStoredProgress = (phonemeId) => {
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)) || {};
    // Return stored data or defaults if none exists for this phoneme
    return allProgress[phonemeId] || { accuracy: 0, practiceCount: 0 };
  } catch (error) {
    console.error("Failed to parse phoneme progress from localStorage", error);
    return { accuracy: 0, practiceCount: 0 };
  }
};

/**
 * Saves progress for a specific phoneme to localStorage.
 * @param {string} phonemeId - The ID of the phoneme (e.g., 'h').
 * @param {{ accuracy: number, practiceCount: number }} progress - The data to save.
 */
const saveStoredProgress = (phonemeId, progress) => {
  try {
    const allProgress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)) || {};
    allProgress[phonemeId] = progress;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error("Failed to save phoneme progress to localStorage", error);
  }
};

/**
 * Clears the progress for a specific phoneme from localStorage.
 * @param {string} phonemeId - The ID of the phoneme to clear.
 */
const clearStoredProgress = (phonemeId) => {
    try {
        const allProgress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)) || {};
        delete allProgress[phonemeId]; // Remove the key for the specific phoneme
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
    } catch (error) {
        console.error("Failed to clear phoneme progress from localStorage", error);
    }
};

// Place this BEFORE your main PhonemeLearning component
const PerformanceFeedback = React.memo(function PerformanceFeedback({ showFeedback, lastPrediction, accuracy, isProcessing }) {
  return (
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
            {/* Metric Card: Target */}
            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-content">
                <h5>Target Phoneme</h5>
                <div className="metric-value target">{lastPrediction.target}</div>
              </div>
            </div>
            
            {/* Metric Card: You Said */}
            <div className="metric-card">
              <div className="metric-icon">🎤</div>
              <div className="metric-content">
                <h5>You Said</h5>
                <div className={`metric-value ${lastPrediction.isCorrect ? 'correct' : 'incorrect'}`}>
                  {isProcessing ? "--" : lastPrediction.predicted}
                </div>
              </div>
            </div>
            
            {/* Metric Card: Confidence */}
            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-content">
                <h5>Confidence</h5>
                <div className="metric-value confidence">{isProcessing ? "--" : `${Math.round(lastPrediction.confidence)}%`}</div>
              </div>
            </div>
            
            {/* Metric Card: Accuracy */}
            <div className="metric-card">
              <div className="metric-icon">⭐</div>
              <div className="metric-content">
                <h5>Accuracy</h5>
                <div className="metric-value accuracy">{isProcessing ? "--" : `${Math.round(accuracy)}%`}</div>
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
  );
});

const VisualGuide = React.memo(function VisualGuide({ phoneme }) {
  return (
    <div className="visual-guide">
      <div className="guide-main-content">
        <div className="guide-advice-container">
          <div className="guide-advice">
            <h4>💡Let's speak 🗣️</h4>
            <p>{phoneme.visualGuide}</p>
          </div>
        </div>
        <div className="position-guides-container">
          <div className="guide-item">
            <h4>👅 Tongue Position</h4>
            <img src={phoneme.tongueImage} alt="Tongue Position" />
            <p>{phoneme.tonguePosition}</p>
          </div>
          <div className="guide-item">
            <h4>👄 Lip Position</h4>
            <img src={phoneme.lipImage} alt="Lip Position" />
            <p>{phoneme.lipPosition}</p>
          </div>
        </div>
      </div>
      
      <div className="phoneme-info">
        <h3>Phoneme: {phoneme.symbol}</h3>
        <p className="description">{phoneme.description}</p>
        
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
});

const TestSkills = React.memo(function TestSkills({
  phonemeId,
  isRecording,
  isProcessing,
  isMeterActive,
  hMeterValue,
  mMeterValue,
  sMeterValue,
  practiceCount,
  difficulty,
  phoneme,
  showFeedback,
  lastPrediction,
  accuracy,
  startRecording,
  stopRecording,
  toggleMeterAnalysis,
  targets
}) {
  return (
    <div className="test-skills">
      <h3>Test Your Skills</h3>
      <p>Record yourself saying the phoneme and get feedback</p>
      
      <div className="recording-section">
        <div className="record-phoneme-card">
          
          {/* Real-time Feedback Meters */}
          <div className="real-time-meters" data-phoneme={phonemeId}>
              <motion.button
                className={`record-button large ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={() => { if(isRecording) stopRecording() }} // Stop if mouse leaves while recording
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
                {isProcessing ? 'Processing...' : isRecording ? `Recording...` : 'Hold to Record'}
              </motion.button>
            <div className="meter-container">
              <div className="meter-label">Airflow</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill h-meter"
                  style={{ height: `${hMeterValue}%`, transition: 'height 0.1s ease-out' }}
                ></div>
                <div className="meter-target h-target" style={{ bottom: `${targets.h[0]}%`, height: `${targets.h[1] - targets.h[0]}%` }}></div>
              </div>
              <div className="meter-value">{Math.round(hMeterValue)}%</div>
            </div>
            
            <div className="meter-container">
              <div className="meter-label">Voicing</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill m-meter"
                  style={{ height: `${mMeterValue}%`, transition: 'height 0.1s ease-out' }}
                ></div>
                <div className="meter-target m-target" style={{ bottom: `${targets.m[0]}%`, height: `${targets.m[1] - targets.m[0]}%` }}></div>
              </div>
              <div className="meter-value">{Math.round(mMeterValue)}%</div>
            </div>
            
            <div className="meter-container">
              <div className="meter-label">Sibilance</div>
              <div className="meter-bar">
                <div 
                  className="meter-fill s-meter"
                  style={{ height: `${sMeterValue}%` }}
                ></div>
                <div className="meter-target s-target" style={{ bottom: `${targets.s[0]}%`, height: `${targets.s[1] - targets.s[0]}%` }}></div>
              </div>
              <div className="meter-value">{Math.round(sMeterValue)}%</div>
            </div>
            {/* **NEW METER TOGGLE BUTTON** */}
              <motion.button
                className={`btn-icon meter-toggle ${isMeterActive ? 'active' : ''}`}
                onClick={toggleMeterAnalysis}
                disabled={isRecording || isProcessing}
                title={isMeterActive ? "Turn off live meters" : "Turn on live meters"}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <BarChart3 size={24} />
              </motion.button>
          </div>
          
          <div className="practice-stats">
            {practiceCount >= 5 ? (
              <div className="mastered-badge">
                <CheckCircle size={24} className="mastered-icon" />
                <span className="mastered-text">Mastered</span>
              </div>
            ) : (
              <div className="stat">
                <span className="stat-label">Practice Count:</span>
                <span className="stat-value">{practiceCount}/5</span>
              </div>
            )}
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
          
           {/* **REPLACEMENT**: Use the memoized component */}
          <PerformanceFeedback
            showFeedback={showFeedback && !isRecording} // also hide during recording
            lastPrediction={lastPrediction}
            accuracy={accuracy}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
});

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
  const [isMeterActive, setIsMeterActive] = useState(false);
  
  // Real-time feedback meters state
  const [hMeterValue, setHMeterValue] = useState(0);
  const [mMeterValue, setMMeterValue] = useState(0);
  const [sMeterValue, setSMeterValue] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const durationTimerRef = useRef(null);
  
  // Real-time audio analysis refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioStreamRef = useRef(null); // Ref to hold the single, stable audio stream

  const availablePhonemes = ['h', 'l', 'p', 'eh'];
  
  const phoneme = phonemeId ? PHONEME_DATA[phonemeId] : null;
  const difficulty = phoneme ? DIFFICULTY_LEVELS[phoneme.difficulty] : null;

  const phonemeTargets = {
    h: { h: [80, 100], m: [0, 10], s: [20, 30] },
    eh: { h: [0, 10], m: [50, 60], s: [10, 20] },
    eh: { h: [0, 10], m: [50, 60], s: [0, 10] },
    p: { h: [0, 10], m: [0, 10], s: [10, 20] },
    // Add other phonemes here if needed
  };

  const currentTargets = phonemeTargets[phonemeId] || { h: [0,0], m: [0,0], s: [0,0] };

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

 // **NEW EFFECT**: Load progress from localStorage when the component mounts or phonemeId changes.
  useEffect(() => {
    if (phonemeId) {
      const { accuracy: storedAccuracy, practiceCount: storedPracticeCount } = getStoredProgress(phonemeId);
      setAccuracy(storedAccuracy);
      setPracticeCount(storedPracticeCount);

      // **FIX**: Reset the session-specific feedback state when changing phonemes.
      setShowFeedback(false);
      setLastPrediction(null);
      setIsProcessing(false);
    }
  }, [phonemeId]); // This runs whenever the user navigates to a new phoneme page.

  // **NEW EFFECT**: Save progress to localStorage whenever accuracy or practiceCount changes.
  useEffect(() => {
    // Only save if phonemeId is valid and it's not the initial state
    if (phonemeId) {
      saveStoredProgress(phonemeId, { accuracy, practiceCount });
    }
  }, [accuracy, practiceCount, phonemeId]);

  // **MAJOR CHANGE**: Centralized audio setup and cleanup with useEffect
  useEffect(() => {
    // Function to initialize the audio stream and analyser
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream; // Store the stream
        
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.8;
        source.connect(analyserRef.current);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check your permissions.');
      }
    };

    setupAudio();

    // Cleanup function: runs when the component unmounts
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop()); // Stop mic access
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

  // **CORRECTED**: This function now perfectly mirrors the logic from script.js
  const analyzeRealTimeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    // --- H-Meter Logic (from script.js) ---
    const floatArray = new Float32Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getFloatFrequencyData(floatArray);

    const magnitudes = Array.from(floatArray, v => Math.pow(10, v / 20));

    let totalEnergy = 0;
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;

    const sampleRate = audioContextRef.current.sampleRate;
    const binWidth = sampleRate / 2 / analyserRef.current.frequencyBinCount;
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

    let logSum = 0;
    for (let i = 0; i < magnitudes.length; i++) {
        const val = Math.max(magnitudes[i], 1e-12);
        logSum += Math.log(val);
    }
    const geoMean = Math.exp(logSum / magnitudes.length);
    const meanEnergy = totalEnergy / magnitudes.length;
    const spectralFlatness = geoMean / (meanEnergy + 1e-12);
    
    // Condition to detect /h/ sound
    const isHDetected = totalEnergy > 1e-2 && lowRatio < 0.15 && highRatio > 0.35 && spectralFlatness > 0.2;
    // Calculate a meter value based on the detection strength
    const hValue = isHDetected ? Math.min(100, (highRatio * 200 + spectralFlatness * 100)) : 0;
    setHMeterValue(hValue);


    // --- M-Meter and S-Meter Logic (can be refined similarly if needed) ---
    const byteDataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(byteDataArray);
    
    // M-meter value (tonal sounds)
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
    let mValue = 0;
    mValue = 0.8 * mValue + 0.95 * ((rms > 8 && peakFreq > 80 && peakFreq < 400) ? Math.round(100 * Math.exp(-0.5 * ((peakFreq - 200) / 100) ** 2) * Math.min(1, (rms - 8) / 15)) : 0);
    setMMeterValue(mValue);

    // S-meter value (hissing sounds)
    const hissStartFreq = 4000;
    const hissEndFreq = 8000;
    const lowFreqEnd = 2000;
    let hissEnergy = 0;
    let lowEnergy = 0;
    for (let i = 0; i < byteDataArray.length; i++) {
        const freq = i * binWidth;
        const amplitude = byteDataArray[i] / 255.0;
        if (freq >= hissStartFreq && freq <= hissEndFreq) hissEnergy += amplitude;
        else if (freq < lowFreqEnd) lowEnergy += amplitude;
    }
    const sValue = hissEnergy < 1.0 ? 0 : Math.min(100, (hissEnergy / (lowEnergy + 1)) * 20);
    setSMeterValue(sValue);
  }, []); // State setters from useState are stable and don't need to be dependencies

  // **REFACTORED**: Simplified analysis loop stopper
  const stopAnalysisLoop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Reset meters when not recording
    setHMeterValue(0);
    setMMeterValue(0);
    setSMeterValue(0);
  }, []); // No dependencies needed

  // **REFACTORED**: Simplified analysis loop starter
const startAnalysisLoop = useCallback(() => {
    if (!analyserRef.current) return;

    // **FIX**: Always cancel any previous frame to prevent multiple loops.
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }

    const analyze = () => {
      analyzeRealTimeAudio();
      animationFrameRef.current = requestAnimationFrame(analyze);
    };
    analyze();
  }, [analyzeRealTimeAudio]);

  const classifyPhoneme = useCallback(async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      const response = await axios.post('https://vani-zyqj.onrender.com/api/classify-phoneme', formData);
      const result = response.data;
      
      setIsProcessing(false);
      if (result.success) {
        const { phoneme: predictedPhoneme, confidence_percentage: confidence } = result;
        const isCorrect = predictedPhoneme.toLowerCase() === phonemeId.toLowerCase();
        const newAccuracy = (accuracy * practiceCount + (isCorrect ? 100 : 0)) / (practiceCount + 1);
        
        // State will be updated here, which triggers the "save" useEffect
        setAccuracy(newAccuracy);
        setPracticeCount(prev => prev + 1);

        setLastPrediction({ predicted: predictedPhoneme, target: phonemeId, confidence, isCorrect });
        setShowFeedback(true);
        
        // Check practiceCount + 1 because the state update is asynchronous
        if (practiceCount + 1 >= 5) {
          actions.completePhoneme(phonemeId);
          setIsCompleted(true);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error classifying phoneme:', error);
      alert('Error processing audio. Please try again.');
      setIsProcessing(false);
    }
  }, [phonemeId, accuracy, practiceCount, actions]); // Dependencies for calculation and state updates

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    setIsProcessing(true);
    // **MODIFICATION**: Only stop the analysis loop if the meters are not meant to be active.
    if (!isMeterActive) {
      stopAnalysisLoop();
    }
    
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, [isMeterActive, stopAnalysisLoop]); // Add dependency

  const startRecording = useCallback(async () => {
    if (!audioStreamRef.current) {
      alert('Microphone not ready. Please grant permission and try again.');
      return;
    }
    
    // Start the visual meter analysis
    startAnalysisLoop();

    mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current);
    recordedChunksRef.current = [];
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
    
    durationTimerRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 100);
    }, 100);
    
    setTimeout(() => {
        // Ensure we only stop if it's still recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopRecording();
        }
    }, duration);
  }, [startAnalysisLoop, stopRecording, classifyPhoneme]); // FULL dependency list

  const toggleMeterAnalysis = useCallback(() => {
    if (isRecording || isProcessing) return;
    
    setIsMeterActive(prevIsActive => {
      const newIsActive = !prevIsActive;
      if (newIsActive) {
        startAnalysisLoop();
      } else {
        stopAnalysisLoop();
      }
      return newIsActive;
    });
  }, [isRecording, isProcessing, startAnalysisLoop, stopAnalysisLoop]); // Add dependencies

  const playPhoneme = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1000);
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
    if (phonemeId) {
        clearStoredProgress(phonemeId);
    }
    // These state updates will trigger the "save" useEffect, saving the cleared state.
    setPracticeCount(0);
    setAccuracy(0);
    setShowFeedback(false);
    setIsCompleted(false);
    setLastPrediction(null);
    setIsProcessing(false);
    setRecordingDuration(0);
  };

const renderStepContent = () => {
    switch (steps[currentStep].component) {
      case 'VisualGuide':
        return <VisualGuide phoneme={phoneme} />;
      case 'TestSkills':
        return (
          <TestSkills
            phonemeId={phonemeId}
            isRecording={isRecording}
            isProcessing={isProcessing}
            isMeterActive={isMeterActive}
            hMeterValue={hMeterValue}
            mMeterValue={mMeterValue}
            sMeterValue={sMeterValue}
            practiceCount={practiceCount}
            difficulty={difficulty}
            phoneme={phoneme}
            showFeedback={showFeedback}
            lastPrediction={lastPrediction}
            accuracy={accuracy}
            startRecording={startRecording}
            stopRecording={stopRecording}
            toggleMeterAnalysis={toggleMeterAnalysis}
            targets={currentTargets}
          />
        );
      default:
        return <VisualGuide phoneme={phoneme} />;
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
          className="step-content w-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && <VisualGuide phoneme={phoneme} />}
          {currentStep === 1 && 
            <TestSkills 
              phonemeId={phonemeId}
              isRecording={isRecording}
              isProcessing={isProcessing}
              isMeterActive={isMeterActive}
              hMeterValue={hMeterValue}
              mMeterValue={mMeterValue}
              sMeterValue={sMeterValue}
              practiceCount={practiceCount}
              difficulty={difficulty}
              phoneme={phoneme}
              showFeedback={showFeedback}
              lastPrediction={lastPrediction}
              accuracy={accuracy}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleMeterAnalysis={toggleMeterAnalysis}
              targets={currentTargets}
            />
          }
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



