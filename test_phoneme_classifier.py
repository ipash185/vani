#!/usr/bin/env python3
"""
Test script for phoneme classifier service
"""

import os
import sys
import json
from phoneme_classifier_service import get_classifier

def test_classifier():
    """Test the phoneme classifier with a sample audio file."""
    print("Testing phoneme classifier...")
    
    try:
        # Check if model files exist
        if not os.path.exists("phoneme_recognition_model_vad.h5"):
            print("ERROR: phoneme_recognition_model_vad.h5 not found")
            return False
            
        if not os.path.exists("label_encoder_vad.joblib"):
            print("ERROR: label_encoder_vad.joblib not found")
            return False
        
        # Initialize classifier
        classifier = get_classifier()
        print("✓ Classifier initialized successfully")
        
        # Test with a sample audio file if available
        sample_files = [
            "uploads/1760150663074-recording.webm",
            "uploads/1760150736633-recording.webm", 
            "uploads/1760150744039-recording.webm",
            "uploads/1760153963185-recording.webm"
        ]
        
        test_file = None
        for file_path in sample_files:
            if os.path.exists(file_path):
                test_file = file_path
                break
        
        if test_file:
            print(f"Testing with file: {test_file}")
            result = classifier.classify_audio_file(test_file)
            print("Classification result:")
            print(json.dumps(result, indent=2))
            
            if result["success"]:
                print("✓ Classification successful")
                return True
            else:
                print("✗ Classification failed")
                return False
        else:
            print("No test audio files found, but classifier initialization was successful")
            print("✓ Basic functionality test passed")
            return True
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    success = test_classifier()
    sys.exit(0 if success else 1)
