# 🏓 Pickleball Tournament Scoring System

A professional, tournament-ready pickleball scoring system with offline support and cross-platform compatibility.

## ✨ Features

### 🔐 **Secure Authentication**
- Two-step authentication (REF ID + 6-digit verification)
- JWT token management with session handling
- Demo mode support for testing

### 🎯 **Complete Scoring System**
- **Singles & Doubles** support with proper sideout rules
- **Visual touch scoring** on left/right court areas
- **Server rotation** following official pickleball rules
- **Cross-court serving** validation and positioning
- **Manual score adjustment** with comprehensive controls

### 📱 **Cross-Platform Design**
- **Tablet-optimized** for tournament use (iPad, Samsung, Windows)
- **Touch-friendly** interface with 44px minimum targets
- **Responsive design** for landscape orientation
- **High contrast** colors for tournament visibility

### 🌐 **Network Reliability**
- **Offline mode** with zero data loss guarantee
- **Real-time connection detection** (<100ms response)
- **Automatic sync** when connection restored
- **Queue management** for offline actions

### 🎨 **Professional UI**
- **Visual touch feedback** with dramatic animations
- **Server highlighting** with paddle icons (🏓)
- **Score submission** with SUCCESS/FAIL indicators
- **24vh score display** readable from 10+ feet

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Modern web browser (Chrome 90+, Safari 14+, Edge 90+)

### Installation
```bash
git clone https://github.com/kuettai/pickle-frontend.git
cd pickle-frontend
npm install
```

### Development
```bash
# Run tests
npm test

# Start development server
# Open sources/index.html in browser
```

### Demo Usage
1. **Authentication**: Use `REF2024` or `ADMIN123`
2. **Verification**: Enter `123456` for demo codes
3. **Match Loading**: Try `MATCH-001` (singles) or `MATCH-002` (doubles)
4. **Start Playing**: Touch left/right court areas to score

## 🧪 Testing

Comprehensive test suite with **264 tests** covering:
- Authentication flow (26 tests)
- Scoring logic and sideout rules
- Game configuration and player positioning
- Visual touch feedback system (15 tests)
- Offline mode support (23 tests)
- Score submission system (15 tests)

```bash
npm test                    # Run all tests
npm test offline-mode      # Run specific test suite
```

## 📁 Project Structure

```
/sources/           # Core application
├── index.html     # Entry point
├── app.js         # Main application logic (1700+ lines)
├── offline-manager.js     # Network reliability
├── score-submission.js    # Tournament integration
├── touch-feedback.js      # Visual feedback system
└── *.css          # Styling and animations

/tests/            # Test suite (264 tests)
├── offline-mode.test.js   # Network reliability tests
├── two-step-auth.test.js  # Authentication tests
├── score-submission.test.js # Submission tests
└── *.test.js      # Comprehensive test coverage

/docs/             # Documentation
├── user-stories.md        # Feature requirements
├── development-checklist.md # Progress tracking
└── *.md           # System documentation
```

## 🎮 Game Rules Implemented

### Scoring System
- **11+ points** with **2-point lead** to win
- **Sideout scoring**: Only serving team can score points
- **Server rotation**: 1→2→opponent (doubles), direct switch (singles)
- **First game**: Server #2 starts (doubles only)

### Court Positioning
- **Even scores**: Server on right-hand side
- **Odd scores**: Server on left-hand side  
- **Cross-court serving**: Diagonal server/receiver positioning
- **Dynamic positioning**: Players switch sides after scoring

## 🏆 Tournament Features

### Professional Interface
- **Tournament-grade reliability** with 264 passing tests
- **Referee-friendly** controls and visual feedback
- **Error handling** with detailed error codes and recovery
- **Audit trail** for all scoring actions

### Network Resilience
- **Zero data loss** during network outages
- **Offline queue management** with automatic sync
- **Connection status monitoring** with visual indicators
- **Graceful degradation** of network-dependent features

## 🔧 Technical Details

### Architecture
- **Vanilla JavaScript** for maximum compatibility
- **Modular design** with separate concerns
- **Event-driven** architecture for responsive UI
- **State management** with immutable updates

### Performance
- **<100ms touch response** time
- **Efficient DOM updates** with minimal reflows
- **Memory optimization** for extended tournament use
- **Battery-friendly** animations and interactions

### Compatibility
- **iOS Safari 14+** (iPad)
- **Chrome 90+** (Samsung tablets)
- **Edge 90+** (Windows tablets)
- **Responsive design** for various screen sizes

## 📊 System Status

- **Version**: 1.3 Offline Mode Support Complete
- **Test Coverage**: 264 tests passing, 0 failures
- **Production Status**: ✅ Tournament Ready
- **Network Reliability**: ✅ Zero Data Loss Guarantee

## 🤝 Contributing

This is a production-ready tournament scoring system. For feature requests or bug reports, please open an issue.

## 📄 License

MIT License - See LICENSE file for details

---

**Built for tournament referees who demand reliability, speed, and professional-grade scoring accuracy.**