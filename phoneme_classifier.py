# pip install tensorflow numpy librosa joblib sounddevice scipy noisereduce

import os
import time
import numpy as np
import librosa
import tensorflow as tf
import joblib
import sounddevice as sd
from scipy.io.wavfile import write
import noisereduce as nr

# --- Configuration: Point to your VAD-trained model files ---
MODEL_PATH = "phoneme_recognition_model_vad.h5"
ENCODER_PATH = "label_encoder_vad.joblib"
TEMP_FILENAME = "temp_live_ultimate_processed.wav"

# --- Audio Parameters ---
SAMPLE_RATE = 22050
RECORD_DURATION = 2.0
TARGET_DURATION = 1.0
MAX_PAD_LEN = int(TARGET_DURATION * SAMPLE_RATE)

def check_files():
    """Checks if the required model and encoder files exist."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(ENCODER_PATH):
        print(f"Error: Make sure '{MODEL_PATH}' and '{ENCODER_PATH}' are in the same directory.")
        return False
    return True

def capture_noise_profile(duration=3, sample_rate=SAMPLE_RATE):
    """Records dedicated audio of background noise for calibration."""
    print("="*45)
    print("NOISE PROFILE CALIBRATION".center(45))
    print("Please be completely silent for 3 seconds after pressing Enter.")
    input("Press Enter to begin recording background noise...")
    
    print("Recording noise...")
    noise_recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1)
    sd.wait()
    print("Noise profile captured successfully.")
    print("="*45 + "\n")
    
    # Convert to floating point for noisereduce
    return noise_recording.flatten().astype(np.float32) / 32768.0

def process_audio_with_vad(audio, sample_rate):
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

def extract_features(file_path):
    """Extracts Mel-spectrogram features from a processed 1-second file."""
    try:
        audio, _ = librosa.load(file_path, sr=SAMPLE_RATE, res_type='kaiser_fast')
        audio = librosa.util.fix_length(data=audio, size=MAX_PAD_LEN)
        mel_spec = librosa.feature.melspectrogram(y=audio, sr=SAMPLE_RATE, n_mels=128)
        log_mel_spec = librosa.power_to_db(mel_spec, ref=np.max)
        return log_mel_spec
    except Exception as e:
        print(f"Error extracting features: {e}")
        return None

def predict_phoneme(model, label_encoder, file_path):
    """Predicts the phoneme for the processed audio file."""
    features = extract_features(file_path)
    if features is None: return "Could not extract features.", 0.0
    features = features[np.newaxis, ..., np.newaxis]
    prediction_probs = model.predict(features, verbose=0)[0]
    predicted_index = np.argmax(prediction_probs)
    predicted_label = label_encoder.inverse_transform([predicted_index])[0]
    confidence = prediction_probs[predicted_index]
    return predicted_label, confidence

# --- Main Execution Block ---
if _name_ == "_main_":
    if not check_files():
        exit()

    print("Loading the VAD-trained phoneme recognition model...")
    model = tf.keras.models.load_model(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)
    print("Model loaded successfully.")

    # --- Step 1: CALIBRATE NOISE PROFILE AT THE START ---
    noise_profile = capture_noise_profile()

    print("="*50)
    print(" ULTIMATE LIVE RECOGNITION (Denoise + VAD) ".center(50, '='))
    print("="*50)
    print("Type 'quit' and press Enter to exit.")
    print("-"*50)

    while True:
        user_input = input("\nPress Enter to record a phoneme: ")
        if user_input.lower() == 'quit':
            break

        try:
            # --- Step 2: RECORD ---
            print("Recording for 2 seconds...")
            recording_int16 = sd.rec(int(RECORD_DURATION * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
            sd.wait()
            print("Processing...")

            # --- Combined Pre-processing Pipeline ---
            # 2a. Convert to floating point
            recording_float = recording_int16.flatten().astype(np.float32) / 32768.0

            # 2b. Denoise the entire 2-second clip first
            cleaned_recording = nr.reduce_noise(y=recording_float, sr=SAMPLE_RATE, y_noise=noise_profile, stationary=True)

            # 2c. Apply VAD to the cleaned audio to find and extract speech
            vad_processed_audio = process_audio_with_vad(cleaned_recording, SAMPLE_RATE)
            
            if vad_processed_audio is None:
                print("\n--- No speech detected. Please speak louder or closer to the mic. ---")
                continue

            # 2d. Convert final 1-second clip back to int16 for saving
            final_audio_int16 = (vad_processed_audio * 32768.0).astype(np.int16)

            # --- Step 3: SAVE AND PREDICT ---
            write(TEMP_FILENAME, SAMPLE_RATE, final_audio_int16)
            phoneme, confidence = predict_phoneme(model, label_encoder, TEMP_FILENAME)
            
            print("\n--- Prediction Result ---")
            print(f"   I think you said: '{phoneme}'")
            print(f"   Confidence: {confidence*100:.2f}%")
            print("-------------------------")

        except Exception as e:
            print(f"An error occurred: {e}")
        finally:
            if os.path.exists(TEMP_FILENAME):
                os.remove(TEMP_FILENAME)

    print("\nExiting live prediction tool.")