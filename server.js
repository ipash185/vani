const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios"); // Added axios for API calls
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// API Keys - IMPORTANT: Use environment variables in production
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Global phoneme classifier instance
let phonemeClassifier = null;
let isModelLoaded = false;

// Debug: Check if API keys are loaded
console.log("Environment check:");
console.log(
  "- ASSEMBLYAI_API_KEY loaded:",
  ASSEMBLYAI_API_KEY ? "Yes (length: " + ASSEMBLYAI_API_KEY.length + ")" : "No"
);
console.log(
  "- OPENROUTER_API_KEY loaded:",
  OPENROUTER_API_KEY ? "Yes (length: " + OPENROUTER_API_KEY.length + ")" : "No"
);
console.log("- NODE_ENV:", process.env.NODE_ENV || "development");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Initialize phoneme classifier
function initializePhonemeClassifier() {
  return new Promise((resolve, reject) => {
    console.log("Initializing phoneme classifier...");

    const pythonProcess = spawn(
      "python3",
      ["phoneme_classifier_service.py", "dummy"],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      // Check if model loaded successfully (even if there are warnings)
      if (
        code === 0 ||
        errorOutput.includes("Model loaded successfully") ||
        errorOutput.includes(
          "Loading the VAD-trained phoneme recognition model"
        )
      ) {
        console.log("✓ Phoneme classifier initialized successfully");
        isModelLoaded = true;
        resolve();
      } else {
        console.error(
          "✗ Failed to initialize phoneme classifier:",
          errorOutput
        );
        reject(new Error("Failed to initialize phoneme classifier"));
      }
    });
  });
}

// Initialize phoneme classifier
function initializePhonemeClassifier() {
  return new Promise((resolve, reject) => {
    console.log("Initializing phoneme classifier...");

    const pythonProcess = spawn(
      "python3",
      ["phoneme_classifier_service.py", "dummy"],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      // Check if model loaded successfully (even if there are warnings)
      if (
        code === 0 ||
        errorOutput.includes("Model loaded successfully") ||
        errorOutput.includes(
          "Loading the VAD-trained phoneme recognition model"
        )
      ) {
        console.log("✓ Phoneme classifier initialized successfully");
        isModelLoaded = true;
        resolve();
      } else {
        console.error(
          "✗ Failed to initialize phoneme classifier:",
          errorOutput
        );
        reject(new Error("Failed to initialize phoneme classifier"));
      }
    });
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    assemblyAIKeyLoaded: !!ASSEMBLYAI_API_KEY,
    openRouterKeyLoaded: !!OPENROUTER_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// In server.js

// Generate practice sentences using OpenRouter API
app.post("/api/generate-sentences", async (req, res) => {
  try {
    const { progress } = req.body;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error:
          "OpenRouter API key is not set. Please check your .env file and restart the server.",
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

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        // --- CHANGE THIS LINE ---
        model: "mistralai/mistral-7b-instruct:free", // Switched to a more reliable free model
        // --- END CHANGE ---
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", // Or your actual site URL
          "X-Title": "Vani Speech Practice", // Or your actual site name
        },
      }
    );

    const generatedText = response.data.choices[0].message.content.trim();

    let sentences;
    try {
      sentences = JSON.parse(generatedText);
    } catch (parseError) {
      const sentenceMatches = generatedText.match(/"([^"]+)"/g);
      if (sentenceMatches) {
        sentences = sentenceMatches.map((match) => match.replace(/"/g, ""));
      } else {
        throw new Error("Could not parse generated sentences");
      }
    }

    if (!Array.isArray(sentences) || sentences.length !== 5) {
      throw new Error(
        "Generated sentences must be an array of exactly 5 strings"
      );
    }

    res.json({
      sentences: sentences,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Sentence generation error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to generate practice sentences",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// Generate practice words using OpenRouter API
app.post("/api/generate-words", async (req, res) => {
  try {
    const { progress } = req.body;

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        error:
          "OpenRouter API key is not set. Please check your .env file and restart the server.",
      });
    }

    const prompt = `You are a speech therapist helping a hearing-impaired child learn to speak. 
    
Current progress: ${JSON.stringify(progress, null, 2)}

Generate exactly 9 new practice words that are:
1. Essential words for daily communication
2. Appropriate for their current skill level
3. Focused on practical communication needs
4. Simple but meaningful words
5. Progressive in difficulty
6. Include Arpabet phonemes for each word

Return ONLY a JSON array of 9 word objects, each with id, word, phonemes, meaning, priority, and examples. Example format:
[
  {"id": "water", "word": "water", "phonemes": ["w", "aa", "t", "er"], "meaning": "Clear liquid for drinking", "priority": 1, "examples": ["I want water", "water please", "cold water"]},
  {"id": "food", "word": "food", "phonemes": ["f", "uw", "d"], "meaning": "Something to eat", "priority": 2, "examples": ["I want food", "food please", "good food"]}
]`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Vani Speech Practice",
        },
      }
    );
    // console.log(response.data.choices[0].message.content.trim());
    let generatedText = response.data.choices[0].message.content.trim();

    // 1️⃣ Remove markdown and instruction wrappers
    generatedText = generatedText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\[B_INST\]|\[\/B_INST\]/g, "")
      .replace(/<s>/g, "")
      .replace(/<\/s>/g, "")
      .trim();
    // console.log(generatedText);
    // 2️⃣ Extract all JSON-like arrays (sometimes multiple <s> blocks)
    const allMatches = generatedText.match(/\[\s*\{[\s\S]*?\}\s*\]/g);

    if (!allMatches || allMatches.length === 0) {
      console.error("Could not find JSON array in response:", generatedText);
      throw new Error("No valid JSON array found in AI response");
    }

    // 3️⃣ Try parsing the *largest* valid JSON array
    let words = null;
    for (const candidate of allMatches.reverse()) {
      try {
        const parsed = JSON.parse(candidate);
        if (Array.isArray(parsed) && parsed.length > 0) {
          words = parsed;
          break;
        }
      } catch (_) {
        /* try next */
      }
    }
    if (!words) {
      console.error("Failed to parse any valid JSON array:", generatedText);
      throw new Error("Could not parse generated words");
    }

    // 4️⃣ Optionally ensure exactly 8 entries
    if (words.length !== 9) {
      console.warn(
        `Expected 9 words, got ${words.length}. Trimming or regenerating.`
      );
      words = words.slice(0, 9);
    }

    res.json({
      words: words,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Word generation error:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to generate practice words",
      details: error.response ? error.response.data : error.message,
    });
  }
});

// AssemblyAI transcription endpoint
app.post("/api/transcribe", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }
  if (!ASSEMBLYAI_API_KEY) {
    console.error("AssemblyAI API key is not set. Check your .env file.");
    return res.status(500).json({
      error:
        "AssemblyAI API key is not set. Please check your .env file and restart the server.",
      debug: {
        envFileExists: fs.existsSync(".env"),
        nodeEnv: process.env.NODE_ENV,
      },
    });
  }

  const audioFilePath = req.file.path;

  try {
    // STEP 1: Upload the audio file to AssemblyAI
    const fileData = fs.readFileSync(audioFilePath);
    const uploadResponse = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      fileData,
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          "Content-Type": "application/octet-stream",
        },
      }
    );

    const upload_url = uploadResponse.data.upload_url;

    // Clean up the uploaded file from local server storage
    fs.unlinkSync(audioFilePath);

    // STEP 2: Submit the uploaded audio file for transcription
    const transcriptResponse = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      {
        audio_url: upload_url,
      },
      {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      }
    );

    const transcriptId = transcriptResponse.data.id;
    const pollingEndpoint = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

    // STEP 3: Poll the transcription status until it is completed
    while (true) {
      const pollingResponse = await axios.get(pollingEndpoint, {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      });
      const transcriptionResult = pollingResponse.data;

      if (transcriptionResult.status === "completed") {
        return res.json({
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
        });
      } else if (transcriptionResult.status === "error") {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        // Wait for 3 seconds before polling again
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error(
      "Transcription error:",
      error.response ? error.response.data : error.message
    );
    // Clean up file in case of an error during the process
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    res.status(500).json({ error: "Transcription failed" });
  }
});

// ------------------- END OF MODIFIED FUNCTION -------------------

// Sentence analysis endpoint using Python scorer
app.post("/api/analyze", async (req, res) => {
  try {
    const { target, spoken } = req.body;

    if (!target || !spoken) {
      return res
        .status(400)
        .json({ error: "Both target and spoken text are required" });
    }

    // Run Python scorer
    const pythonProcess = spawn("python3", ["scorer.py", "--json"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const inputData = JSON.stringify({ target, spoken });
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python process error:", errorOutput);
        return res.status(500).json({ error: "Analysis failed" });
      }

      try {
        const result = JSON.parse(output);
        res.json(result);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        res.status(500).json({ error: "Failed to parse analysis results" });
      }
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

// Word analysis endpoint using Python scorer
app.post("/api/analyze-word", async (req, res) => {
  try {
    const { target, spoken } = req.body;

    if (!target || !spoken) {
      return res
        .status(400)
        .json({ error: "Both target and spoken text are required" });
    }

    // Run Python scorer for word analysis
    const pythonProcess = spawn("python3", ["scorer.py", "--json"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const inputData = JSON.stringify({ target, spoken });
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python process error:", errorOutput);
        return res.status(500).json({ error: "Word analysis failed" });
      }

      try {
        const result = JSON.parse(output);
        res.json(result);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        res
          .status(500)
          .json({ error: "Failed to parse word analysis results" });
      }
    });
  } catch (error) {
    console.error("Word analysis error:", error);
    res.status(500).json({ error: "Word analysis failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Phoneme classification endpoint
app.post("/api/classify-phoneme", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided" });
  }

  const audioFilePath = req.file.path;

  try {
    // Run Python phoneme classifier
    const pythonProcess = spawn(
      "python3",
      ["phoneme_classifier_service.py", audioFilePath],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      // Clean up the uploaded file
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }

      if (code !== 0) {
        console.error("Python phoneme classifier error:", errorOutput);
        return res.status(500).json({
          error: "Phoneme classification failed",
          details: errorOutput,
        });
      }

      try {
        // Filter out non-JSON output (like print statements)
        const jsonOutput = output.split("\n").find((line) => {
          try {
            JSON.parse(line);
            return true;
          } catch {
            return false;
          }
        });

        if (jsonOutput) {
          const result = JSON.parse(jsonOutput);
          res.json(result);
        } else {
          throw new Error("No valid JSON found in output");
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error("Raw output:", output);
        res
          .status(500)
          .json({ error: "Failed to parse phoneme classification results" });
      }
    });
  } catch (error) {
    console.error("Phoneme classification error:", error);
    // Clean up file in case of an error during the process
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    res.status(500).json({ error: "Phoneme classification failed" });
  }
});

// Start server with phoneme classifier initialization
async function startServer() {
  try {
    // Initialize phoneme classifier
    await initializePhonemeClassifier();

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log("✓ All services initialized successfully");
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
