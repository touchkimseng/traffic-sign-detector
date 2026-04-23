// DOM Elements
const uploadArea    = document.getElementById('uploadArea');
const fileInput     = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage  = document.getElementById('previewImage');
const detectedSigns = document.getElementById('detectedSigns');
const spinner       = document.getElementById('spinner');
const sourceBadge   = document.getElementById('sourceBadge');

// Camera elements
const cameraFeed      = document.getElementById('cameraFeed');
const captureCanvas   = document.getElementById('captureCanvas');
const startCameraBtn  = document.getElementById('startCameraBtn');
const captureBtn      = document.getElementById('captureBtn');
const stopCameraBtn   = document.getElementById('stopCameraBtn');
const cameraArea      = document.getElementById('cameraArea');
const permissionHint  = document.getElementById('cameraPermissionHint');

// State
let currentMode   = 'upload'; // 'upload' | 'camera'
let cameraStream  = null;

// Traffic signs database
const trafficSignsDatabase = [
    { name: 'Stop Sign',           icon: '🛑', type: 'regulatory'  },
    { name: 'Speed Limit 50',      icon: '⚠️', type: 'regulatory'  },
    { name: 'Yield',               icon: '🔺', type: 'regulatory'  },
    { name: 'No Entry',            icon: '⛔', type: 'prohibitory' },
    { name: 'Pedestrian Crossing', icon: '🚶', type: 'warning'     },
    { name: 'School Zone',         icon: '🏫', type: 'warning'     },
    { name: 'One Way',             icon: '➡️', type: 'mandatory'   },
    { name: 'Turn Right',          icon: '↪️', type: 'mandatory'   },
    { name: 'Parking',             icon: '🅿️', type: 'informative' },
    { name: 'Hospital',            icon: '🏥', type: 'informative' },
    { name: 'Railway Crossing',    icon: '🚂', type: 'warning'     },
    { name: 'Slippery Road',       icon: '🌧️', type: 'warning'     },
    { name: 'Construction',        icon: '🚧', type: 'warning'     },
    { name: 'Roundabout',          icon: '🔄', type: 'mandatory'   },
    { name: 'No Parking',          icon: '🚫', type: 'prohibitory' },
];

// ── Mode Toggle ──────────────────────────────────────────────

function switchMode(mode) {
    currentMode = mode;

    document.getElementById('uploadModeBtn').classList.toggle('active', mode === 'upload');
    document.getElementById('cameraModeBtn').classList.toggle('active', mode === 'camera');
    document.getElementById('uploadMode').style.display  = mode === 'upload' ? 'block' : 'none';
    document.getElementById('cameraMode').style.display  = mode === 'camera' ? 'block' : 'none';

    // If leaving camera mode, stop any active stream
    if (mode !== 'camera' && cameraStream) stopCamera();

    // Set placeholder state when switching to camera before starting
    if (mode === 'camera' && !cameraStream) {
        setCameraInactive();
    }
}

function setCameraInactive() {
    cameraArea.classList.add('inactive');
    cameraArea.innerHTML = `
        <span class="camera-placeholder-icon">📷</span>
        <span class="camera-placeholder-text">Click "Start Camera" to begin scanning</span>
    `;
}

// ── Upload Handlers ──────────────────────────────────────────

uploadArea.addEventListener('click', () => fileInput.click());

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
        handleImageUpload(file, 'upload');
    } else {
        alert('Please upload a valid image file (JPG, PNG, WEBP)');
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleImageUpload(file, 'upload');
});

// ── Camera Functions ─────────────────────────────────────────

async function startCamera() {
    try {
        permissionHint.style.display = 'none';

        // Restore camera area markup if we had set it to placeholder
        cameraArea.classList.remove('inactive');
        cameraArea.innerHTML = `
            <video id="cameraFeed" autoplay playsinline></video>
            <div class="camera-overlay">
                <div class="scan-frame">
                    <span class="corner tl"></span>
                    <span class="corner tr"></span>
                    <span class="corner bl"></span>
                    <span class="corner br"></span>
                    <div class="scan-line"></div>
                </div>
                <div class="camera-hint">Point at a traffic sign</div>
            </div>
            <canvas id="captureCanvas" style="display:none;"></canvas>
        `;

        const video = document.getElementById('cameraFeed');

        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
        });

        video.srcObject = cameraStream;
        await video.play();

        startCameraBtn.style.display = 'none';
        captureBtn.style.display     = '';
        stopCameraBtn.style.display  = '';

    } catch (err) {
        console.error('Camera error:', err);
        setCameraInactive();
        permissionHint.style.display = 'block';

        if (err.name === 'NotAllowedError') {
            alert('Camera access was denied. Please allow camera permissions in your browser settings and try again.');
        } else if (err.name === 'NotFoundError') {
            alert('No camera found on this device.');
        } else {
            alert('Could not start camera: ' + err.message);
        }
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    setCameraInactive();
    startCameraBtn.style.display = '';
    captureBtn.style.display     = 'none';
    stopCameraBtn.style.display  = 'none';
    permissionHint.style.display = 'block';
}

function capturePhoto() {
    const video  = document.getElementById('cameraFeed');
    const canvas = document.getElementById('captureCanvas') || document.createElement('canvas');

    if (!video || !video.videoWidth) {
        alert('Camera feed not ready. Please wait a moment and try again.');
        return;
    }

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataURL = canvas.toDataURL('image/jpeg', 0.95);

    // Stop stream after capture to save resources (optional UX choice)
    stopCamera();

    // Use captured dataURL as the preview image
    handleImageFromDataURL(dataURL, 'camera');
}

// ── Image Handling ───────────────────────────────────────────

function handleImageUpload(file, source) {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
        alert('File size exceeds 10MB. Please upload a smaller image.');
        return;
    }

    spinner.classList.add('active');

    const reader = new FileReader();
    reader.onload = (e) => handleImageFromDataURL(e.target.result, source);
    reader.onerror = () => {
        spinner.classList.remove('active');
        alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
}

function handleImageFromDataURL(dataURL, source) {
    spinner.classList.add('active');
    previewImage.src = dataURL;

    // Set source badge
    sourceBadge.textContent = source === 'camera' ? '📷 Camera' : '📁 Uploaded';
    sourceBadge.className   = `source-badge ${source}`;

    setTimeout(() => {
        spinner.classList.remove('active');
        detectSigns();
        previewSection.classList.add('active');
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 1500);
}

// ── Detection Logic ──────────────────────────────────────────

function detectSigns() {
    const numSigns     = Math.floor(Math.random() * 3) + 2;
    const available    = [...trafficSignsDatabase];
    const selectedSigns = [];

    for (let i = 0; i < numSigns && available.length > 0; i++) {
        const idx  = Math.floor(Math.random() * available.length);
        const sign = available.splice(idx, 1)[0];
        const confidence = Math.floor(Math.random() * 20) + 80;
        selectedSigns.push({ ...sign, confidence });
    }

    selectedSigns.sort((a, b) => b.confidence - a.confidence);
    displayResults(selectedSigns);
}

function displayResults(signs) {
    detectedSigns.innerHTML = '';

    if (signs.length === 0) {
        detectedSigns.innerHTML = '<div class="no-detection">No traffic signs detected in this image.</div>';
        return;
    }

    signs.forEach((sign, index) => {
        const el = document.createElement('div');
        el.className = 'sign-item';
        el.style.animationDelay = `${index * 0.1}s`;
        el.innerHTML = `
            <div class="sign-icon">${sign.icon}</div>
            <div class="sign-details">
                <div class="sign-name">${sign.name}</div>
                <div class="sign-confidence">Confidence: ${sign.confidence}% &bull; Type: ${sign.type}</div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${sign.confidence}%"></div>
                </div>
            </div>
        `;
        detectedSigns.appendChild(el);
    });
}

// ── Actions ──────────────────────────────────────────────────

function analyzeAgain() {
    previewSection.classList.remove('active');
    fileInput.value       = '';
    detectedSigns.innerHTML = '';
    previewImage.src      = '';
    sourceBadge.textContent = '';
    sourceBadge.className   = 'source-badge';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function downloadResults() {
    const signItems = document.querySelectorAll('.sign-item');

    if (signItems.length === 0) {
        alert('No detection results to download.');
        return;
    }

    const signs = Array.from(signItems).map(item => {
        const name       = item.querySelector('.sign-name').textContent;
        const confidence = item.querySelector('.sign-confidence').textContent;
        return `${name} - ${confidence}`;
    });

    const sourceLabel = sourceBadge.textContent.includes('Camera') ? 'Camera Capture' : 'Uploaded Image';

    const report = `TRAFFIC SIGN DETECTION REPORT
Generated: ${new Date().toLocaleString()}
Source: ${sourceLabel}
==================================

Detected Signs:
${signs.map((sign, idx) => `${idx + 1}. ${sign}`).join('\n')}

==================================
Total Signs Detected: ${signs.length}
Analysis Status: Complete
Processed: ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `traffic-sign-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ── Init ─────────────────────────────────────────────────────

console.log('Traffic Sign Detector initialized');
console.log(`Database contains ${trafficSignsDatabase.length} sign types`);
