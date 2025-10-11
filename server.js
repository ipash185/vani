const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios'); // Added axios for API calls
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// API Keys - IMPORTANT: Use environment variables in production
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Debug: Check if API keys are loaded
console.log('Environment check:');
console.log('- ASSEMBLYAI_API_KEY loaded:', ASSEMBLYAI_API_KEY ? 'Yes (length: ' + ASSEMBLYAI_API_KEY.length + ')' : 'No');
console.log('- OPENROUTER_API_KEY loaded:', OPENROUTER_API_KEY ? 'Yes (length: ' + OPENROUTER_API_KEY.length + ')' : 'No');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    assemblyAIKeyLoaded: !!ASSEMBLYAI_API_KEY,
    openRouterKeyLoaded: !!OPENROUTER_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// In server.js

// Generate practice sentences using OpenRouter API
app.post('/api/generate-sentences', async (req, res) => {
    try {
      const { progress } = req.body;
      
      if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ 
          error: 'OpenRouter API key is not set. Please check your .env file and restart the server.' 
        });
      }
  
      const prompt = `You are a speech therapist helping a hearing-impaired child learn to speak. 
      
  Current progress: ${JSON.stringify(progress, null, 2)}
  
  Generate exactly 5 new practice sentences that are:
  1. Day-to-day essential sentences the child needs to communicate
  2. Appropriate for their current skill level
  3. Focused on practical communication needs
  4. Simple but meaningful
  5. Progressive in difficulty
  
  Return ONLY a JSON array of 5 strings, no other text. Example format:
  ["I need help please", "Can I have water?", "Thank you very much", "I don't understand", "Please repeat that"]`;
  
      const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
        // --- CHANGE THIS LINE ---
        model: 'mistralai/mistral-7b-instruct:free', // Switched to a more reliable free model
        // --- END CHANGE ---
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Or your actual site URL
          'X-Title': 'Vani Speech Practice'      // Or your actual site name
        }
      });
  
      const generatedText = response.data.choices[0].message.content.trim();
      
      let sentences;
      try {
        sentences = JSON.parse(generatedText);
      } catch (parseError) {
        const sentenceMatches = generatedText.match(/"([^"]+)"/g);
        if (sentenceMatches) {
          sentences = sentenceMatches.map(match => match.replace(/"/g, ''));
        } else {
          throw new Error('Could not parse generated sentences');
        }
      }
  
      if (!Array.isArray(sentences) || sentences.length !== 5) {
        throw new Error('Generated sentences must be an array of exactly 5 strings');
      }
  
      res.json({
        sentences: sentences,
        generatedAt: new Date().toISOString()
      });
  
    } catch (error) {
      console.error('Sentence generation error:', error.response ? error.response.data : error.message);
      res.status(500).json({ 
        error: 'Failed to generate practice sentences',
        details: error.response ? error.response.data : error.message
      });
    }
  });

// ------------------- MODIFIED FUNCTION -------------------

// AssemblyAI transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }
  if (!ASSEMBLYAI_API_KEY) {
    console.error('AssemblyAI API key is not set. Check your .env file.');
    return res.status(500).json({ 
      error: 'AssemblyAI API key is not set. Please check your .env file and restart the server.',
      debug: {
        envFileExists: fs.existsSync('.env'),
        nodeEnv: process.env.NODE_ENV
      }
    });
  }

  const audioFilePath = req.file.path;

  try {
    // STEP 1: Upload the audio file to AssemblyAI
    const fileData = fs.readFileSync(audioFilePath);
    const uploadResponse = await axios.post('https://api.assemblyai.com/v2/upload', fileData, {
      headers: {
        'authorization': ASSEMBLYAI_API_KEY,
        'Content-Type': 'application/octet-stream'
      }
    });
    
    const upload_url = uploadResponse.data.upload_url;
    
    // Clean up the uploaded file from local server storage
    fs.unlinkSync(audioFilePath);

    // STEP 2: Submit the uploaded audio file for transcription
    const transcriptResponse = await axios.post('https://api.assemblyai.com/v2/transcript', {
      audio_url: upload_url
    }, {
      headers: { 'authorization': ASSEMBLYAI_API_KEY }
    });

    const transcriptId = transcriptResponse.data.id;
    const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

    // STEP 3: Poll the transcription status until it is completed
    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, {
        headers: { 'authorization': ASSEMBLYAI_API_KEY }
      });
      const transcriptionResult = pollingResponse.data;

      if (transcriptionResult.status === 'completed') {
        return res.json({
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence
        });
      } else if (transcriptionResult.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        // Wait for 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

  } catch (error) {
    console.error('Transcription error:', error.response ? error.response.data : error.message);
    // Clean up file in case of an error during the process
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    res.status(500).json({ error: 'Transcription failed' });
  }
});

// ------------------- END OF MODIFIED FUNCTION -------------------


// Sentence analysis endpoint using Python scorer
app.post('/api/analyze', async (req, res) => {
  try {
    const { target, spoken } = req.body;
    
    if (!target || !spoken) {
      return res.status(400).json({ error: 'Both target and spoken text are required' });
    }

    // Run Python scorer
    const pythonProcess = spawn('python3', ['scorer.py', '--json'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const inputData = JSON.stringify({ target, spoken });
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python process error:', errorOutput);
        return res.status(500).json({ error: 'Analysis failed' });
      }

      try {
        const result = JSON.parse(output);
        res.json(result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(500).json({ error: 'Failed to parse analysis results' });
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});