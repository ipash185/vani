import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
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
import axios from "axios";
import progressService from "../services/progressService";

const SentenceAnalysis = () => {
  const { state } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSentence, setSelectedSentence] = useState("");
  const [isGeneratingSentences, setIsGeneratingSentences] = useState(false);
  const [progress, setProgress] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  // --- NEW: Ref to store the recording start time ---
  const recordingStartRef = useRef(null);

  // Load progress and sentences on component mount
  useEffect(() => {
    const currentProgress = progressService.getProgress();
    setProgress(currentProgress);
  }, []);

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
          // --- NEW: Calculate recording duration ---
          const durationInSeconds =
            (Date.now() - recordingStartRef.current) / 1000;

          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          await transcribeAudio(audioBlob, "recording.webm", durationInSeconds);
        };

        // --- NEW: Record the start time ---
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

  // --- MODIFIED: Accept duration as an argument ---
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

      // If a sentence is selected, analyze it
      if (selectedSentence) {
        // --- MODIFIED: Pass duration and confidence to the analysis function ---
        await analyzeSentence(
          selectedSentence,
          transcribedText,
          duration,
          confidence
        );
      }
    } catch (err) {
      console.error("Transcription error:", err);
      setError("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // --- MODIFIED: Accept duration and confidence for calculation ---
  const analyzeSentence = async (target, spoken, duration, confidence) => {
    setIsAnalyzing(true);
    try {
      const response = await axios.post("http://localhost:5000/api/analyze", {
        target,
        spoken,
      });

      const analysisData = response.data;

      // --- NEW: Calculate speaking speed ---
      const spokenWordCount = spoken.trim().split(/\s+/).length;
      const wordsPerMinute = (spokenWordCount / duration) * 60;
      // Normalize speed: 1.0x is ~150 WPM. This prevents division by zero.
      const speedFactor = wordsPerMinute > 0 ? wordsPerMinute / 150 : 0;

      const transformedAnalysis = {
        accuracy: analysisData.score,
        // --- NEW: Use transcription confidence for clarity ---
        clarity: confidence * 100, // Convert to percentage
        // --- NEW: Use calculated speed factor ---
        speed: speedFactor,
        phonemeAccuracy: {},
        detailedAnalysis: analysisData,
        misspoken: analysisData.misspoken,
        alignment: analysisData.alignment,
      };

      setAnalysis(transformedAnalysis);
      setShowResults(true);

      // --- NEW: Update progress tracking ---
      const updatedProgress = progressService.updateSentenceProgress(
        target,
        analysisData.score,
        confidence * 100,
        speedFactor
      );
      setProgress(updatedProgress);

      if (analysisData.score >= 80) {
        setIsCompleted(true);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze sentence. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate new AI-powered sentences
  const generateNewSentences = async () => {
    setIsGeneratingSentences(true);
    setError(null);

    try {
      const progressSummary = progressService.getProgressSummary();
      const response = await axios.post(
        "http://localhost:5000/api/generate-sentences",
        {
          progress: progressSummary,
        }
      );

      const { sentences } = response.data;

      // Update progress with new sentences
      const updatedProgress = progressService.updateCurrentSentences(sentences);
      setProgress(updatedProgress);

      // Clear current selection
      setSelectedSentence("");
      setShowResults(false);
      setAnalysis(null);
    } catch (err) {
      console.error("Sentence generation error:", err);
      if (err.response) {
        setError(
          `Failed to generate new sentences: ${
            err.response.data.error || "Please try again."
          }`
        );
      } else {
        setError("Failed to generate new sentences. Please try again.");
      }
    } finally {
      setIsGeneratingSentences(false);
    }
  };

  const handleSentenceSelect = (sentence) => {
    setSelectedSentence(sentence);
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

  return (
    // ... a ...
    // The rest of your JSX remains exactly the same.
    // ... b ...
    <div className="main-content">
      <div className="sentence-analysis-container">
        <div className="analysis-header">
          <h1>Sentence Analysis</h1>
          <p>
            Record a sentence and get detailed feedback on your pronunciation
          </p>

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
              disabled={!selectedSentence}
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
                  {selectedSentence
                    ? "Click to record the selected sentence."
                    : "Please select a sentence to begin."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {showResults && analysis && (
          <motion.div
            className="analysis-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3>Analysis Results</h3>

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

            <div className="phoneme-breakdown">
              <h4>Phoneme Accuracy</h4>
              <div className="phoneme-metrics">
                {Object.entries(analysis.phonemeAccuracy).map(
                  ([phoneme, accuracy]) => (
                    <div key={phoneme} className="phoneme-metric">
                      <span className="phoneme-symbol">/{phoneme}/</span>
                      <div className="phoneme-bar">
                        <div
                          className="phoneme-fill"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="phoneme-accuracy">
                        {Math.round(accuracy)}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Detailed Analysis */}
            {analysis.detailedAnalysis && (
              <div className="detailed-analysis">
                <h4>Detailed Analysis</h4>
                <div className="analysis-stats">
                  <div className="stat-item">
                    <span className="stat-label">Expected Words:</span>
                    <span className="stat-value">
                      {analysis.detailedAnalysis.counts.expected_words}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Spoken Words:</span>
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
                <h4>Words to Practice</h4>
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
                  <li>Focus on enunciating each word distinctly</li>
                )}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Practice Sentences */}
        <div className="sample-sentences">
          <div className="sentences-header">
            <h3>
              {progress?.isUsingAISentences
                ? "AI-Generated Practice Sentences"
                : "Practice Sentences"}
            </h3>
            <motion.button
              className="generate-sentences-btn"
              onClick={generateNewSentences}
              disabled={isGeneratingSentences}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isGeneratingSentences ? (
                <Loader2 size={16} className="spinning" />
              ) : (
                <RefreshCw size={16} />
              )}
              {isGeneratingSentences ? "Generating..." : "Get New Sentences"}
            </motion.button>
          </div>

          <div className="sentences-list">
            {progress?.currentSentences?.map((sentence, index) => (
              <motion.div
                key={index}
                className={`sentence-card ${
                  selectedSentence === sentence ? "selected" : ""
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSentenceSelect(sentence)}
              >
                <p>{sentence}</p>
                <button
                  className="sign-language-btn"
                  title="View in sign language"
                >
                  <Hand size={16} />
                </button>
              </motion.div>
            ))}
          </div>

          {progress?.isUsingAISentences && (
            <div className="ai-sentences-info">
              <p>
                🤖 These sentences were generated based on your progress to help
                you practice day-to-day communication!
              </p>
            </div>
          )}
        </div>

        {/* Completion Modal */}
        {isCompleted && selectedSentence && (
          <motion.div
            className="completion-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="completion-content">
              {/* <button
                className="close-modal-btn"
                onClick={() => setIsCompleted(false)}
              >
                <X size={24} />
              </button> */}
              <motion.div
                className="completion-icon"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Star size={64} />
              </motion.div>
              <h2>Congratulations! 🎉</h2>
              <p>You've mastered the sentence "{selectedSentence}"!</p>
              <div className="completion-actions">
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

export default SentenceAnalysis;
