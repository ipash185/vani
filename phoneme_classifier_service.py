# pip install tensorflow numpy librosa joblib scipy noisereduce

import os
import numpy as np
import librosa
import tensorflow as tf
import joblib
from scipy.io.wavfile import write
import noisereduce as nr
import tempfile
import json

# --- Configuration: Point to your VAD-trained model files ---
MODEL_PATH = "phoneme_recognition_model_vad.h5"
ENCODER_PATH = "label_encoder_vad.joblib"

# --- Audio Parameters ---
SAMPLE_RATE = 22050
RECORD_DURATION = 2.0
TARGET_DURATION = 1.0
MAX_PAD_LEN = int(TARGET_DURATION * SAMPLE_RATE)

class PhonemeClassifier:
    def __init__(self):
        """Initialize the phoneme classifier with model and encoder."""
        self.model = None
        self.label_encoder = None
        self._load_model()
    
    def _load_model(self):
        """Load the trained model and label encoder."""
        try:
            if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
                raise FileNotFoundError(f"Model files not found: {MODEL_PATH} or {ENCODER_PATH}")
            
            # Suppress print statements to avoid JSON parse errors
            # print("Loading the VAD-trained phoneme recognition model...")
            self.model = tf.keras.models.load_model(MODEL_PATH)
            self.label_encoder = joblib.load(ENCODER_PATH)
            # print("Model loaded successfully.")
        except Exception as e:
            # print(f"Error loading model: {e}")
            raise
    
    
    def process_audio_with_vad(self, audio, sample_rate):
        """Trims silence and pads/truncates to the target length."""
        trimmed_audio, index = librosa.effects.trim(audio, top_db=25)
        if trimmed_audio.size == 0:
            return None

        # Robust padding/truncating logic
        if len(trimmed_audio) > MAX_PAD_LEN:
            center = len(trimmed_audio) // 2
            start, end = center - (MAX_PAD_LEN // 2), center + (MAX_PAD_LEN // 2)
            final_audio = trimmed_audio[start:end]
        else:
            final_audio = librosa.util.pad_center(data=trimmed_audio, size=MAX_PAD_LEN, mode='constant')
        return final_audio

    def extract_features(self, file_path):
        """Extracts Mel-spectrogram features from a processed 1-second file."""
        try:
            audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, res_type='kaiser_fast')
            audio = librosa.util.fix_length(data=audio, size=MAX_PAD_LEN)
            mel_spec = librosa.feature.melspectrogram(y=audio, sr=SAMPLE_RATE, n_mels=128)
            log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
            return log_mel_spec
        except Exception as e:
            # print(f"Error extracting features: {e}")
            return None

    def predict_phoneme(self, file_path):
        """Predicts the phoneme for the processed audio file."""
        if self.model is None or self.label_encoder is None:
            raise RuntimeError("Model not loaded")
        
        features = self.extract_features(file_path)
        if features is None: 
            return "Could not extract features.", 0.0
        
        features = features[np.newaxis, ..., np.newaxis]
        prediction_probs = self.model.predict(features, verbose=0)[0]
        predicted_index = np.argmax(prediction_probs)
        predicted_label = self.label_encoder.inverse_transform([predicted_index])[0]
        confidence = prediction_probs[predicted_index]
        return predicted_label, confidence


    def classify_audio_file(self, audio_file_path):
        """
        Classify phoneme from an audio file using the exact pipeline from phoneme_classifier.py.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            dict: Classification result with phoneme, confidence, and metadata
        """
        try:
            # Load audio (2-second recording)
            audio, sr = librosa.load(audio_file_path, sr=SAMPLE_RATE)
            
            # --- Combined Pre-processing Pipeline (exact same as original) ---
            # 2a. Convert to floating point
            recording_float = audio.astype(np.float32)
            if np.max(np.abs(recording_float)) > 1.0:
                recording_float = recording_float / np.max(np.abs(recording_float))

            # 2b. Apply VAD to the audio to find and extract speech
            vad_processed_audio = self.process_audio_with_vad(recording_float, SAMPLE_RATE)
            
            if vad_processed_audio is None:
                return {
                    "success": False,
                    "error": "No speech detected. Please speak louder or closer to the mic.",
                    "phoneme": None,
                    "confidence": 0.0
                }

            # 2c. Convert final 1-second clip back to int16 for saving
            final_audio_int16 = (vad_processed_audio * 32768.0).astype(np.int16)

            # --- Step 3: SAVE AND PREDICT ---
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_path = temp_file.name
                write(temp_path, SAMPLE_RATE, final_audio_int16)
            
            # Predict phoneme
            phoneme, confidence = self.predict_phoneme(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return {
                "success": True,
                "phoneme": phoneme,
                "confidence": float(confidence),
                "confidence_percentage": float(confidence * 100),
                "processed_duration": len(vad_processed_audio) / SAMPLE_RATE
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "phoneme": None,
                "confidence": 0.0
            }

    def classify_audio_data(self, audio_data, sample_rate=SAMPLE_RATE):
        """
        Classify phoneme from raw audio data.
        
        Args:
            audio_data: Raw audio data as numpy array
            sample_rate: Sample rate of the audio
            
        Returns:
            dict: Classification result with phoneme, confidence, and metadata
        """
        try:
            # Convert to float32 if needed
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)
            
            # Normalize if needed
            if np.max(np.abs(audio_data)) > 1.0:
                audio_data = audio_data / np.max(np.abs(audio_data))
            
            # Resample if needed
            if sample_rate != SAMPLE_RATE:
                audio_data = librosa.resample(audio_data, orig_sr=sample_rate, target_sr=SAMPLE_RATE)
            
            # Apply VAD processing
            processed_audio = self.process_audio_with_vad(audio_data, SAMPLE_RATE)
            
            if processed_audio is None:
                return {
                    "success": False,
                    "error": "No speech detected. Please speak louder or closer to the mic.",
                    "phoneme": None,
                    "confidence": 0.0
                }
            
            # Save processed audio to temporary file
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
                temp_path = temp_file.name
                final_audio_int16 = (processed_audio * 32768.0).astype(np.int16)
                write(temp_path, SAMPLE_RATE, final_audio_int16)
            
            # Predict phoneme
            phoneme, confidence = self.predict_phoneme(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            return {
                "success": True,
                "phoneme": phoneme,
                "confidence": float(confidence),
                "confidence_percentage": float(confidence * 100),
                "processed_duration": len(processed_audio) / SAMPLE_RATE
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "phoneme": None,
                "confidence": 0.0
            }

# Global classifier instance
classifier_instance = None

def get_classifier():
    """Get or create the global classifier instance."""
    global classifier_instance
    if classifier_instance is None:
        classifier_instance = PhonemeClassifier()
    return classifier_instance

def classify_phoneme_from_file(file_path):
    """Convenience function to classify phoneme from file."""
    classifier = get_classifier()
    return classifier.classify_audio_file(file_path)

def classify_phoneme_from_data(audio_data, sample_rate=SAMPLE_RATE):
    """Convenience function to classify phoneme from raw data."""
    classifier = get_classifier()
    return classifier.classify_audio_data(audio_data, sample_rate)

# For command line usage
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python phoneme_classifier_service.py <audio_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = classify_phoneme_from_file(file_path)
    print(json.dumps(result))
