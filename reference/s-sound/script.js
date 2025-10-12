// --- Get references to the HTML elements ---
const recordBtn = document.getElementById('recordBtn');
const feedbackVisual = document.querySelector('.feedback-visual');
const hissBar = document.getElementById('hissBar');
const correctFeedback = document.getElementById('correctFeedback'); // New element

// =======================================================
// === MICROPHONE AND REAL-TIME ANALYSIS ===
// =======================================================
let isRecording = false;
let audioContext;
let analyser;
let correctCounter = 0; // New: Counter for successful frames
const CORRECT_THRESHOLD = 15; // Require 15 successful frames (about 0.25s)

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function(stream) {
        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.5;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        function calculateHissQuality() {
            analyser.getByteFrequencyData(dataArray);
            const sampleRate = audioContext.sampleRate;
            const nyquist = sampleRate / 2;
            const binWidth = nyquist / dataArray.length;
            const hissStartFreq = 4000;
            const hissEndFreq = 8000;
            const lowFreqEnd = 2000;
            
            let hissEnergy = 0;
            let lowEnergy = 0;

            for (let i = 0; i < dataArray.length; i++) {
                const freq = i * binWidth;
                const amplitude = dataArray[i] / 255.0;

                if (freq >= hissStartFreq && freq <= hissEndFreq) {
                    hissEnergy += amplitude;
                } else if (freq < lowFreqEnd) {
                    lowEnergy += amplitude;
                }
            }
            
            if (hissEnergy < 1.0) return 0;
            const quality = hissEnergy / (lowEnergy + 1);
            return Math.min(100, quality * 20);
        }

        function draw() {
            if (!isRecording) return;
            requestAnimationFrame(draw);

            // 1. Loudness Analysis
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for(const amplitude of dataArray) { sum += amplitude * amplitude; }
            let averageVolume = Math.sqrt(sum / dataArray.length);
            recordBtn.style.borderWidth = (10 + averageVolume / 4) + 'px';

            // 2. Hiss Analysis
            const hissQualityPercent = calculateHissQuality();
            hissBar.style.height = hissQualityPercent + '%';

            // --- NEW: Check for Correctness ---
            // Is the bar in the target zone (e.g., between 60% and 95%)?
            if (hissQualityPercent > 60 && hissQualityPercent < 95) {
                correctCounter++;
            } else {
                correctCounter = 0; // Reset if it falls out of the zone
            }
            
            // If the counter reaches our threshold, show the message
            if (correctCounter >= CORRECT_THRESHOLD) {
                correctFeedback.classList.add('show');
            }
        }

        // --- Update button interaction logic ---
        recordBtn.addEventListener('mousedown', () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            isRecording = true;
            recordBtn.classList.add('recording');
            feedbackVisual.classList.add('active');
            correctFeedback.classList.remove('show'); // Hide message on new attempt
            correctCounter = 0; // Reset counter
            draw();
        });

        recordBtn.addEventListener('mouseup', () => {
            isRecording = false;
            recordBtn.classList.remove('recording');
            feedbackVisual.classList.remove('active');
            recordBtn.style.borderWidth = '10px';
            hissBar.style.height = '0%';
            // Keep the "CORRECT!" message visible until the next attempt
        });
        
    })
    .catch(function(err) { console.error('Error accessing microphone: ' + err); });
}