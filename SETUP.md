# Vani Speech Practice - Setup Instructions

## Prerequisites

- Node.js (v14 or higher)
- Python 3.7 or higher
- npm or yarn

## Installation

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up API Keys

1. **AssemblyAI API Key** (for speech transcription):
   - Go to [AssemblyAI Dashboard](https://www.assemblyai.com/dashboard/signup) and sign up for a free account
   - Get your API key from the dashboard

2. **OpenRouter API Key** (for AI-generated practice sentences):
   - Go to [OpenRouter](https://openrouter.ai/) and sign up for a free account
   - Get your API key from the dashboard

3. Create a `.env` file in the project root:
   ```bash
   # Create .env file
   echo "ASSEMBLYAI_API_KEY=your_assemblyai_key_here" > .env
   echo "OPENROUTER_API_KEY=your_openrouter_key_here" >> .env
   ```
4. Replace the placeholder keys with your real API keys

### 4. Start the Development Environment

You can start both the frontend and backend servers simultaneously:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend server
npm run server

# Terminal 2 - Frontend development server
npm start
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Go to the "Sentence Analysis" tab
3. Select a sentence from the list
4. Click the record button to start recording
5. Speak the selected sentence
6. Click stop to end recording
7. The system will transcribe your speech and analyze your pronunciation

## Features

- **Real-time Voice Recording**: Uses browser's MediaRecorder API
- **Speech Transcription**: Integrates with AssemblyAI (currently simulated)
- **Pronunciation Analysis**: Uses Python-based phoneme analysis
- **Sign Language Support**: Replaced audio buttons with sign language buttons for hearing-impaired users
- **Detailed Feedback**: Shows accuracy, clarity, and specific word-level analysis

## API Endpoints

- `POST /api/transcribe` - Transcribe audio file
- `POST /api/analyze` - Analyze pronunciation using Python scorer

## Configuration

The backend server runs on port 5000 by default. You can change this by setting the `PORT` environment variable.

## Troubleshooting

### API Key Issues
- **Error: "AssemblyAI API key is not set"**
  - Make sure you've created a `.env` file in the project root
  - Verify your AssemblyAI API key is correct (no extra spaces or quotes)
  - Restart the server after adding the API key: `npm run dev`

- **Error: "OpenRouter API key is not set"**
  - Make sure you've added the OpenRouter API key to your `.env` file
  - Verify your OpenRouter API key is correct
  - Restart the server after adding the API key: `npm run dev`

- **Error: "Failed to generate new sentences"**
  - Check that your OpenRouter API key is valid and has credits
  - Ensure you have an active internet connection
  - Try again after a few seconds

### Microphone Access Issues
- Ensure your browser has permission to access the microphone
- Try refreshing the page and allowing microphone access when prompted

### Python Dependencies Issues
- Make sure you have Python 3.7+ installed
- Try using a virtual environment: `python -m venv venv && source venv/bin/activate` (Linux/Mac) or `venv\Scripts\activate` (Windows)

### Server Connection Issues
- Ensure the backend server is running on port 5000
- Check that no other application is using port 5000

### Audio Format Issues
- The app now uses WebM format for better browser compatibility
- If you still have issues, try using Chrome or Firefox browsers
