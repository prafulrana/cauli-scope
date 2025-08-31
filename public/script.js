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
            // Add new image to the grid immediately
            addNewImageToGrid(data.file);
        } else if (data.type === 'image_deleted') {
            console.log('Image deleted:', data.file);
            removeImageFromGrid(data.file);
        } else if (data.type === 'directory_cleared') {
            console.log('Directory cleared');
            document.getElementById('image-grid').innerHTML = '';
            updateImageCount(0);
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
async function loadImages(page = currentPage) {
    const loader = document.getElementById('loader');
    const grid = document.getElementById('image-grid');
    
    currentPage = page;
    loader.style.display = 'block';
    
    try {
        const response = await fetch(`/api/images?page=${currentPage}&pageSize=${pageSize}`);
        const data = await response.json();
        
        grid.innerHTML = '';
        
        data.images.forEach(image => {
            createImageElement(image, grid);
        });
        
        updateImageCount(data.images.length);
        
    } catch (error) {
        console.error('Error loading images:', error);
    } finally {
        loader.style.display = 'none';
    }
}

// Create image element
function createImageElement(imageName, container) {
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.dataset.filename = imageName;
    
    const img = document.createElement('img');
    img.src = `/images/${imageName}`;
    img.alt = imageName;
    img.loading = 'lazy';
    
    const filename = document.createElement('div');
    filename.className = 'filename';
    filename.textContent = imageName;
    
    item.appendChild(img);
    item.appendChild(filename);
    container.appendChild(item);
}

// Add new image to grid immediately
function addNewImageToGrid(imageName) {
    const grid = document.getElementById('image-grid');
    
    // Check if image already exists
    if (grid.querySelector(`[data-filename="${imageName}"]`)) {
        return;
    }
    
    // Add to the beginning of the grid
    const firstChild = grid.firstChild;
    const item = document.createElement('div');
    item.className = 'grid-item new-image';
    item.dataset.filename = imageName;
    
    const img = document.createElement('img');
    img.src = `/images/${imageName}`;
    img.alt = imageName;
    
    const filename = document.createElement('div');
    filename.className = 'filename';
    filename.textContent = imageName;
    
    item.appendChild(img);
    item.appendChild(filename);
    
    if (firstChild) {
        grid.insertBefore(item, firstChild);
    } else {
        grid.appendChild(item);
    }
    
    // Update count
    const currentCount = grid.children.length;
    updateImageCount(currentCount);
    
    // Add animation class
    setTimeout(() => item.classList.remove('new-image'), 100);
}

// Remove image from grid
function removeImageFromGrid(imageName) {
    const grid = document.getElementById('image-grid');
    const item = grid.querySelector(`[data-filename="${imageName}"]`);
    if (item) {
        item.remove();
        updateImageCount(grid.children.length);
    }
}

// Update image count display
function updateImageCount(count) {
    const countElement = document.getElementById('image-count');
    if (countElement) {
        countElement.textContent = `${count} images`;
    }
}

// Clear directory
async function clearDirectory() {
    if (!confirm('Are you sure you want to delete all images? This cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/images/clear', { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            alert(`Deleted ${data.deletedCount} files`);
            loadImages(1);
        } else {
            alert('Failed to clear directory');
        }
    } catch (error) {
        console.error('Error clearing directory:', error);
        alert('Error clearing directory');
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