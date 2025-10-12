// Core vocabulary words for hearing-impaired children
export const CORE_WORDS = [
  {
    id: "help",
    word: "help",
    phonemes: ["hh", "eh", "l", "p"],
    meaning: "To ask for assistance",
    priority: 1,
    examples: ["help me", "I need help", "can you help?"],
  },
  {
    id: "yes",
    word: "yes",
    phonemes: ["y", "eh", "s"],
    meaning: "Agreement or confirmation",
    priority: 2,
    examples: ["yes please", "yes I can", "yes that's right"],
  },
  {
    id: "no",
    word: "no",
    phonemes: ["n", "ow"],
    meaning: "Disagreement or refusal",
    priority: 3,
    examples: ["no thank you", "no I can't", "no problem"],
  },
  {
    id: "stop",
    word: "stop",
    phonemes: ["s", "t", "aa", "p"],
    meaning: "To halt or cease",
    priority: 4,
    examples: ["stop please", "stop that", "stop here"],
  },
  {
    id: "more",
    word: "more",
    phonemes: ["m", "ao", "r"],
    meaning: "Additional quantity",
    priority: 5,
    examples: ["more please", "I want more", "more food"],
  },
  {
    id: "done",
    word: "done",
    phonemes: ["d", "ah", "n"],
    meaning: "Completed or finished",
    priority: 6,
    examples: ["I'm done", "all done", "done eating"],
  },
  {
    id: "hot",
    word: "hot",
    phonemes: ["hh", "aa", "t"],
    meaning: "High temperature",
    priority: 7,
    examples: ["it's hot", "hot water", "too hot"],
  },
  {
    id: "please",
    word: "please",
    phonemes: ["p", "l", "iy", "z"],
    meaning: "Polite request",
    priority: 8,
    examples: ["please help", "please stop", "please more"],
  },
  {
    id: 'want',
    word: 'want',
    phonemes: ['w', 'aa', 'n', 't'],
    meaning: 'To have a desire for something',
    priority: 9,
    examples: ['I want that', 'I want more', 'do you want?']
  }
];

// Phoneme data with visual guides and examples
export const PHONEME_DATA = {
  h: {
    symbol: "/h/",
    description: "Voiceless glottal fricative",
    tonguePosition: "Tongue relaxed, not touching anything",
    lipPosition: "Lips slightly parted",
    example: "hat, help, house",
    visualGuide: "👄 Slightly open mouth, breath out gently",
    difficulty: "easy",
    practiceWords: ["hat", "help", "house", "happy"],
    tongueImage: "https://i.postimg.cc/Tw9Z6npG/h-sound.png",
    lipImage: "https://i.postimg.cc/pV8rQ4Nn/Gemini-Generated-Image-b362aub362aub362-1.png"
  },
  e: {
    symbol: "/e/",
    description: "Mid front unrounded vowel",
    tonguePosition: "Tongue raised in front, not touching roof",
    lipPosition: "Lips slightly spread",
    example: "bed, red, pen",
    visualGuide: "😊 Smile slightly, tongue forward",
    difficulty: "medium",
    practiceWords: ["bed", "red", "pen", "yes"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  l: {
    symbol: "/l/",
    description: "Lateral approximant",
    tonguePosition: "Tongue tip touches alveolar ridge",
    lipPosition: "Lips neutral",
    example: "love, like, help",
    visualGuide: "👅 Tongue tip up to roof of mouth",
    difficulty: "medium",
    practiceWords: ["love", "like", "help", "ball"],
    tongueImage: "https://i.postimg.cc/v8PZ7V3s/l-sound.png",
    lipImage: "https://i.postimg.cc/HL8GbGJz/Gemini-Generated-Image-q6scnkq6scnkq6sc-1-1.png"
  },
  p: {
    symbol: "/p/",
    description: "Voiceless bilabial plosive",
    tonguePosition: "Tongue relaxed",
    lipPosition: "Lips pressed together, then release",
    example: "pen, play, stop",
    visualGuide: "👄 Press lips together, pop open",
    difficulty: "easy",
    practiceWords: ["pen", "play", "stop", "please"],
    tongueImage: "https://i.postimg.cc/zGkzBHL4/plosive-mouth-positions-p-1.png",
    lipImage: "https://i.postimg.cc/rw85PW5C/Gemini-Generated-Image-y1h0i4y1h0i4y1h0-1.png"
  },
  y: {
    symbol: "/j/",
    description: "Palatal approximant",
    tonguePosition: "Tongue raised toward hard palate",
    lipPosition: "Lips slightly rounded",
    example: "yes, you, yellow",
    visualGuide: "😊 Tongue up, lips slightly round",
    difficulty: "medium",
    practiceWords: ["yes", "you", "yellow", "year"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  s: {
    symbol: "/s/",
    description: "Voiceless alveolar fricative",
    tonguePosition: "Tongue tip near alveolar ridge",
    lipPosition: "Lips slightly spread",
    example: "sun, see, yes",
    visualGuide: "😬 Teeth together, air hisses out",
    difficulty: "hard",
    practiceWords: ["sun", "see", "yes", "stop"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  n: {
    symbol: "/n/",
    description: "Alveolar nasal",
    tonguePosition: "Tongue tip touches alveolar ridge",
    lipPosition: "Lips slightly parted",
    example: "no, nice, done",
    visualGuide: "👅 Tongue tip up, air through nose",
    difficulty: "medium",
    practiceWords: ["no", "nice", "done", "sun"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  o: {
    symbol: "/o/",
    description: "Mid back rounded vowel",
    tonguePosition: "Tongue back and low",
    lipPosition: "Lips rounded",
    example: "hot, stop, more",
    visualGuide: "😮 Round lips, tongue back",
    difficulty: "medium",
    practiceWords: ["hot", "stop", "more", "no"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  t: {
    symbol: "/t/",
    description: "Voiceless alveolar plosive",
    tonguePosition: "Tongue tip touches alveolar ridge",
    lipPosition: "Lips neutral",
    example: "top, hot, stop",
    visualGuide: "👅 Tongue tip up, quick release",
    difficulty: "easy",
    practiceWords: ["top", "hot", "stop", "cat"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  m: {
    symbol: "/m/",
    description: "Bilabial nasal",
    tonguePosition: "Tongue relaxed",
    lipPosition: "Lips pressed together",
    example: "more, mom, time",
    visualGuide: "👄 Lips together, hum through nose",
    difficulty: "easy",
    practiceWords: ["more", "mom", "time", "come"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  r: {
    symbol: "/r/",
    description: "Alveolar approximant",
    tonguePosition: "Tongue tip curled back slightly",
    lipPosition: "Lips slightly rounded",
    example: "red, more, run",
    visualGuide: "😊 Tongue curled, lips round",
    difficulty: "hard",
    practiceWords: ["red", "more", "run", "car"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  d: {
    symbol: "/d/",
    description: "Voiced alveolar plosive",
    tonguePosition: "Tongue tip touches alveolar ridge",
    lipPosition: "Lips neutral",
    example: "done, day, red",
    visualGuide: "👅 Tongue tip up, voice added",
    difficulty: "medium",
    practiceWords: ["done", "day", "red", "bed"],
    tongueImage: "https://via.placeholder.com/200x150.png?text=Tongue+Position",
    lipImage: "https://via.placeholder.com/200x150.png?text=Lip+Position"
  },
  'eh': {
    symbol: '/eh/',
    description: 'Mid front unrounded vowel',
    tonguePosition: 'Tongue raised in front, not touching roof',
    lipPosition: 'Lips slightly spread',
    example: 'bed, red, pen',
    visualGuide: '😊 Smile slightly, tongue forward',
    difficulty: 'medium',
    practiceWords: ['bed', 'red', 'pen', 'yes'],
    tongueImage: "https://i.postimg.cc/yNWPd9QB/Diagram-illustrating-the-tongue-positions-for-the-front-cardinal-vowels-Wikimedia-1.png",
    lipImage: "https://i.postimg.cc/Hxb2CzKY/Gemini-Generated-Image-63bpo163bpo163bp-1.png"
  },
};

// Difficulty levels for gamification
export const DIFFICULTY_LEVELS = {
  easy: {
    color: "#4CAF50",
    points: 10,
    timeLimit: 5,
  },
  medium: {
    color: "#FF9800",
    points: 20,
    timeLimit: 7,
  },
  hard: {
    color: "#F44336",
    points: 30,
    timeLimit: 10,
  },
};

// Progress tracking structure
export const PROGRESS_TRACKING = {
  phonemesLearned: [],
  wordsCompleted: [],
  currentLevel: 1,
  totalPoints: 0,
  streak: 0,
  lastPracticeDate: null,
  achievements: [],
};
