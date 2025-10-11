import React, { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mic,
  MicOff,
  BarChart3,
  Volume2,
  CheckCircle,
  Hand,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Star,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { CORE_WORDS } from "../data/phonemes";
import axios from "axios";
import progressService from "../services/progressService";

const WordPractice = () => {
  const { wordId } = useParams();
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isGeneratingWords, setIsGeneratingWords] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStartRef = useRef(null);

  // Load progress and words on component mount
  useEffect(() => {
    const currentProgress = progressService.getProgress();
    setProgress(currentProgress);

    if (wordId) {
      const word =
        currentProgress?.currentWords?.find((w) => w.id === wordId) ||
        CORE_WORDS.find((w) => w.id === wordId);
      if (word) {
        setSelectedWord(word);
      } else {
        // If wordId exists but no word is found, clear selection
        setSelectedWord(null);
      }
    } else {
      // If no wordId in URL, ensure nothing is selected
      setSelectedWord(null);
    }
  }, [wordId]); // This effect correctly depends on wordId

  // Initialize media recorder
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const options = { mimeType: "audio/webm" };
          mediaRecorderRef.current = new MediaRecorder(stream, options);
        })
        .catch((err) => {
          console.error("Error accessing microphone:", err);
          setError(
            "Microphone access denied. Please allow microphone access to use this feature."
          );
        });
    } else {
      setError("Your browser does not support audio recording.");
    }
  }, []);

  /**
   * Analyzes an audio blob to find the actual speech duration without external libraries.
   * @param {Blob} audioBlob The recorded audio blob.
   * @returns {Promise<number>} The detected duration of speech in seconds.
   */
  const getSpeechDurationWithoutLibrary = async (audioBlob) => {
    try {
      // 1. Decode the audio data using the Web Audio API
      const audioContext = new (window.OfflineAudioContext ||
        window.webkitOfflineAudioContext)(1, 44100 * 5, 44100);
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const pcmData = audioBuffer.getChannelData(0); // Get raw PCM data

      // 2. Define analysis parameters
      const frameSize = 1024; // Samples per frame
      const hopSize = frameSize / 2; // Overlap frames by 50%

      // This is the most important value to tune. It depends on microphone sensitivity.
      // A good starting point is between 0.005 and 0.02.
      const energyThreshold = 0.01;

      let firstSpeechFrame = -1;
      let lastSpeechFrame = -1;

      // 3. Loop through the audio data in frames
      const totalFrames = Math.floor(pcmData.length / hopSize);
      for (let i = 0; i < totalFrames; i++) {
        const start = i * hopSize;
        const end = start + frameSize;
        const frame = pcmData.slice(start, end);

        if (frame.length < frameSize) continue;

        // 4. Calculate Energy (Root Mean Square) for the frame
        let sumOfSquares = 0;
        for (let j = 0; j < frame.length; j++) {
          sumOfSquares += frame[j] * frame[j];
        }
        const rms = Math.sqrt(sumOfSquares / frame.length);

        // 5. Classify the frame as speech or silence
        if (rms > energyThreshold) {
          if (firstSpeechFrame === -1) {
            firstSpeechFrame = i; // Mark the start of speech
          }
          lastSpeechFrame = i; // Continuously update the end of speech
        }
      }

      // 6. Calculate the final duration
      if (firstSpeechFrame === -1) {
        console.log("No speech detected above the energy threshold.");
        return 0; // No speech found
      }

      const startTime = (firstSpeechFrame * hopSize) / audioContext.sampleRate;
      const endTime =
        (lastSpeechFrame * hopSize + frameSize) / audioContext.sampleRate;
      const duration = endTime - startTime;

      console.log(
        `Detected speech duration (no library): ${duration.toFixed(2)}s`
      );
      return duration > 0 ? duration : 0;
    } catch (error) {
      console.error("Error analyzing audio for speech duration:", error);
      return 0; // Return 0 on error
    }
  };
  const startRecording = async () => {
    try {
      setError(null);
      setShowResults(false);
      audioChunksRef.current = [];

      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          const durationInSeconds =
            (Date.now() - recordingStartRef.current) / 1000;
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          let speechDuration = await getSpeechDurationWithoutLibrary(audioBlob);
          if (speechDuration <= 0) {
            console.warn(
              "Could not detect speech, falling back to total recording time."
            );
            speechDuration = totalRecordingDuration;
          }
          await transcribeAudio(audioBlob, "recording.webm", speechDuration);
        };

        recordingStartRef.current = Date.now();
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Failed to start recording. Please try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob, filename, duration) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, filename);

      const response = await axios.post(
        "http://localhost:5000/api/transcribe",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { text: transcribedText, confidence } = response.data;
      setRecordedText(transcribedText);

      // If a word is selected, analyze it
      if (selectedWord) {
        await analyzeWord(selectedWord, transcribedText, duration, confidence);
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const analyzeWord = async (targetWord, spoken, duration, confidence) => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/analyze-word",
        {
          target: targetWord.word,
          spoken,
        }
      );

      const analysisData = response.data;

      // Calculate speaking speed
      const TARGET_WORD_DURATION = 0.8;
      const speedFactor = duration > 0 ? TARGET_WORD_DURATION / duration : 0;

      const transformedAnalysis = {
        accuracy: analysisData.score,
        clarity: confidence * 100,
        speed: speedFactor,
        phonemeAccuracy: {},
        detailedAnalysis: analysisData,
        misspoken: analysisData.misspoken,
        alignment: analysisData.alignment,
      };

      setAnalysis(transformedAnalysis);
      setShowResults(true);

      // Update progress tracking
      const updatedProgress = progressService.updateWordProgress(
        targetWord,
        analysisData.score,
        confidence * 100,
        speedFactor
      );
      setProgress(updatedProgress);

      // Check if word is completed (accuracy >= 80%)
      if (analysisData.score >= 80) {
        setIsCompleted(true);
        actions.completeWord(targetWord.id);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze word. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate new AI-powered words
  const generateNewWords = async () => {
    setIsGeneratingWords(true);
    setError(null);

    try {
      const progressSummary = progressService.getProgressSummary();
      const response = await axios.post(
        "http://localhost:5000/api/generate-words",
        {
          progress: progressSummary,
        }
      );

      const { words } = response.data;

      // Update progress with new words
      const updatedProgress = progressService.updateCurrentWords(words);
      setProgress(updatedProgress);

      // Clear current selection
      setSelectedWord(null);
      setShowResults(false);
      setAnalysis(null);
      const firstNewWordId = words[0].id;
      navigate(`/word/${firstNewWordId}`);
    } catch (err) {
      console.error("Word generation error:", err);
      if (err.response) {
        setError(
          `Failed to generate new words: ${
            err.response.data.error || "Please try again."
          }`
        );
      } else {
        setError("Failed to generate new words. Please try again.");
      }
    } finally {
      setIsGeneratingWords(false);
    }
  };

  const handleWordSelect = (word) => {
    setSelectedWord(word);
    setShowResults(false);
    setError(null);
  };

  const handleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // If wordId is provided and word not found, show error
  if (wordId && !selectedWord) {
    return (
      <div className="main-content">
        <div className="error-page">
          <h2>Word not found</h2>
          <Link to="/" className="btn btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

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
            <h1>Word Practice</h1>
            <p>
              Practice individual words and get detailed feedback on your
              pronunciation
            </p>
          </div>

          {/* Progress Statistics */}
          {progress && (
            <div className="progress-stats">
              <div className="stat-item">
                <TrendingUp size={16} />
                <span>Sessions: {progress.totalSessions}</span>
              </div>
              <div className="stat-item">
                <BarChart3 size={16} />
                <span>
                  Avg Accuracy: {Math.round(progress.averageAccuracy)}%
                </span>
              </div>
              <div className="stat-item">
                <span>🔥 Streak: {progress.streak} days</span>
              </div>
            </div>
          )}
        </div>

        <style>
          {`
            .close-modal-btn {
              position: absolute;
              top: 10px;
              right: 10px;
              background: transparent;
              border: none;
              cursor: pointer;
              color: #666;
            }
            .close-modal-btn:hover {
              color: #000;
            }
          `}
        </style>

        {/* Recording Section */}
        <div className="recording-section">
          <div className="recording-controls">
            <motion.button
              className={`record-button large ${
                isRecording ? "recording" : ""
              }`}
              onClick={handleRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!selectedWord}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
              {isRecording ? "Stop Recording" : "Start Recording"}
            </motion.button>

            <div className="recording-status">
              {isRecording ? (
                <motion.div
                  className="recording-indicator"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🔴 Recording...
                </motion.div>
              ) : isTranscribing || isAnalyzing ? (
                <motion.div
                  className="loading-message"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 size={20} className="spinning" />
                  <span>
                    {isTranscribing
                      ? "Transcribing your speech..."
                      : "Analyzing your pronunciation..."}
                  </span>
                </motion.div>
              ) : error ? (
                <motion.div
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </motion.div>
              ) : (
                <p>
                  {selectedWord
                    ? `Click to record the word "${selectedWord.word}".`
                    : "Please select a word to begin."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {showResults && analysis && selectedWord && (
          <motion.div
            className="analysis-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Analysis Results for "{selectedWord.word}"</h3>

            <div className="transcription">
              <h4>Transcribed Text:</h4>
              <p className="transcribed-text">"{recordedText}"</p>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon">
                  <BarChart3 size={24} />
                </div>
                <div className="metric-content">
                  <h4>Overall Accuracy</h4>
                  <div className="metric-value">
                    {Math.round(analysis.accuracy)}%
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill"
                      style={{ width: `${analysis.accuracy}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <Volume2 size={24} />
                </div>
                <div className="metric-content">
                  <h4>Clarity</h4>
                  <div className="metric-value">
                    {Math.round(analysis.clarity)}%
                  </div>
                  <div className="metric-bar">
                    <div
                      className="metric-fill"
                      style={{ width: `${analysis.clarity}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-icon">
                  <CheckCircle size={24} />
                </div>
                <div className="metric-content">
                  <h4>Speaking Speed</h4>
                  <div className="metric-value">
                    {analysis.speed.toFixed(1)}x
                  </div>
                  <div className="metric-description">
                    {analysis.speed < 0.8
                      ? "Too slow"
                      : analysis.speed > 1.2
                      ? "Too fast"
                      : "Perfect speed"}
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            {analysis.detailedAnalysis && (
              <div className="detailed-analysis">
                <h4>Detailed Analysis</h4>
                <div className="analysis-stats">
                  <div className="stat-item">
                    <span className="stat-label">Expected Word:</span>
                    <span className="stat-value">
                      {analysis.detailedAnalysis.counts.expected_words}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Spoken Word:</span>
                    <span className="stat-value">
                      {analysis.detailedAnalysis.counts.spoken_words}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Substitutions:</span>
                    <span className="stat-value">
                      {analysis.detailedAnalysis.counts.substitutions}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Insertions:</span>
                    <span className="stat-value">
                      {analysis.detailedAnalysis.counts.insertions}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Deletions:</span>
                    <span className="stat-value">
                      {analysis.detailedAnalysis.counts.deletions}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Misspoken Words */}
            {analysis.misspoken && analysis.misspoken.length > 0 && (
              <div className="misspoken-words">
                <h4>Pronunciation Issues</h4>
                <div className="misspoken-list">
                  {analysis.misspoken.map((item, index) => (
                    <div key={index} className="misspoken-item">
                      <span className="expected-word">{item.expected}</span>
                      <span className="arrow">→</span>
                      <span className="spoken-word">{item.spoken}</span>
                      <span className="distance">
                        ({Math.round(item.distance * 100)}% different)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="improvement-suggestions">
              <h4>Improvement Suggestions</h4>
              <ul>
                {analysis.misspoken && analysis.misspoken.length > 0 ? (
                  analysis.misspoken.map((item, index) => (
                    <li key={index}>
                      Practice saying "{item.expected}" instead of "
                      {item.spoken}"
                    </li>
                  ))
                ) : (
                  <li>Great job! Your pronunciation is very accurate.</li>
                )}
                {analysis.accuracy < 80 && (
                  <li>Try speaking more slowly and clearly</li>
                )}
                {analysis.clarity < 85 && (
                  <li>Focus on enunciating each phoneme distinctly</li>
                )}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Practice Words */}
        <div className="sample-words">
          <div className="words-header">
            <h3>
              {progress?.isUsingAIWords
                ? "AI-Generated Practice Words"
                : "Practice Words"}
            </h3>
            <motion.button
              className="generate-words-btn"
              onClick={generateNewWords}
              disabled={isGeneratingWords}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGeneratingWords ? (
                <Loader2 size={16} className="spinning" />
              ) : (
                <RefreshCw size={16} />
              )}
              {isGeneratingWords ? "Generating..." : "Get New Words"}
            </motion.button>
          </div>

          <div className="words-list">
            {progress?.currentWords?.map((word, index) => (
              <motion.div
                key={word.id}
                className={`word-card ${
                  selectedWord?.id === word.id ? "selected" : ""
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleWordSelect(word)}
              >
                <div className="word-content">
                  <h4>{word.word}</h4>
                  <p className="word-meaning">{word.meaning}</p>
                  <div className="phonemes-display">
                    {word.phonemes.map((phoneme, idx) => (
                      <span key={idx} className="phoneme-symbol">
                        /{phoneme}/
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  className="sign-language-btn"
                  title="View in sign language"
                >
                  <Hand size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          {progress?.isUsingAIWords && (
            <div className="ai-words-info">
              <p>
                🤖 These words were generated based on your progress to help you
                practice essential communication!
              </p>
            </div>
          )}
        </div>

        {/* Completion Modal */}
        {isCompleted && selectedWord && (
          <motion.div
            className="completion-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                <Star size={64} />
              </motion.div>
              <h2>Congratulations! 🎉</h2>
              <p>You've mastered the word "{selectedWord.word}"!</p>
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
      </div>
    </div>
  );
};

export default WordPractice;
