let currentTestId = null;
let testWs = null;

// Initialize testing tab
document.addEventListener('DOMContentLoaded', () => {
    loadTestVideos();
    loadTestHistory();
    setupFilterButtons();
    initTestWebSocket();
});

// Initialize WebSocket for test updates
function initTestWebSocket() {
    testWs = new WebSocket(`ws://${window.location.host}`);
    
    testWs.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'test_progress') {
            appendToConsole(data.data);
        } else if (data.type === 'test_complete') {
            const btn = document.getElementById('run-test-btn');
            btn.disabled = false;
            btn.textContent = 'Run Test';
            
            if (data.success) {
                appendToConsole('\n✅ Test completed successfully!\n');
                loadTestResults();
                loadTestHistory();
            } else {
                appendToConsole('\n❌ Test failed: ' + (data.error || 'Unknown error'));
            }
        } else if (data.type === 'new_image' && currentTestId) {
            // Check if this is a test image
            if (data.file && data.file.includes(currentTestId)) {
                loadTestResults();
            }
        }
    };
}

// Load available test videos
async function loadTestVideos() {
    try {
        const response = await fetch('/api/test/videos');
        const data = await response.json();
        
        const select = document.getElementById('video-select');
        select.innerHTML = '';
        
        if (data.videos.length === 0) {
            select.innerHTML = '<option value="">No videos found</option>';
        } else {
            data.videos.forEach(video => {
                const option = document.createElement('option');
                option.value = video;
                option.textContent = video;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

// Run test
async function runTest() {
    const video = document.getElementById('video-select').value;
    const sport = document.getElementById('sport-select').value;
    const confidence = parseFloat(document.getElementById('confidence-input').value);
    const saveImages = document.getElementById('save-images-check').checked;
    
    if (!video) {
        alert('Please select a video');
        return;
    }
    
    const btn = document.getElementById('run-test-btn');
    btn.disabled = true;
    btn.textContent = 'Running...';
    
    // Clear console
    document.getElementById('test-console').textContent = '';
    
    // Generate test ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const videoName = video.replace(/\.[^/.]+$/, '');
    currentTestId = `test_${videoName}_${sport}_${timestamp}`;
    
    appendToConsole(`Starting test: ${currentTestId}\n\n`);
    
    try {
        const response = await fetch('/api/test/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ video, sport, confidence, saveImages })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Test failed');
        }
        
        const result = await response.json();
        console.log('Test result:', result);
        
    } catch (error) {
        console.error('Error running test:', error);
        appendToConsole(`\n❌ Error: ${error.message}`);
        btn.disabled = false;
        btn.textContent = 'Run Test';
    }
}

// Append text to console
function appendToConsole(text) {
    const console = document.getElementById('test-console');
    console.textContent += text;
    console.scrollTop = console.scrollHeight;
}

// Load test results
async function loadTestResults() {
    if (!currentTestId) return;
    
    try {
        const response = await fetch('/api/images?page=1&pageSize=500');
        const data = await response.json();
        
        // Filter images for current test (exclude JSON files)
        const testImages = data.images.filter(img => 
            img.includes(currentTestId) && !img.endsWith('.json')
        );
        
        displayTestImages(testImages);
        
    } catch (error) {
        console.error('Error loading test results:', error);
    }
}

// Display test images
function displayTestImages(images) {
    const container = document.getElementById('test-images');
    container.innerHTML = '';
    
    // Group images by type
    const grouped = {
        SHOT: [],
        L1: [],
        L2: [],
        BALL: [],
        OTHER: []
    };
    
    images.forEach(img => {
        if (img.includes('_SHOT_')) {
            grouped.SHOT.push(img);
        } else if (img.includes('_L1_')) {
            grouped.L1.push(img);
        } else if (img.includes('_L2_')) {
            grouped.L2.push(img);
        } else if (img.includes('_BALL_')) {
            grouped.BALL.push(img);
        } else {
            grouped.OTHER.push(img);
        }
    });
    
    // Display based on current filter
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    let imagesToShow = [];
    
    if (activeFilter === 'all') {
        imagesToShow = images;
    } else {
        imagesToShow = grouped[activeFilter] || [];
    }
    
    imagesToShow.forEach(image => {
        const item = document.createElement('div');
        item.className = 'grid-item';
        
        const img = document.createElement('img');
        img.src = `/images/${image}`;
        img.alt = image;
        img.loading = 'lazy';
        
        const filename = document.createElement('div');
        filename.className = 'filename';
        
        // Parse filename for better display
        const parts = image.split('_');
        let label = '';
        if (image.includes('_SHOT_')) {
            label = '🏀 SHOT ';
        } else if (image.includes('_L1_')) {
            label = '📊 L1 ';
        } else if (image.includes('_L2_')) {
            label = '🎯 L2 ';
        } else if (image.includes('_BALL_')) {
            label = '⚪ BALL ';
        }
        
        // Extract frame number and time
        const frameMatch = image.match(/frame(\d+)_([0-9.]+)s/);
        if (frameMatch) {
            label += `Frame ${frameMatch[1]} (${frameMatch[2]}s)`;
        }
        
        filename.textContent = label || image;
        
        item.appendChild(img);
        item.appendChild(filename);
        container.appendChild(item);
    });
    
    if (imagesToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No images found for this filter</p>';
    }
}

// Setup filter buttons
function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadTestResults();
        });
    });
}

// Load test history
async function loadTestHistory() {
    try {
        const response = await fetch('/api/test/results');
        const data = await response.json();
        
        const container = document.getElementById('test-history-list');
        container.innerHTML = '';
        
        // Show last 5 tests
        data.results.slice(0, 5).forEach(result => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.onclick = () => loadHistoricTest(result.testRunId);
            
            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date(result.timestamp).toLocaleString();
            
            const stats = document.createElement('div');
            stats.className = 'stats';
            stats.innerHTML = `
                <strong>${result.video}</strong> - ${result.sport}<br>
                Shots: ${result.shots.length} | 
                Frames: ${result.stats?.framesProcessed || 0}
            `;
            
            item.appendChild(timestamp);
            item.appendChild(stats);
            container.appendChild(item);
        });
        
        if (data.results.length === 0) {
            container.innerHTML = '<p style="color: #666;">No test history found</p>';
        }
        
    } catch (error) {
        console.error('Error loading test history:', error);
    }
}

// Load historic test results
function loadHistoricTest(testId) {
    currentTestId = testId;
    loadTestResults();
    
    // Clear console and show message
    document.getElementById('test-console').textContent = `Loaded historic test: ${testId}`;
}