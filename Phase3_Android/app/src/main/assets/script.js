const videoElement = document.getElementById('input-video');
const canvasElement = document.getElementById('output-canvas');
const canvasCtx = canvasElement.getContext('2d');
const cursor = document.getElementById('virtual-cursor');
const statusText = document.getElementById('status-text');

// Logic States
let currentMode = 'mouse'; 
let isLeftClicking = false;
let isRightClicking = false;
let lastDrawX = 0, lastDrawY = 0;
let lastScreenshotTime = 0, lastThemeTime = 0, lastFsTime = 0;

// Gallery logic states
let lastWristX = 0;
let lastSwipeTime = 0;

const drawingCanvas = document.getElementById('drawing-canvas');
const dcCtx = drawingCanvas.getContext('2d');
let engineLoaded = false;

// 1. Navigation Flow
function startWebHub() {
    document.getElementById('splash-screen').classList.remove('active-layer');
    document.getElementById('splash-screen').classList.add('hidden-layer');
    document.getElementById('app-dashboard').classList.remove('hidden-layer');
    document.getElementById('app-dashboard').classList.add('active-layer');
    
    // Android Support Hack: Hide video frame to save UI redraw speed since we just need logic
    if (typeof AndroidManager !== 'undefined') {
        videoElement.style.opacity = '0';
    }
    
    if(!engineLoaded) { camera.start(); engineLoaded = true; }
}

function setMode(newMode) {
    currentMode = newMode;
    ['mouse', 'canvas', 'laser', 'gallery', 'keyboard'].forEach(mode => {
        const btn = document.getElementById(`btn-${mode}`);
        const pnl = document.getElementById(`${mode}-panel`);
        if(btn) btn.classList.remove('active');
        if(pnl) { pnl.classList.remove('active-panel'); pnl.classList.add('hidden-panel'); }
    });

    document.getElementById(`btn-${newMode}`).classList.add('active');
    document.getElementById(`${newMode}-panel`).classList.add('active-panel');
    document.getElementById(`${newMode}-panel`).classList.remove('hidden-panel');

    cursor.className = 'cursor'; 

    if(newMode === 'mouse') document.getElementById('mode-title').innerText = "Mouse Controller";
    if(newMode === 'canvas') { document.getElementById('mode-title').innerText = "Air Canvas Board"; cursor.classList.add('canvas-mode'); }
    if(newMode === 'laser') { document.getElementById('mode-title').innerText = "Presentation Laser"; cursor.classList.add('laser-mode'); }
    if(newMode === 'gallery') document.getElementById('mode-title').innerText = "Touchless Gallery";
    if(newMode === 'keyboard') document.getElementById('mode-title').innerText = "Virtual Air Keyboard";
}

function takeVirtualScreenshot() {
    const flash = document.getElementById('flash-effect');
    flash.style.opacity = '1';
    const dataURI = canvasElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURI;
    a.download = `AI_Screenshot_${Date.now()}.png`;
    setTimeout(() => { flash.style.opacity = '0'; a.click(); }, 150);
}

// 2. High Performance AI Loop
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        let isPaused = false;
        const lm = results.multiHandLandmarks[0]; 
        
        drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, {color: '#818cf8', lineWidth: 4});
        drawLandmarks(canvasCtx, lm, {color: '#38bdf8', lineWidth: 2, radius: 4});

        const thumbTip = lm[4], wrist = lm[0];
        const indexTip = lm[8], indexPip = lm[6]; 
        const middleTip = lm[12], middlePip = lm[10];
        const ringTip = lm[16], ringPip = lm[14];
        const pinkyTip = lm[20], pinkyPip = lm[18];

        const indexUp = indexTip.y < indexPip.y;
        const middleUp = middleTip.y < middlePip.y;
        const ringUp = ringTip.y < ringPip.y;
        const pinkyUp = pinkyTip.y < pinkyPip.y;

        const distLeft = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const distRight = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
        const distRing = Math.hypot(thumbTip.x - ringTip.x, thumbTip.y - ringTip.y);
        const distSS = Math.hypot(thumbTip.x - pinkyTip.x, thumbTip.y - pinkyTip.y);
        const distIndexMiddle = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);

        const screenX = (1 - indexTip.x) * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;

        // ==========================================
        // SYSTEM-WIDE FEATURES 
        // ==========================================
        if ((!indexUp && !middleUp && !ringUp && !pinkyUp) || (!indexUp && !middleUp && distLeft < 0.1 && distRight < 0.1)) {
            statusText.innerText = "Tracking Paused (Fist)";
            statusText.style.color = "#ef4444";
            cursor.style.opacity = '0.3';
            isPaused = true;
        } else {
            statusText.innerText = "Tracking Active";
            statusText.style.color = "#4ade80";
            cursor.style.opacity = '1';
        }

        if (!isPaused) {
            cursor.style.display = 'block';
            cursor.style.left = `${screenX}px`;
            cursor.style.top = `${screenY}px`;
        } else {
            canvasCtx.restore();
            return; 
        }

        if ((indexUp && !middleUp && !ringUp && pinkyUp) || 
            (indexUp && middleUp && distLeft > 0.15 && distRight > 0.15 && distIndexMiddle > 0.15)) {
            if (Date.now() - lastFsTime > 2500) {
                lastFsTime = Date.now();
                if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch((e)=>{});
                else if (document.exitFullscreen) document.exitFullscreen();
            }
        }

        if ((distRing < 0.05 && !middleUp && (Date.now() - lastThemeTime > 2000)) ||
            (indexUp && middleUp && distIndexMiddle < 0.03 && distLeft > 0.1 && (Date.now() - lastThemeTime > 2000))) {
            lastThemeTime = Date.now();
            cursor.classList.add('action-active');
            document.body.classList.toggle('light-theme');
            setTimeout(() => cursor.classList.remove('action-active'), 500);
        }

        // ==========================================
        // SYSTEM-WIDE SCROLL AND SCREENSHOT
        // ==========================================
        if ((indexUp && middleUp && !ringUp && !pinkyUp && distRight > 0.08 && distLeft > 0.08) || 
            (indexUp && middleUp && distLeft > 0.1 && distRight > 0.1 && distIndexMiddle > 0.04)) {
            cursor.classList.add('scrolling');
            if (indexTip.y < 0.35) {
                window.scrollBy({ top: -40, behavior: 'instant' });
                if (typeof AndroidManager !== 'undefined') AndroidManager.performScroll(-40);
            }
            else if (indexTip.y > 0.65) {
                window.scrollBy({ top: 40, behavior: 'instant' });
                if (typeof AndroidManager !== 'undefined') AndroidManager.performScroll(40);
            }
        } else { 
            cursor.classList.remove('scrolling'); 
        }

        if ((distSS < 0.05 && !indexUp && !middleUp && (Date.now() - lastScreenshotTime > 3000)) ||
            (distLeft < 0.06 && distRight < 0.06 && distIndexMiddle < 0.06 && (Date.now() - lastScreenshotTime > 3000))) {
            lastScreenshotTime = Date.now(); takeVirtualScreenshot();
        }

        // ==========================================
        // MODE-SPECIFIC HANDLERS
        // ==========================================
        
        if (currentMode === 'mouse') {
            if ((distLeft < 0.05 && !middleUp && !ringUp) || (distLeft < 0.06 && distRight > 0.08)) {
                if (!isLeftClicking) {
                    isLeftClicking = true;
                    cursor.classList.add('clicking-left');
                    const element = document.elementFromPoint(screenX, screenY);
                    if (element && element !== cursor) element.click();

                    // Connect Global Injection Bridge for Android Accessibility API
                    if (typeof AndroidManager !== 'undefined') {
                        AndroidManager.performClick(screenX, screenY);
                    }
                }
            } else { isLeftClicking = false; cursor.classList.remove('clicking-left'); }

            if ((distRight < 0.05 && !indexUp && !ringUp) || (distRight < 0.06 && distLeft > 0.08)) {
                if (!isRightClicking) {
                    isRightClicking = true;
                    cursor.classList.add('clicking-right');
                    const element = document.elementFromPoint(screenX, screenY);
                    if (element && element !== cursor) {
                        element.dispatchEvent(new MouseEvent('contextmenu', {
                            bubbles: true, cancelable: true, clientX: screenX, clientY: screenY
                        }));
                    }
                }
            } else { isRightClicking = false; cursor.classList.remove('clicking-right'); }
        } 
        else if (currentMode === 'canvas') {
            if (indexUp && middleUp && ringUp && pinkyUp) {
                dcCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
                lastDrawX = 0; lastDrawY = 0;
            } else if (indexUp && !middleUp && !ringUp && !pinkyUp) {
                const drawX = indexTip.x * drawingCanvas.width;
                const drawY = indexTip.y * drawingCanvas.height;
                if (lastDrawX !== 0 && lastDrawY !== 0) {
                    dcCtx.beginPath(); dcCtx.moveTo(lastDrawX, lastDrawY); dcCtx.lineTo(drawX, drawY);
                    dcCtx.strokeStyle = '#38bdf8'; dcCtx.lineWidth = 5; dcCtx.lineCap = 'round'; dcCtx.stroke();
                }
                lastDrawX = drawX; lastDrawY = drawY;
            } else { lastDrawX = 0; lastDrawY = 0; }
        }
        else if (currentMode === 'laser') {
            if (indexUp) {
                const drawX = indexTip.x * drawingCanvas.width; const drawY = indexTip.y * drawingCanvas.height;
                dcCtx.fillStyle = 'rgba(239, 68, 68, 0.4)'; dcCtx.beginPath(); dcCtx.arc(drawX, drawY, 12, 0, Math.PI * 2); dcCtx.fill();
                dcCtx.fillStyle = 'rgba(0, 0, 0, 0.1)'; dcCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            }
        }
        else if (currentMode === 'gallery') {
            const wristX = wrist.x;
            if (indexUp && middleUp && ringUp && pinkyUp) {
                if (lastWristX !== 0 && (Date.now() - lastSwipeTime > 1000)) {
                    const deltaTrack = wristX - lastWristX; 
                    if (deltaTrack > 0.04) { // Swipe Right
                        document.getElementById('image-track').scrollBy({ left: -420, behavior: 'smooth' });
                        lastSwipeTime = Date.now();
                        statusText.innerText = "Swiped Right! ➡️";
                    } else if (deltaTrack < -0.04) { // Swipe Left
                        document.getElementById('image-track').scrollBy({ left: 420, behavior: 'smooth' });
                        lastSwipeTime = Date.now();
                        statusText.innerText = "Swiped Left! ⬅️";
                    }
                }
            }
            lastWristX = wristX;
        }
        else if (currentMode === 'keyboard') {
            if ((distLeft < 0.05 && !middleUp && !ringUp) || (distLeft < 0.06 && distRight > 0.08)) {
                if (!isLeftClicking) {
                    isLeftClicking = true;
                    cursor.classList.add('clicking-left');
                    const element = document.elementFromPoint(screenX, screenY);
                    if (element && element.classList.contains('key-btn')) {
                        const airText = document.getElementById('air-text');
                        if (element.innerText === 'SPACE') airText.value += ' ';
                        else if (element.innerText === 'BACK') airText.value = airText.value.slice(0, -1);
                        else airText.value += element.innerText;
                        
                        element.style.background = '#22c55e'; // Green flash
                        setTimeout(() => element.style.background = '', 300);
                    }
                }
            } else { isLeftClicking = false; cursor.classList.remove('clicking-left'); }
        }

    } else {
        cursor.style.display = 'none'; 
        statusText.innerText = "Waiting for Target Hand...";
        statusText.style.color = "#94a3b8";
        if (currentMode === 'laser') {
            dcCtx.fillStyle = 'rgba(0, 0, 0, 0.15)'; dcCtx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.65, minTrackingConfidence: 0.65 });
hands.onResults(onResults);

const camera = new Camera(videoElement, { onFrame: async () => { await hands.send({image: videoElement}); }, width: 640, height: 480 });
