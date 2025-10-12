// Import Meyda using the full relative path
import Meyda from "./node_modules/meyda/dist/esm/main.js";

// script.js for Blooming Flower (/m/ sound) - FINAL WORKING VERSION
(() => {
  // --- Element refs ---
  const recordBtn = document.getElementById('recordBtn');
  const debugInfo = document.getElementById('debugInfo');
  const flowerPetals = document.getElementById('flowerPetals');
  const successText = document.getElementById('successText');
  const feedbackText = document.getElementById('feedbackText');

  // =================================================
  // === CONFIGURATION - ADJUST THESE FOR YOUR MIC ===
  // =================================================
  const PITCH_MIN_HZ = 70;    // For a low voice, try 50
  const PITCH_MAX_HZ = 500;   // For a high voice, try 600
  const RMS_THRESHOLD = 0.005; // If your mic is quiet, try 0.01
  // =================================================
  
  let isRecording = false;
  let audioContext = null;
  let meydaAnalyzer = null;
  let analyser = null;
  let dataArray = null;
  let successState = false;
  let bloomLevel = 0;
  let animationFrameId = null;

  // --- Event Handlers ---
  const startRecording = () => {
    ensureAudioInit().then(() => {
      isRecording = true;
      recordBtn.classList.add('recording');
      feedbackText.textContent = "Keep humming 'mmmm'...";
      feedbackText.style.color = "#6B7280";
      if (meydaAnalyzer) meydaAnalyzer.start();
      animate();
    }).catch(err => {
      console.error("Could not start recording:", err);
      feedbackText.textContent = "Microphone error!";
    });
  };

  const stopRecording = () => {
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordBtn.style.borderWidth = '10px';
    feedbackText.textContent = "Hold the mic to try!";
    feedbackText.style.color = "#6B7280";
    if (meydaAnalyzer) meydaAnalyzer.stop();
  };

  recordBtn.addEventListener('mousedown', startRecording);
  recordBtn.addEventListener('mouseup', stopRecording);
  recordBtn.addEventListener('mouseleave', () => { if (isRecording) stopRecording(); });
  recordBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startRecording(); }, { passive: false });
  recordBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopRecording(); }, { passive: false });

  // --- Animation & Visuals Loop ---
  function animate() {
    if (isRecording && analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
      recordBtn.style.borderWidth = (10 + Math.min(100, average) / 3) + 'px';
    }

    if (!isRecording && bloomLevel > 0) {
      bloomLevel = Math.max(0, bloomLevel - 0.03);
      updateFlowerVisuals();
    }
    
    if (isRecording || bloomLevel > 0) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrameId);
    }
  }

  function updateFlowerVisuals() {
    const scale = 0.2 + (bloomLevel * 0.8);
    flowerPetals.style.transform = `scale(${scale})`;

    if (bloomLevel >= 1 && !successState) {
      successState = true;
      flowerPetals.classList.add('bloomed');
      successText.textContent = "🌸 Beautiful! 🌸";
      successText.classList.add('show');
      feedbackText.textContent = "Perfect 'M' sound! 🎉";
      feedbackText.style.color = "#10B981";
    } else if (bloomLevel < 1 && successState) {
      successState = false;
      flowerPetals.classList.remove('bloomed');
      successText.classList.remove('show');
    }
    
    if (isRecording && bloomLevel > 0 && bloomLevel < 1) {
      feedbackText.textContent = "Keep going! Almost there...";
      feedbackText.style.color = "#F59E0B";
    }
  }

  // --- Meyda Audio Analysis ---
  function meydaCallback(features) {
    if (!isRecording || !features) return;

    const rms = features.rms || 0;
    const pitch = features.pitch || 0;

    const hasSufficientVolume = rms > RMS_THRESHOLD;
    const hasValidPitch = pitch >= PITCH_MIN_HZ && pitch <= PITCH_MAX_HZ;
    const isHumming = hasSufficientVolume && hasValidPitch;
    
    console.log(
        `RMS: ${rms.toFixed(4)} (Thr: ${RMS_THRESHOLD}) -> Vol OK? ${hasSufficientVolume} | ` +
        `Pitch: ${pitch.toFixed(1)} Hz (Rng: ${PITCH_MIN_HZ}-${PITCH_MAX_HZ}) -> Pitch OK? ${hasValidPitch} | ` +
        `HUMMING? ${isHumming}`
    );
    
    if (isHumming) {
      bloomLevel = Math.min(1, bloomLevel + 0.05);
    } else {
      bloomLevel = Math.max(0, bloomLevel - 0.02);
    }

    updateFlowerVisuals();

    const pitchText = pitch ? pitch.toFixed(1) : "N/A";
    const bloomPercent = (bloomLevel * 100).toFixed(0);
    const statusText = isHumming ? " ✓ HUMMING!" : "";
    if (debugInfo) {
      debugInfo.textContent = `Pitch: ${pitchText} Hz | RMS: ${rms.toFixed(3)} | Bloom: ${bloomPercent}%${statusText}`;
    }
  }

  // --- Audio Initialization ---
  function initAudio() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support microphone access.');
      return Promise.reject(new Error('getUserMedia not supported'));
    }

    return navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      meydaAnalyzer = Meyda.createMeydaAnalyzer({
        audioContext: audioContext,
        source: source,
        bufferSize: 2048,
        featureExtractors: ['pitch', 'rms'],
        callback: meydaCallback
      });
      return Promise.resolve();
    }).catch(err => {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please allow microphone access and reload the page.');
      return Promise.reject(err);
    });
  }

  let audioInitialized = false;
  const ensureAudioInit = () => {
    if (audioInitialized) {
      if (audioContext?.state === 'suspended') return audioContext.resume();
      return Promise.resolve();
    }
    audioInitialized = true;
    return initAudio();
  };
})();