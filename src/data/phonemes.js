// Core vocabulary words for hearing-impaired children
export const CORE_WORDS = [
  {
    id: 'help',
    word: 'help',
    phonemes: ['h', 'e', 'l', 'p'],
    meaning: 'To ask for assistance',
    priority: 1,
    examples: ['help me', 'I need help', 'can you help?']
  },
  {
    id: 'yes',
    word: 'yes',
    phonemes: ['y', 'e', 's'],
    meaning: 'Agreement or confirmation',
    priority: 2,
    examples: ['yes please', 'yes I can', 'yes that\'s right']
  },
  {
    id: 'no',
    word: 'no',
    phonemes: ['n', 'o'],
    meaning: 'Disagreement or refusal',
    priority: 3,
    examples: ['no thank you', 'no I can\'t', 'no problem']
  },
  {
    id: 'stop',
    word: 'stop',
    phonemes: ['s', 't', 'o', 'p'],
    meaning: 'To halt or cease',
    priority: 4,
    examples: ['stop please', 'stop that', 'stop here']
  },
  {
    id: 'more',
    word: 'more',
    phonemes: ['m', 'o', 'r'],
    meaning: 'Additional quantity',
    priority: 5,
    examples: ['more please', 'I want more', 'more food']
  },
  {
    id: 'done',
    word: 'done',
    phonemes: ['d', 'o', 'n'],
    meaning: 'Completed or finished',
    priority: 6,
    examples: ['I\'m done', 'all done', 'done eating']
  },
  {
    id: 'hot',
    word: 'hot',
    phonemes: ['h', 'o', 't'],
    meaning: 'High temperature',
    priority: 7,
    examples: ['it\'s hot', 'hot water', 'too hot']
  },
  {
    id: 'please',
    word: 'please',
    phonemes: ['p', 'l', 'e', 's'],
    meaning: 'Polite request',
    priority: 8,
    examples: ['please help', 'please stop', 'please more']
  }
];

// Phoneme data with visual guides and examples
export const PHONEME_DATA = {
  'h': {
    symbol: '/h/',
    description: 'Voiceless glottal fricative',
    tonguePosition: 'Tongue relaxed, not touching anything',
    lipPosition: 'Lips slightly parted',
    example: 'hat, help, house',
    visualGuide: '👄 Slightly open mouth, breath out gently',
    difficulty: 'easy',
    practiceWords: ['hat', 'help', 'house', 'happy']
  },
  'e': {
    symbol: '/e/',
    description: 'Mid front unrounded vowel',
    tonguePosition: 'Tongue raised in front, not touching roof',
    lipPosition: 'Lips slightly spread',
    example: 'bed, red, pen',
    visualGuide: '😊 Smile slightly, tongue forward',
    difficulty: 'medium',
    practiceWords: ['bed', 'red', 'pen', 'yes']
  },
  'l': {
    symbol: '/l/',
    description: 'Lateral approximant',
    tonguePosition: 'Tongue tip touches alveolar ridge',
    lipPosition: 'Lips neutral',
    example: 'love, like, help',
    visualGuide: '👅 Tongue tip up to roof of mouth',
    difficulty: 'medium',
    practiceWords: ['love', 'like', 'help', 'ball']
  },
  'p': {
    symbol: '/p/',
    description: 'Voiceless bilabial plosive',
    tonguePosition: 'Tongue relaxed',
    lipPosition: 'Lips pressed together, then release',
    example: 'pen, play, stop',
    visualGuide: '👄 Press lips together, pop open',
    difficulty: 'easy',
    practiceWords: ['pen', 'play', 'stop', 'please']
  },
  'y': {
    symbol: '/j/',
    description: 'Palatal approximant',
    tonguePosition: 'Tongue raised toward hard palate',
    lipPosition: 'Lips slightly rounded',
    example: 'yes, you, yellow',
    visualGuide: '😊 Tongue up, lips slightly round',
    difficulty: 'medium',
    practiceWords: ['yes', 'you', 'yellow', 'year']
  },
  's': {
    symbol: '/s/',
    description: 'Voiceless alveolar fricative',
    tonguePosition: 'Tongue tip near alveolar ridge',
    lipPosition: 'Lips slightly spread',
    example: 'sun, see, yes',
    visualGuide: '😬 Teeth together, air hisses out',
    difficulty: 'hard',
    practiceWords: ['sun', 'see', 'yes', 'stop']
  },
  'n': {
    symbol: '/n/',
    description: 'Alveolar nasal',
    tonguePosition: 'Tongue tip touches alveolar ridge',
    lipPosition: 'Lips slightly parted',
    example: 'no, nice, done',
    visualGuide: '👅 Tongue tip up, air through nose',
    difficulty: 'medium',
    practiceWords: ['no', 'nice', 'done', 'sun']
  },
  'o': {
    symbol: '/o/',
    description: 'Mid back rounded vowel',
    tonguePosition: 'Tongue back and low',
    lipPosition: 'Lips rounded',
    example: 'hot, stop, more',
    visualGuide: '😮 Round lips, tongue back',
    difficulty: 'medium',
    practiceWords: ['hot', 'stop', 'more', 'no']
  },
  't': {
    symbol: '/t/',
    description: 'Voiceless alveolar plosive',
    tonguePosition: 'Tongue tip touches alveolar ridge',
    lipPosition: 'Lips neutral',
    example: 'top, hot, stop',
    visualGuide: '👅 Tongue tip up, quick release',
    difficulty: 'easy',
    practiceWords: ['top', 'hot', 'stop', 'cat']
  },
  'm': {
    symbol: '/m/',
    description: 'Bilabial nasal',
    tonguePosition: 'Tongue relaxed',
    lipPosition: 'Lips pressed together',
    example: 'more, mom, time',
    visualGuide: '👄 Lips together, hum through nose',
    difficulty: 'easy',
    practiceWords: ['more', 'mom', 'time', 'come']
  },
  'r': {
    symbol: '/r/',
    description: 'Alveolar approximant',
    tonguePosition: 'Tongue tip curled back slightly',
    lipPosition: 'Lips slightly rounded',
    example: 'red, more, run',
    visualGuide: '😊 Tongue curled, lips round',
    difficulty: 'hard',
    practiceWords: ['red', 'more', 'run', 'car']
  },
  'd': {
    symbol: '/d/',
    description: 'Voiced alveolar plosive',
    tonguePosition: 'Tongue tip touches alveolar ridge',
    lipPosition: 'Lips neutral',
    example: 'done, day, red',
    visualGuide: '👅 Tongue tip up, voice added',
    difficulty: 'medium',
    practiceWords: ['done', 'day', 'red', 'bed']
  }
};

// Difficulty levels for gamification
export const DIFFICULTY_LEVELS = {
  easy: {
    color: '#4CAF50',
    points: 10,
    timeLimit: 5
  },
  medium: {
    color: '#FF9800',
    points: 20,
    timeLimit: 7
  },
  hard: {
    color: '#F44336',
    points: 30,
    timeLimit: 10
  }
};

// Progress tracking structure
export const PROGRESS_TRACKING = {
  phonemesLearned: [],
  wordsCompleted: [],
  currentLevel: 1,
  totalPoints: 0,
  streak: 0,
  lastPracticeDate: null,
  achievements: []
};
