let ws;
let currentPage = 1;
const pageSize = 50;

// Tab functionality
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let content of tabContents) {
        content.style.display = 'none';
        content.classList.remove('active');
    }
    
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let button of tabButtons) {
        button.classList.remove('active');
    }
    
    document.getElementById(tabName).style.display = 'block';
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Initialize WebSocket connection
function initWebSocket() {
    ws = new WebSocket(`ws://${window.location.host}`);
    
    ws.onopen = () => {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_image') {
            console.log('New image:', data.file);
            // Reload images when a new one arrives
            loadImages();
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Try to reconnect after 5 seconds
        setTimeout(initWebSocket, 5000);
    };
}

// Load and display images
async function loadImages() {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('image-grid');
    
    loader.style.display = 'block';
    
    try {
        const response = await fetch(`/api/images?page=${currentPage}&pageSize=${pageSize}`);
        const data = await response.json();
        
        grid.innerHTML = '';
        
        data.images.forEach(image => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            
            const img = document.createElement('img');
            img.src = `/images/${image}`;
            img.alt = image;
            img.loading = 'lazy';
            
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = image;
            
            item.appendChild(img);
            item.appendChild(filename);
            grid.appendChild(item);
        });
        
    } catch (error) {
        console.error('Error loading images:', error);
    } finally {
        loader.style.display = 'none';
    }
}

// Infinite scroll
function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
            currentPage++;
            loadImages();
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadImages();
    initWebSocket();
    setupInfiniteScroll();
});