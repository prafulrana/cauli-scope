# 🥦 CauliScope - The Cauliflower Debugger

<div align="center">
  
![CauliScope](https://img.shields.io/badge/CauliScope-v1.0.0-purple?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWiIgZmlsbD0iIzRBNUI2OCIvPgo8L3N2Zz4=)
![Node.js](https://img.shields.io/badge/Node.js-16+-green?style=for-the-badge&logo=node.js)
![WebSocket](https://img.shields.io/badge/WebSocket-Enabled-blue?style=for-the-badge)

**Real-time debug image viewer and test runner for Cauliflower computer vision pipeline**

</div>

## ✨ Features

- 🖼️ **Real-time Image Viewing** - Watch detection images as they're created during test execution
- 🧪 **Integrated Test Runner** - Run cauliflower-tests directly from the web interface
- 🔄 **Live Updates** - WebSocket-powered instant updates when new images are detected
- 🗑️ **Directory Management** - Clear test images with one click
- 🎨 **Pixelated Retro UI** - Beautiful 8-bit inspired interface
- 📊 **Smart Filtering** - Filter images by type (SHOT, L1, L2, BALL)
- 📱 **Responsive Design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PM2 (for process management)
- cauliflower-tests installed locally

### Installation

```bash
# Clone the repository
git clone https://github.com/prafulrana/cauli-scope.git
cd cauli-scope

# Install dependencies
npm install

# Start with PM2
pm2 start server.js --name cauli-scope

# Or run directly
node server.js
```

### Access the Interface

Open your browser and navigate to:
```
http://localhost:8002
```

## 🎮 Usage

### Images Tab
- View all debug images from `~/debug_images`
- Real-time updates as new images are created
- Click "Clear All Images" to remove all test images
- Click "Refresh" to manually reload the image grid

### Testing Tab
1. Select a test video from the dropdown
2. Choose the sport type (basketball, bowling, cricket, etc.)
3. Set confidence threshold (0.01 - 1.0)
4. Toggle image saving (disable for faster tests)
5. Click "Run Test" to execute

Test output appears in real-time, and detected images are immediately visible in the grid.

## 🏗️ Architecture

```
cauli-scope/
├── server.js           # Express + WebSocket server
├── public/
│   ├── index.html     # Main UI
│   ├── style.css      # Pixelated styling
│   ├── script.js      # Image viewing logic
│   └── testing.js     # Test runner logic
└── README.md
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/images` | GET | Get paginated list of images |
| `/api/images/clear` | DELETE | Clear all images from debug directory |
| `/api/test/run` | POST | Execute a test with specified parameters |
| `/api/test/videos` | GET | List available test videos |
| `/api/test/results` | GET | Get test result summaries |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_image` | Server→Client | New image detected |
| `image_deleted` | Server→Client | Image was deleted |
| `directory_cleared` | Server→Client | Directory was cleared |
| `test_progress` | Server→Client | Test execution progress |
| `test_complete` | Server→Client | Test finished |

## 🔧 Configuration

### Environment Variables
```bash
PORT=8002                    # Server port
HOME=/home/user            # Home directory for debug_images
```

### PM2 Configuration
```bash
# Start service
pm2 start server.js --name cauli-scope

# View logs
pm2 logs cauli-scope

# Restart service
pm2 restart cauli-scope

# Stop service
pm2 stop cauli-scope
```

## 🎨 UI Features

### Pixelated Design
- Retro 8-bit font for branding
- Glowing text animation
- Gradient header with shadow effects
- Smooth hover animations on image cards

### Real-time Updates
- Images appear instantly as they're created
- Green border highlights new images
- Slide-in animation for new content
- Auto-update image count

### Responsive Grid
- Adaptive column layout
- Lazy loading for performance
- Hover effects on image cards

## 🛠️ Development

### Running in Development Mode
```bash
# Install dependencies
npm install

# Run with auto-restart on changes
npm run dev
```

### Adding New Features
1. WebSocket events are handled in `server.js`
2. Frontend logic is split between `script.js` (images) and `testing.js` (tests)
3. Styling uses CSS Grid for responsive layouts

## 📦 Dependencies

- **express** - Web server framework
- **ws** - WebSocket implementation
- **chokidar** - File system watcher
- **body-parser** - Request body parsing

## 🤝 Integration

CauliScope integrates with:
- **cauliflower-core** - Core detection logic
- **cauliflower-tests** - Test execution framework
- **cauliflower-world** - YOLO backend server

## 📝 License

MIT

## 🙏 Credits

Built with 💜 for the Cauliflower computer vision pipeline

---

<div align="center">
  <b>CauliScope</b> - See what your AI sees! 🥦👁️
</div>