import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, BarChart3, Volume2, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SentenceAnalysis = () => {
  const { state } = useApp();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const sampleSentences = [
    "I need help please",
    "Yes, I can do that",
    "No, I don't want more",
    "Please stop that",
    "I am done eating"
  ];

  const handleRecording = () => {
    if (isRecording) {
      // Stop recording and simulate analysis
      setIsRecording(false);
      
      // Simulate Whisper API analysis
      const simulatedText = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
      setRecordedText(simulatedText);
      
      // Simulate analysis results
      const simulatedAnalysis = {
        accuracy: Math.random() * 20 + 80, // 80-100%
        clarity: Math.random() * 15 + 85, // 85-100%
        speed: Math.random() * 0.5 + 1.0, // 1.0-1.5x
        phonemeAccuracy: {
          'h': Math.random() * 20 + 80,
          'e': Math.random() * 15 + 85,
          'l': Math.random() * 25 + 75,
          'p': Math.random() * 20 + 80
        }
      };
      
      setAnalysis(simulatedAnalysis);
      setShowResults(true);
    } else {
      setIsRecording(true);
      setShowResults(false);
    }
  };

  return (
    <div className="main-content">
      <div className="sentence-analysis-container">
        <div className="analysis-header">
          <h1>Sentence Analysis</h1>
          <p>Record a sentence and get detailed feedback on your pronunciation</p>
        </div>

        {/* Recording Section */}
        <div className="recording-section">
          <div className="recording-controls">
            <motion.button
              className={`record-button large ${isRecording ? 'recording' : ''}`}
              onClick={handleRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
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
              ) : (
                <p>Click the button to start recording your sentence</p>
              )}
            </div>
          </div>
        </div>

        {/* Sample Sentences */}
        <div className="sample-sentences">
          <h3>Try these sentences:</h3>
          <div className="sentences-list">
            {sampleSentences.map((sentence, index) => (
              <motion.div
                key={index}
                className="sentence-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <p>{sentence}</p>
                <button className="play-sentence-btn">
                  <Volume2 size={16} />
                </button>
              </motion.div>
            ))}
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
                  <div className="metric-value">{Math.round(analysis.accuracy)}%</div>
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
                  <div className="metric-value">{Math.round(analysis.clarity)}%</div>
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
                  <div className="metric-value">{analysis.speed.toFixed(1)}x</div>
                  <div className="metric-description">
                    {analysis.speed < 0.8 ? 'Too slow' : 
                     analysis.speed > 1.2 ? 'Too fast' : 'Perfect speed'}
                  </div>
                </div>
              </div>
            </div>

            <div className="phoneme-breakdown">
              <h4>Phoneme Accuracy</h4>
              <div className="phoneme-metrics">
                {Object.entries(analysis.phonemeAccuracy).map(([phoneme, accuracy]) => (
                  <div key={phoneme} className="phoneme-metric">
                    <span className="phoneme-symbol">/{phoneme}/</span>
                    <div className="phoneme-bar">
                      <div 
                        className="phoneme-fill"
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                    <span className="phoneme-accuracy">{Math.round(accuracy)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="improvement-suggestions">
              <h4>Improvement Suggestions</h4>
              <ul>
                <li>Practice the /h/ sound with more breath</li>
                <li>Slow down slightly for better clarity</li>
                <li>Focus on the /l/ sound pronunciation</li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SentenceAnalysis;
