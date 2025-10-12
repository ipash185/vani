// script.js for Floating Feather (/h/ sound)
(() => {
  // --- Element refs ---
  const recordBtn = document.getElementById('recordBtn');
  const debugInfo = document.getElementById('debugInfo');
  const feather = document.getElementById('feather');
  const feedbackText = document.getElementById('feedbackText');

  // --- Configuration / state ---

  let isRecording = false;
  let audioContext = null;
  let analyser = null;

  // --- Main visuals update ---
  function updateVisuals() {
    if (!isRecording || !analyser) return;

    // Use float frequency data (dB values)
    const floatArray = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(floatArray);

    // Convert dB to linear magnitudes
    const magnitudes = Array.from(floatArray, v => Math.pow(10, v / 20));

    let totalEnergy = 0;
    let lowFreqEnergy = 0;
    let highFreqEnergy = 0;

    const sampleRate = audioContext.sampleRate;
    const binWidth = sampleRate / 2 / analyser.frequencyBinCount;
    const lowFreqLimit = 350;   // below 350 Hz = "voiced"
    const highFreqStart = 1000; // above 1 kHz = "h" region

    for (let i = 0; i < magnitudes.length; i++) {
      const freq = i * binWidth;
      const energy = magnitudes[i];
      totalEnergy += energy;
      if (freq < lowFreqLimit) lowFreqEnergy += energy;
      else if (freq > highFreqStart) highFreqEnergy += energy;
    }

    const lowRatio = totalEnergy > 0 ? lowFreqEnergy / totalEnergy : 0;
    const highRatio = totalEnergy > 0 ? highFreqEnergy / totalEnergy : 0;

    // --- Spectral Flatness ---
    // Calculate safely using logs
    let logSum = 0;
    for (let i = 0; i < magnitudes.length; i++) {
      const val = Math.max(magnitudes[i], 1e-12);
      logSum += Math.log(val);
    }
    const geoMean = Math.exp(logSum / magnitudes.length);
    const meanEnergy = totalEnergy / magnitudes.length;
    const spectralFlatness = geoMean / (meanEnergy + 1e-12);

    // --- /h/ detection ---
    if (
      totalEnergy > 1e-2 &&          // ensure some energy
      lowRatio < 0.15 &&             // minimal low-frequency energy
      highRatio > 0.35 &&            // strong high-frequency energy
      spectralFlatness > 0.2         // noisy (non-tonal) spectrum
    ) {
      feather.classList.add('floating');
      feedbackText.textContent = "Detected: /h/ phoneme!";
      feedbackText.style.color = "#10B981";
    } else {
      feather.classList.remove('floating');
      feedbackText.textContent = "Hold the mic and say 'h'!";
      feedbackText.style.color = "#6B7280";
    }

    debugInfo.textContent =
      `Energy: ${totalEnergy.toFixed(2)} | LowRatio: ${lowRatio.toFixed(2)} | HighRatio: ${highRatio.toFixed(2)} | Flatness: ${spectralFlatness.toFixed(2)}`;
  }

  // --- Audio Initialization and Recording Logic ---
  let animationFrameId;
  function analyseLoop() {
    updateVisuals();
    animationFrameId = requestAnimationFrame(analyseLoop);
  }

  function startRecording() {
    initAudio().then(() => {
      isRecording = true;
      recordBtn.classList.add('recording');
      analyseLoop();
    });
  }

  function stopRecording() {
    isRecording = false;
    recordBtn.classList.remove('recording');
    cancelAnimationFrame(animationFrameId);
    feather.classList.remove('floating');
    if (debugInfo) debugInfo.textContent = '';
  }

  let audioInitialized = false;
  function initAudio() {
    if (audioInitialized) return Promise.resolve();

    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);

        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8; // smoother response
        source.connect(analyser);

        audioInitialized = true;
        return Promise.resolve();
      });
  }

  // --- UI event listeners ---
  recordBtn.addEventListener('mousedown', startRecording);
  recordBtn.addEventListener('mouseup', stopRecording);
  recordBtn.addEventListener('mouseleave', () => { if (isRecording) stopRecording(); });
})();
