# VANI - AI-Powered Speech Practice for Hearing-Impaired Children

VANI is a comprehensive speech learning platform designed specifically for hearing-impaired children to practice and improve their speech through visual feedback, gamification, and AI-powered analysis.

## 🎯 Project Overview

VANI addresses the critical need for speech development tools for children with hearing impairments. The platform provides:

- **Visual Learning**: Tongue and lip position guides for each phoneme
- **Gamified Experience**: Points, achievements, and progress tracking
- **AI-Powered Feedback**: Real-time pronunciation analysis and suggestions
- **Structured Learning Path**: From individual phonemes to complete sentences
- **Accessibility Features**: Minimal text, maximum visual elements

## 🚀 Features

### Core Learning Modules

1. **Phoneme Learning**
   - Visual guides with mouth animations
   - Step-by-step pronunciation instructions
   - Practice words for each phoneme
   - Real-time recording and feedback

2. **Word Practice**
   - Phoneme breakdown visualization
   - Progressive word building
   - Pronunciation accuracy scoring
   - Completion tracking

3. **Sentence Analysis**
   - Full sentence recording
   - Whisper API integration for transcription
   - Detailed pronunciation metrics
   - Improvement suggestions

4. **Progress Tracking**
   - Comprehensive statistics dashboard
   - Achievement system
   - Weekly activity charts
   - Learning path visualization

### Key Features

- **Visual-First Design**: Minimal text, maximum visual elements
- **Gamification**: Points, streaks, achievements, and rewards
- **Two Learning Modes**: Guided learning and AI-powered practice
- **Real-time Feedback**: Immediate pronunciation analysis
- **Progress Persistence**: User data saved locally
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React.js with JavaScript
- **Styling**: CSS3 with modern features (gradients, animations, glassmorphism)
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Charts**: Chart.js for data visualization

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Navbar.js       # Navigation component
├── context/            # State management
│   └── AppContext.js   # Global app state
├── data/               # Static data and configurations
│   └── phonemes.js     # Phoneme and word data
├── pages/              # Main application pages
│   ├── Home.js         # Dashboard/home page
│   ├── Login.js        # Authentication
│   ├── Signup.js       # User registration
│   ├── PhonemeLearning.js  # Individual phoneme practice
│   ├── WordPractice.js     # Word building practice
│   ├── SentenceAnalysis.js # Sentence recording & analysis
│   └── Progress.js     # Progress tracking dashboard
├── App.js              # Main application component
├── App.css             # Application-specific styles
├── index.js            # Application entry point
└── index.css           # Global styles
```

## 🎮 Core Vocabulary

The platform focuses on essential survival words for hearing-impaired children:

- **help** - To ask for assistance
- **yes** - Agreement or confirmation
- **no** - Disagreement or refusal
- **stop** - To halt or cease
- **more** - Additional quantity
- **done** - Completed or finished
- **hot** - High temperature
- **please** - Polite request

Each word is broken down into individual phonemes with detailed pronunciation guides.

## 🎨 Design Philosophy

### Visual-First Approach
- Minimal text usage
- Emoji and icon-based communication
- Visual progress indicators
- Animated feedback systems

### Accessibility
- High contrast colors
- Large, clear buttons
- Visual cues for all interactions
- Simplified navigation

### Gamification
- Point-based reward system
- Achievement badges
- Daily challenges
- Progress streaks

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vani
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🎯 Usage

### For Children
1. **Sign Up/Login**: Create an account or use demo credentials
2. **Choose Learning Mode**: Guided learning or practice mode
3. **Start with Phonemes**: Learn individual sounds with visual guides
4. **Build Words**: Combine phonemes into complete words
5. **Practice Sentences**: Record and analyze full sentences
6. **Track Progress**: View achievements and improvement over time

### For Parents/Therapists
1. **Monitor Progress**: View detailed analytics and progress reports
2. **Customize Learning**: Adjust difficulty and focus areas
3. **Review Performance**: Analyze pronunciation accuracy and improvement
4. **Set Goals**: Establish learning targets and milestones

## 🔮 Future Enhancements

### Planned Features
- **Indian Sign Language Integration**: Visual sign language support
- **Advanced AI Models**: TensorFlow Lite/ONNX for offline processing
- **Multi-language Support**: Regional language support
- **Parent Dashboard**: Comprehensive monitoring tools
- **Therapist Tools**: Professional assessment and planning features
- **Offline Mode**: Full functionality without internet connection

### Technical Improvements
- **Real Speech Recognition**: Integration with Web Speech API
- **Advanced Analytics**: Machine learning-based progress prediction
- **Voice Synthesis**: Text-to-speech for better learning
- **Mobile App**: Native mobile application development

## 🤝 Contributing

We welcome contributions to improve VANI! Please see our contributing guidelines for details on:

- Code style and standards
- Pull request process
- Issue reporting
- Feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Deaf Aid Society**: NGO partner providing domain expertise
- **Speech Therapists**: Professional guidance on learning methodologies
- **Hearing-Impaired Community**: Feedback and requirements gathering
- **Open Source Community**: Tools and libraries that made this possible

## 📞 Support

For support, questions, or feedback:
- Create an issue in the repository
- Contact the development team
- Reach out to our NGO partner

---

**VANI** - Empowering speech development through technology and compassion. 🎯🗣️
# vani
