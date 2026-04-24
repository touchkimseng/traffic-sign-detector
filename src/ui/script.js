// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const detectedSigns = document.getElementById('detectedSigns');
const spinner = document.getElementById('spinner');

// Tab elements
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Camera elements
const cameraVideo = document.getElementById('cameraVideo');
const cameraCanvas = document.getElementById('cameraCanvas');
const cameraPreview = document.getElementById('cameraPreview');
const cameraOverlay = cameraPreview.querySelector('.camera-overlay');
const startCameraBtn = document.getElementById('startCameraBtn');
const captureBtn = document.getElementById('captureBtn');
const stopCameraBtn = document.getElementById('stopCameraBtn');
const cameraStatus = document.getElementById('cameraStatus');

// Camera state
let cameraStream = null;
let isCameraActive = false;

// Sample traffic signs database for simulation
const trafficSignsDatabase = [
    { name: 'Stop Sign', icon: '🛑', type: 'regulatory' },
    { name: 'Speed Limit 50', icon: '⚠️', type: 'regulatory' },
    { name: 'Yield', icon: '🔺', type: 'regulatory' },
    { name: 'No Entry', icon: '⛔', type: 'prohibitory' },
    { name: 'Pedestrian Crossing', icon: '🚶', type: 'warning' },
    { name: 'School Zone', icon: '🏫', type: 'warning' },
    { name: 'One Way', icon: '➡️', type: 'mandatory' },
    { name: 'Turn Right', icon: '↪️', type: 'mandatory' },
    { name: 'Parking', icon: '🅿️', type: 'informative' },
    { name: 'Hospital', icon: '🏥', type: 'informative' },
    { name: 'Railway Crossing', icon: '🚂', type: 'warning' },
    { name: 'Slippery Road', icon: '🌧️', type: 'warning' },
    { name: 'Construction', icon: '🚧', type: 'warning' },
    { name: 'Roundabout', icon: '🔄', type: 'mandatory' },
    { name: 'No Parking', icon: '🚫', type: 'prohibitory' }
];

// Event Listeners

// Tab switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        if (tabName === 'upload') {
            document.getElementById('uploadTab').classList.add('active');
            // Stop camera if switching away
            if (isCameraActive) {
                stopCamera();
            }
        } else if (tabName === 'camera') {
            document.getElementById('cameraTab').classList.add('active');
        }
    });
});

// Camera event listeners
startCameraBtn.addEventListener('click', startCamera);
captureBtn.addEventListener('click', captureImage);
stopCameraBtn.addEventListener('click', stopCamera);

// Click to upload
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
    } else {
        alert('Please upload a valid image file (JPG, PNG, WEBP)');
    }
});

// File input change handler
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleImageUpload(file);
    }
});

// Functions

/**
 * Handle image upload and processing
 * @param {File} file - The uploaded image file
 */
function handleImageUpload(file) {
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        alert('File size exceeds 10MB. Please upload a smaller image.');
        return;
    }

    // Show spinner
    spinner.classList.add('active');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImage.src = e.target.result;
        
        // Simulate AI processing time (1.5 seconds)
        setTimeout(() => {
            spinner.classList.remove('active');
            detectSigns();
            previewSection.classList.add('active');
            // Smooth scroll to results
            previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 1500);
    };
    
    reader.onerror = () => {
        spinner.classList.remove('active');
        alert('Error reading file. Please try again.');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Simulate AI traffic sign detection
 * Randomly selects 2-4 signs from the database with confidence scores
 */
function detectSigns() {
    // Randomly select 2-4 signs
    const numSigns = Math.floor(Math.random() * 3) + 2; // 2 to 4 signs
    const selectedSigns = [];
    const availableSigns = [...trafficSignsDatabase]; // Create a copy
    
    // Randomly select signs
    for (let i = 0; i < numSigns && availableSigns.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableSigns.length);
        const sign = availableSigns.splice(randomIndex, 1)[0];
        // Generate random confidence between 80-100%
        const confidence = Math.floor(Math.random() * 20) + 80;
        selectedSigns.push({ ...sign, confidence });
    }

    // Sort by confidence (highest first)
    selectedSigns.sort((a, b) => b.confidence - a.confidence);

    // Display results
    displayResults(selectedSigns);
}

/**
 * Display detection results in the UI
 * @param {Array} signs - Array of detected sign objects
 */
function displayResults(signs) {
    detectedSigns.innerHTML = '';
    
    if (signs.length === 0) {
        detectedSigns.innerHTML = '<div class="no-detection">No traffic signs detected in this image.</div>';
        return;
    }
    
    signs.forEach((sign, index) => {
        const signElement = document.createElement('div');
        signElement.className = 'sign-item';
        signElement.style.animationDelay = `${index * 0.1}s`;
        
        signElement.innerHTML = `
            <div class="sign-icon">${sign.icon}</div>
            <div class="sign-details">
                <div class="sign-name">${sign.name}</div>
                <div class="sign-confidence">Confidence: ${sign.confidence}% • Type: ${sign.type}</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${sign.confidence}%"></div>
                </div>
            </div>
        `;
        
        detectedSigns.appendChild(signElement);
    });
}

/**
 * Reset the application to analyze another image
 */
function analyzeAgain() {
    previewSection.classList.remove('active');
    fileInput.value = '';
    detectedSigns.innerHTML = '';
    previewImage.src = '';
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Generate and download a text report of the detection results
 */
function downloadResults() {
    const signItems = document.querySelectorAll('.sign-item');
    
    if (signItems.length === 0) {
        alert('No detection results to download.');
        return;
    }
    
    const signs = Array.from(signItems).map(item => {
        const name = item.querySelector('.sign-name').textContent;
        const confidence = item.querySelector('.sign-confidence').textContent;
        return `${name} - ${confidence}`;
    });

    const report = `TRAFFIC SIGN DETECTION REPORT
Generated: ${new Date().toLocaleString()}
==================================

Detected Signs:
${signs.map((sign, idx) => `${idx + 1}. ${sign}`).join('\n')}

==================================
Total Signs Detected: ${signs.length}
Analysis Status: Complete
Processed: ${new Date().toLocaleDateString()}
`;

    // Create and download the file
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-sign-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize
console.log('Traffic Sign Detector initialized');
console.log(`Database contains ${trafficSignsDatabase.length} sign types`);

// Camera Functions

/**
 * Start the camera stream
 */
async function startCamera() {
    try {
        cameraStatus.textContent = 'Starting camera...';
        cameraStatus.classList.remove('error');
        
        // Request camera access with ideal constraints
        const constraints = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraVideo.srcObject = cameraStream;
        cameraVideo.classList.add('active');
        cameraOverlay.classList.add('active');
        isCameraActive = true;
        
        // Update UI
        startCameraBtn.style.display = 'none';
        captureBtn.style.display = 'inline-flex';
        stopCameraBtn.style.display = 'inline-flex';
        cameraStatus.textContent = 'Camera active - Position traffic sign in frame';
        cameraStatus.classList.remove('error');
        
    } catch (error) {
        console.error('Camera access error:', error);
        let errorMessage = 'Unable to access camera. ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera permissions in your browser settings.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is already in use by another application.';
        } else {
            errorMessage += error.message || 'Unknown error occurred.';
        }
        
        cameraStatus.textContent = errorMessage;
        cameraStatus.classList.add('error');
    }
}

/**
 * Capture image from camera and analyze it
 */
function captureImage() {
    if (!isCameraActive || !cameraStream) {
        cameraStatus.textContent = 'Camera is not active';
        cameraStatus.classList.add('error');
        return;
    }
    
    // Set canvas dimensions to match video
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    
    // Draw current video frame to canvas
    const context = cameraCanvas.getContext('2d');
    context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
    
    // Convert canvas to data URL
    const imageDataUrl = cameraCanvas.toDataURL('image/jpeg', 0.9);
    
    // Stop camera
    stopCamera();
    
    // Show spinner
    spinner.classList.add('active');
    
    // Set preview image
    previewImage.src = imageDataUrl;
    
    // Simulate processing time
    setTimeout(() => {
        spinner.classList.remove('active');
        detectSigns();
        previewSection.classList.add('active');
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1500);
    
    cameraStatus.textContent = 'Image captured successfully!';
    cameraStatus.classList.remove('error');
}

/**
 * Stop the camera stream
 */
function stopCamera() {
    if (cameraStream) {
        // Stop all tracks
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    // Reset UI
    cameraVideo.srcObject = null;
    cameraVideo.classList.remove('active');
    cameraOverlay.classList.remove('active');
    isCameraActive = false;
    
    startCameraBtn.style.display = 'inline-flex';
    captureBtn.style.display = 'none';
    stopCameraBtn.style.display = 'none';
    cameraStatus.textContent = 'Click "Start Camera" to begin scanning';
    cameraStatus.classList.remove('error');
}

// Cleanup camera on page unload
window.addEventListener('beforeunload', () => {
    if (isCameraActive) {
        stopCamera();
    }
});
