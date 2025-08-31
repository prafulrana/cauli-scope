
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 8002;
const imagesDir = path.join(process.env.HOME, 'debug_images');

// Ensure the images directory exists
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Serve the actual image files
app.use('/images', express.static(imagesDir));

// Add JSON body parser
app.use(express.json());

// API endpoint to run tests
app.post('/api/test/run', (req, res) => {
    const { video, sport, confidence, saveImages } = req.body;
    
    if (!video || !sport) {
        return res.status(400).json({ error: 'Video and sport are required' });
    }
    
    const testPath = path.join(__dirname, 'cauliflower-tests', 'video-test-client.js');
    const videoPath = path.join(__dirname, 'cauliflower-tests', 'test_videos', video);
    
    // Check if video exists
    if (!fs.existsSync(videoPath)) {
        return res.status(404).json({ error: `Video not found: ${video}` });
    }
    
    // Run the test
    const args = [testPath, videoPath, sport];
    if (confidence) {
        args.push(`--confidence=${confidence}`);
    }
    if (saveImages === false) {
        args.push('--saveOutput=false');
    }
    
    const testProcess = spawn('node', args);
    
    let output = '';
    let error = '';
    
    testProcess.stdout.on('data', (data) => {
        output += data.toString();
        // Broadcast progress to WebSocket clients
        broadcast({ type: 'test_progress', data: data.toString() });
    });
    
    testProcess.stderr.on('data', (data) => {
        error += data.toString();
    });
    
    testProcess.on('close', (code) => {
        if (code === 0) {
            broadcast({ type: 'test_complete', success: true });
            res.json({ success: true, output });
        } else {
            broadcast({ type: 'test_complete', success: false, error });
            res.status(500).json({ error: error || 'Test failed' });
        }
    });
});

// API endpoint to get available test videos
app.get('/api/test/videos', (req, res) => {
    const videosDir = path.join(__dirname, 'cauliflower-tests', 'test_videos');
    
    if (!fs.existsSync(videosDir)) {
        return res.json({ videos: [] });
    }
    
    fs.readdir(videosDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Could not read videos directory' });
        }
        
        const videos = files.filter(f => 
            f.endsWith('.mov') || f.endsWith('.mp4') || f.endsWith('.avi')
        );
        
        res.json({ videos });
    });
});

// API endpoint to get test results
app.get('/api/test/results', (req, res) => {
    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Could not read images directory' });
        }
        
        // Find all test summary files
        const summaryFiles = files.filter(f => f.includes('_summary.json'));
        const results = [];
        
        summaryFiles.forEach(file => {
            try {
                const content = fs.readFileSync(path.join(imagesDir, file), 'utf8');
                const summary = JSON.parse(content);
                results.push(summary);
            } catch (e) {
                // Skip invalid files
            }
        });
        
        // Sort by timestamp, newest first
        results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({ results });
    });
});

// API endpoint to get the list of images with pagination
app.get('/api/images', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 50;

    fs.readdir(imagesDir, (err, files) => {
        if (err) {
            console.error('Error reading images directory:', err);
            return res.status(500).json({ error: 'Could not read images directory' });
        }
        // Filter out non-image files
        const imageFiles = files.filter(f => 
            (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.gif')) &&
            !f.endsWith('.json')
        );
        // Sort files by modification time, newest first
        const sortedFiles = imageFiles
            .map(file => ({
                name: file,
                time: fs.statSync(path.join(imagesDir, file)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time)
            .map(file => file.name);
        
        const startIndex = (page - 1) * pageSize;
        const endIndex = page * pageSize;
        const paginatedFiles = sortedFiles.slice(startIndex, endIndex);
        
        res.json({
            images: paginatedFiles,
            totalPages: Math.ceil(sortedFiles.length / pageSize),
            currentPage: page
        });
    });
});

// WebSocket connection handler
wss.on('connection', ws => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Function to broadcast a message to all connected WebSocket clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Watch for new files in the images directory
const watcher = chokidar.watch(imagesDir, {
    ignored: /initial\.|\.tmp$/,
    persistent: true,
    ignoreInitial: true, // Don't send notifications for existing files on startup
});

console.log(`Watching for new images in: ${imagesDir}`);

watcher.on('add', filePath => {
    const fileName = path.basename(filePath);
    console.log(`New image detected: ${fileName}`);
    // Notify clients about the new image
    broadcast({ type: 'new_image', file: fileName });
});

server.listen(PORT, () => {
    console.log(`Image viewer server running on http://localhost:${PORT}`);
});
