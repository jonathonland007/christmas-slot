/**
 * Christmas Magic Lines - Production Ready Slot Game
 * 
 * A complete 5x3 slot game with Christmas theme featuring:
 * - RGS integration with event processing system
 * - Base game with symbol animations and win detection
 * - Bonus system with free spins and multipliers  
 * - Responsive UI with horizontal layout
 * - Win tier system with appropriate animations
 * - Small win popups for wins under 10x bet
 * - Debug system for development (toggle MASTER_DEBUG)
 * 
 * Follows the established pattern from Evil Eddie's Super Slot
 * Designed for Stake Engine integration and approval
 * 
 * @version 1.0
 * @author Development Team
 */

// ==========================================
// Debug Configuration & Production Toggle
// ==========================================

// 🚀 PRODUCTION TOGGLE - Set to false for production deployment
// 
// FOR TESTING: MASTER_DEBUG = true (shows all debug info)
// FOR PRODUCTION: MASTER_DEBUG = false (clean console, only critical messages)
//
// TIMING DEBUG SYSTEM ACTIVE:
// 🎰 PLAY ROUND STARTED → 🏁 PLAY ROUND COMPLETED
// 🎲 REEL SPINNING STARTED → 🏁 ALL REELS STOPPED → ✅ REEL SETTLING COMPLETE  
// 💰 WIN PROCESSING STARTED → ✅ WIN PROCESSING COMPLETE
// 🏆 BIG WIN POPUP STARTED → ✅ BIG WIN POPUP COMPLETE
// 💫 SMALL WIN FLASH STARTED → ✅ SMALL WIN FLASH COMPLETE
// ✨ SYMBOL ANIMATION STARTED → ✅ SYMBOL ANIMATION COMPLETE
// 🎊 BONUS POPUP STARTED → 🎊 BONUS POPUP CLICKED → ✅ BONUS POPUP COMPLETE
//
const MASTER_DEBUG = false; // Disabled for clean replay testing

// Individual debug categories (only active if MASTER_DEBUG = true)
const DEBUG_CONFIG = {
    RGS: false,         // Disable RGS response investigation for cleaner output
    WINS: false,        // Disable win verification logs
    SYMBOLS: false,     // Disable symbol position logs
    EVENTS: false,      // Disable event processing debug
    GENERAL: false,     // Disable general game flow
    WIN_VERIFY: false,  // Disable win verification
    TIMING: false,      // Disable timing logs
    VISUAL_DEBUG: false, // Keep visual debugging framework disabled
    DOM_VISUAL: true    // NEW: Track actual DOM visibility
};

// DOM MONITORING SYSTEM - Track actual visual presence
class MultiplierDOMMonitor {
    constructor() {
        this.activeMultipliers = new Map(); // Track each multiplier's lifecycle
        this.startMonitoring();
    }
    
    startMonitoring() {
        // Monitor DOM changes for multiplier overlays
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Track additions
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('multiplier-overlay')) {
                        this.trackMultiplierAppearance(node);
                    }
                    // Check children for multiplier overlays
                    if (node.querySelectorAll) {
                        const multipliers = node.querySelectorAll('.multiplier-overlay');
                        multipliers.forEach(mult => this.trackMultiplierAppearance(mult));
                    }
                });
                
                // Track removals
                mutation.removedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList && node.classList.contains('multiplier-overlay')) {
                        this.trackMultiplierDisappearance(node);
                    }
                    // Check children for multiplier overlays
                    if (node.querySelectorAll) {
                        const multipliers = node.querySelectorAll('.multiplier-overlay');
                        multipliers.forEach(mult => this.trackMultiplierDisappearance(mult));
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    trackMultiplierAppearance(multiplierElement) {
        const timestamp = Date.now();
        const value = multiplierElement.textContent;
        const position = this.getElementPosition(multiplierElement);
        const id = `${value}-${position}-${timestamp}`;
        
        this.activeMultipliers.set(id, {
            element: multiplierElement,
            value: value,
            position: position,
            appearedAt: timestamp,
            visible: true
        });
        
        console.log(`🟢 [DOM VISUAL] MULTIPLIER APPEARED: ${value} at ${position} - Time: ${new Date(timestamp).toLocaleTimeString()}.${timestamp % 1000}`);
        console.log(`📊 [DOM VISUAL] Total active multipliers: ${this.activeMultipliers.size}`);
    }
    
    trackMultiplierDisappearance(multiplierElement) {
        const timestamp = Date.now();
        const value = multiplierElement.textContent;
        const position = this.getElementPosition(multiplierElement);
        
        // Find matching multiplier in our tracking
        for (let [id, data] of this.activeMultipliers.entries()) {
            if (data.element === multiplierElement || (data.value === value && data.position === position)) {
                const duration = timestamp - data.appearedAt;
                console.log(`🔴 [DOM VISUAL] MULTIPLIER DISAPPEARED: ${value} at ${position} - Duration: ${duration}ms - Time: ${new Date(timestamp).toLocaleTimeString()}.${timestamp % 1000}`);
                this.activeMultipliers.delete(id);
                break;
            }
        }
        
        console.log(`📊 [DOM VISUAL] Total active multipliers: ${this.activeMultipliers.size}`);
    }
    
    getElementPosition(element) {
        // Try to find which reel/row this element belongs to
        let parent = element.parentElement;
        while (parent) {
            if (parent.classList && parent.classList.contains('symbol')) {
                const reelContainer = parent.closest('.reel');
                if (reelContainer) {
                    const reelIndex = Array.from(reelContainer.parentNode.children).indexOf(reelContainer);
                    const rowIndex = Array.from(reelContainer.children).indexOf(parent);
                    return `reel-${reelIndex}-row-${rowIndex}`;
                }
            }
            parent = parent.parentElement;
        }
        return 'unknown-position';
    }
    
    getCurrentStatus() {
        console.log(`📊 [DOM VISUAL] === CURRENT MULTIPLIER STATUS ===`);
        console.log(`📊 [DOM VISUAL] Active multipliers: ${this.activeMultipliers.size}`);
        for (let [id, data] of this.activeMultipliers.entries()) {
            const duration = Date.now() - data.appearedAt;
            console.log(`   ${data.value} at ${data.position} - Visible for ${duration}ms`);
        }
    }
}

// Initialize DOM monitor
let domMonitor = null;

// Debug helper functions
function debugLog(category, message, data = null) {
    if (!MASTER_DEBUG || !DEBUG_CONFIG[category]) return;
    
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] 🔧 ${category}:`;
    
    if (data) {
        console.log(prefix, message, data);
    } else {
        console.log(prefix, message);
    }
}

// Timing logger for event tracking
function logTiming(event, action, details = '') {
    if (!MASTER_DEBUG || !DEBUG_CONFIG.TIMING) return;
    
    const timestamp = Date.now();
    const timeStr = new Date(timestamp).toLocaleTimeString('en-US', { 
        hour12: false, 
        millisecond: true 
    });
    console.log(`⏱️ ${timeStr} | ${event} ${action} ${details}`);
    return timestamp;
}

// ==========================================
// PRODUCTION CONSOLE MANAGEMENT
// ==========================================
// When MASTER_DEBUG = false:
// - All debugLog() calls are suppressed
// - Only critical messages show (errors, auth, asset warnings)
// - Clean console for production deployment
// 
// When MASTER_DEBUG = true:
// - All debug categories can be individually controlled
// - RGS: Shows RGS response analysis and payout verification
// - WINS: Shows win conversion math and bet scaling
// - SYMBOLS: Shows symbol verification and math engine matching
// - EVENTS: Shows event processing details
// - GENERAL: Shows general game flow (usually disabled to reduce noise)
//
// Store original console for win summaries
const originalConsole = console.log;

if (!MASTER_DEBUG) {
    console.log = function(...args) {
        const message = args.join(' ');
        
        // Always show critical messages even in production
        if (message.includes('ERROR') || 
            message.includes('FAILED') ||
            message.includes('Session ID:') ||
            message.includes('RGS URL:') ||
            message.includes('Authenticating') ||
            message.includes('No image found for symbol') ||
            message.includes('WIN SUMMARY') ||
            message.includes('🎰 ===') ||
            message.includes('💰 Total Win') ||
            message.includes('🚨 PROCESS WIN') ||
            message.includes('🔔 WIN SUMMARY FUNCTION')) {
            originalConsole.apply(console, args);
        }
        // All other logs are suppressed in production
    };
    
    console.log('🚀 PRODUCTION MODE: Debug logging disabled');
} else {
    console.log('🔧 DEVELOPMENT MODE: Full debug logging enabled');
    // Debug categories configured
}

// Timing Analysis Helpers
let timingMarkers = {};
function markTiming(label) {
    if (!MASTER_DEBUG) return;
    timingMarkers[label] = Date.now();
    debugLog('TIMING', `⏱️ MARKED: ${label}`, { timestamp: timingMarkers[label] });
}

function getDuration(startLabel, endLabel = null) {
    if (!MASTER_DEBUG || !timingMarkers[startLabel]) return 0;
    const endTime = endLabel ? timingMarkers[endLabel] : Date.now();
    const duration = endTime - timingMarkers[startLabel];
    debugLog('TIMING', `📏 DURATION: ${startLabel} → ${endLabel || 'now'} = ${duration}ms`);
    return duration;
}

// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// 🎨 VISUAL DEBUGGING FRAMEWORK
// ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════

// Visual debugging state
let visualDebugActive = false;

// Element categories with color coding
const ELEMENT_CATEGORIES = {
    BUTTONS: { color: '#FF0000', name: 'Buttons' },        // Red borders
    SYMBOLS: { color: '#00FF00', name: 'Symbols' },        // Green borders  
    CONTAINERS: { color: '#0000FF', name: 'Containers' },  // Blue borders
    TEXT: { color: '#FF00FF', name: 'Text' },              // Magenta borders
    CONTROLS: { color: '#00FFFF', name: 'Controls' },      // Cyan borders
    POPUPS: { color: '#FF8C00', name: 'Popups' }          // Orange borders
};

// Initialize visual debugging system
function initVisualDebug() {
    if (!MASTER_DEBUG || !DEBUG_CONFIG.VISUAL_DEBUG) return;
    
    console.log('🎨 Visual Debug Framework Initialized');
    console.log('🔧 Auto-activating visual debugging for Stake Engine compatibility');
    
    // Auto-activate visual debugging (no keyboard shortcuts needed)
    setTimeout(() => {
        toggleVisualDebug();
    }, 1000); // Small delay to ensure DOM is ready
    
    // Add on-screen toggle button for manual control
    addDebugToggleButton();
}

// Add visible toggle button for debug controls
function addDebugToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'visual-debug-toggle';
    toggleButton.textContent = '🎨';
    toggleButton.style.cssText = `
        position: fixed;
        top: 1vh;
        left: 1vw;
        width: 4vw;
        height: 4vw;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: 0.2vw solid #FFD700;
        border-radius: 50%;
        font-size: 2vw;
        cursor: pointer;
        z-index: 25000;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    `;
    
    toggleButton.addEventListener('click', () => {
        toggleVisualDebug();
    });
    
    toggleButton.addEventListener('mouseenter', () => {
        toggleButton.style.background = 'rgba(255, 215, 0, 0.3)';
        toggleButton.style.transform = 'scale(1.1)';
    });
    
    toggleButton.addEventListener('mouseleave', () => {
        toggleButton.style.background = 'rgba(0, 0, 0, 0.7)';
        toggleButton.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(toggleButton);
}

// Toggle visual debugging on/off
function toggleVisualDebug() {
    visualDebugActive = !visualDebugActive;
    
    const toggleButton = document.getElementById('visual-debug-toggle');
    
    if (visualDebugActive) {
        addElementBorders();
        addCenterDots();
        showElementInfo();
        if (toggleButton) {
            toggleButton.textContent = '🔴';
            toggleButton.style.borderColor = '#FF0000';
        }
        console.log('🟢 Visual Debug: ENABLED - All elements now have colored borders and center dots');
    } else {
        removeElementBorders();
        removeCenterDots();
        hideElementInfo();
        if (toggleButton) {
            toggleButton.textContent = '🎨';
            toggleButton.style.borderColor = '#FFD700';
        }
        console.log('🔴 Visual Debug: DISABLED - Visual aids removed');
    }
}

// Add colored borders to all game elements
function addElementBorders() {
    let elementCounter = 1;
    
    // Buttons (Red borders)
    document.querySelectorAll('.control-button, .bonus-buy-button, .minus-button, .plus-button').forEach(el => {
        el.style.border = `0.2vw solid ${ELEMENT_CATEGORIES.BUTTONS.color}`;
        el.setAttribute('data-debug-category', 'BUTTONS');
        el.setAttribute('data-debug-id', generateElementId(el));
        el.setAttribute('data-debug-number', elementCounter);
        addNumberLabel(el, elementCounter, ELEMENT_CATEGORIES.BUTTONS.color);
        elementCounter++;
    });
    
    // Symbols (Green borders)
    document.querySelectorAll('.symbol-container, .reel-symbol').forEach(el => {
        el.style.border = `0.15vw solid ${ELEMENT_CATEGORIES.SYMBOLS.color}`;
        el.setAttribute('data-debug-category', 'SYMBOLS');
        el.setAttribute('data-debug-id', generateElementId(el));
        el.setAttribute('data-debug-number', elementCounter);
        addNumberLabel(el, elementCounter, ELEMENT_CATEGORIES.SYMBOLS.color);
        elementCounter++;
    });
    
    // Containers (Blue borders)
    document.querySelectorAll('.controls-container, .balance-container, .game-board, .bonus-controls-container').forEach(el => {
        el.style.border = `0.3vw solid ${ELEMENT_CATEGORIES.CONTAINERS.color}`;
        el.setAttribute('data-debug-category', 'CONTAINERS');
        el.setAttribute('data-debug-id', generateElementId(el));
        el.setAttribute('data-debug-number', elementCounter);
        addNumberLabel(el, elementCounter, ELEMENT_CATEGORIES.CONTAINERS.color);
        elementCounter++;
    });
    
    // Text elements (Magenta borders)
    document.querySelectorAll('.balance-amount, .bet-amount, .last-win-amount, .themed-win-amount').forEach(el => {
        el.style.border = `0.1vw solid ${ELEMENT_CATEGORIES.TEXT.color}`;
        el.setAttribute('data-debug-category', 'TEXT');
        el.setAttribute('data-debug-id', generateElementId(el));
        el.setAttribute('data-debug-number', elementCounter);
        addNumberLabel(el, elementCounter, ELEMENT_CATEGORIES.TEXT.color);
        elementCounter++;
    });
    
    // Control elements (Cyan borders)
    document.querySelectorAll('.last-win-container, .total-bet-container').forEach(el => {
        el.style.border = `0.15vw solid ${ELEMENT_CATEGORIES.CONTROLS.color}`;
        el.setAttribute('data-debug-category', 'CONTROLS');
        el.setAttribute('data-debug-id', generateElementId(el));
        el.setAttribute('data-debug-number', elementCounter);
        addNumberLabel(el, elementCounter, ELEMENT_CATEGORIES.CONTROLS.color);
        elementCounter++;
    });
    
    // Popup elements (Orange borders for visibility)
    document.querySelectorAll('.popup-overlay, .popup-container, .autoplay-background, .bonus-buy-background, .confirmation-background, .popup-content, .autoplay-options, .bonus-buy-popup, .confirmation-popup, .popup-button, .close-button').forEach(el => {
        el.style.border = `0.2vw solid #FF8C00`;
        el.setAttribute('data-debug-category', 'POPUPS');
        el.setAttribute('data-debug-id', generateElementId(el));
        el.setAttribute('data-debug-number', elementCounter);
        addNumberLabel(el, elementCounter, '#FF8C00');
        elementCounter++;
    });
}

// Add center dots to all elements
function addCenterDots() {
    document.querySelectorAll('[data-debug-category]').forEach(el => {
        const dot = document.createElement('div');
        dot.className = 'debug-center-dot';
        dot.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 0.5vw;
            height: 0.5vw;
            background: #FFFF00;
            border: 0.1vw solid #000000;
            border-radius: 50%;
            z-index: 10000;
            pointer-events: none;
        `;
        
        // Ensure parent has relative positioning for absolute dot placement
        if (getComputedStyle(el).position === 'static') {
            el.style.position = 'relative';
        }
        
        el.appendChild(dot);
    });
}

// Add numbered label to element
function addNumberLabel(element, number, color) {
    const label = document.createElement('div');
    label.className = 'debug-number-label';
    label.textContent = number;
    label.style.cssText = `
        position: absolute;
        top: -1vw;
        left: -1vw;
        width: 2vw;
        height: 2vw;
        background: ${color};
        color: white;
        border: 0.2vw solid black;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-size: 1vw;
        font-weight: bold;
        z-index: 15000;
        pointer-events: none;
    `;
    
    // Ensure parent has relative positioning for absolute label placement
    if (getComputedStyle(element).position === 'static') {
        element.style.position = 'relative';
    }
    
    element.appendChild(label);
}

// Remove all element borders
function removeElementBorders() {
    document.querySelectorAll('[data-debug-category]').forEach(el => {
        el.style.border = '';
        el.removeAttribute('data-debug-category');
        el.removeAttribute('data-debug-id');
        el.removeAttribute('data-debug-number');
    });
}

// Remove all center dots and number labels
function removeCenterDots() {
    document.querySelectorAll('.debug-center-dot').forEach(dot => {
        dot.remove();
    });
    document.querySelectorAll('.debug-number-label').forEach(label => {
        label.remove();
    });
}

// Generate unique element ID for communication
function generateElementId(element) {
    const className = element.className.split(' ')[0] || 'element';
    const index = Array.from(document.querySelectorAll(`.${className}`)).indexOf(element) + 1;
    return `${className}_${index}`;
}

// Show element information overlay
function showElementInfo() {
    const infoPanel = document.createElement('div');
    infoPanel.id = 'debug-info-panel';
    infoPanel.style.cssText = `
        position: fixed;
        top: 1vh;
        right: 1vw;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 1vw;
        border-radius: 0.5vw;
        font-family: monospace;
        font-size: 1.2vw;
        z-index: 20000;
        max-width: 25vw;
    `;
    
    infoPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 0.5vh;">🎨 Visual Debug Active</div>
        <div style="font-size: 1vw;">
            <div style="color: ${ELEMENT_CATEGORIES.BUTTONS.color};">🔴 Red: Buttons</div>
            <div style="color: ${ELEMENT_CATEGORIES.SYMBOLS.color};">🟢 Green: Symbols</div>
            <div style="color: ${ELEMENT_CATEGORIES.CONTAINERS.color};">🔵 Blue: Containers</div>
            <div style="color: ${ELEMENT_CATEGORIES.TEXT.color};">🟣 Magenta: Text</div>
            <div style="color: ${ELEMENT_CATEGORIES.CONTROLS.color};">🔵 Cyan: Controls</div>
            <div style="color: ${ELEMENT_CATEGORIES.POPUPS.color};">🟠 Orange: Popups</div>
        </div>
        <div style="margin-top: 1vh; font-size: 0.9vw; color: #FFFF00;">
            💡 Yellow dots mark element centers<br>
            🔢 Numbered circles identify each element<br>
            🖱️ Click elements to log their info<br>
            🎨 Click the button (top-left) to toggle
        </div>
    `;
    
    document.body.appendChild(infoPanel);
    
    // Add click handlers for element identification
    document.addEventListener('click', handleElementClick);
}

// Hide element information overlay
function hideElementInfo() {
    const infoPanel = document.getElementById('debug-info-panel');
    if (infoPanel) infoPanel.remove();
    
    document.removeEventListener('click', handleElementClick);
}

// Handle element clicks for identification
function handleElementClick(e) {
    if (!visualDebugActive) return;
    
    const element = e.target.closest('[data-debug-category]');
    if (!element) return;
    
    const category = element.getAttribute('data-debug-category');
    const id = element.getAttribute('data-debug-id');
    const number = element.getAttribute('data-debug-number');
    const rect = element.getBoundingClientRect();
    
    console.log('🎯 Element Clicked:');
    console.log(`   NUMBER: ${number}`);
    console.log(`   Category: ${ELEMENT_CATEGORIES[category].name}`);
    console.log(`   ID: ${id}`);
    console.log(`   Position: ${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}`);
    console.log(`   Size: ${rect.width.toFixed(1)} x ${rect.height.toFixed(1)}`);
    console.log(`   Element:`, element);
    
    // Briefly highlight the clicked element
    const originalBorder = element.style.border;
    element.style.border = `0.4vw solid #FFFF00`;
    setTimeout(() => {
        element.style.border = originalBorder;
    }, 1000);
    
    e.stopPropagation();
}

// Initialize visual debug when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (MASTER_DEBUG && DEBUG_CONFIG.VISUAL_DEBUG) {
        initVisualDebug();
    }
});

// ==========================================
// CRITICAL: Spacebar Hold Glitch Prevention
// ==========================================
let spacebarPressed = false;
let spacebarCooldown = false;

// Christmas symbol mappings (using ACTUAL assets from your folder)
const SYMBOL_IMAGES = {
    'L1': './assets/J.png',          // Low symbols - card values
    'L2': './assets/Q.png', 
    'L3': './assets/K.png',
    'L4': './assets/A.png',
    'L5': './assets/10.png',
    'H1': './assets/Sock.png',       // High symbols - Christmas items
    'H2': './assets/Cookies.png',
    'H3': './assets/Candles.png',
    'H4': './assets/Bells.png',
    'H5': './assets/Wreath.png',
    'S': './assets/Scatter.png',     // Scatter symbol
    'W': './assets/Wild.png'         // Wild symbol
};

// Blurred symbol images for spinning animation (following example pattern)
const SYMBOL_IMAGES_BLURRED = {
    'L1': './assets/Blurred J.png',
    'L2': './assets/Blurred Q.png',
    'L3': './assets/Blurred K.png', 
    'L4': './assets/Blurred A.png',
    'L5': './assets/Blurred 10.png',
    'H1': './assets/Blurred Sock.png',
    'H2': './assets/Blurred Cookies.png',
    'H3': './assets/Blurred Candles.png',
    'H4': './assets/Blurred Bells.png',
    'H5': './assets/Blurred Wreath.png',
    'S': './assets/Blurred Scatter.png',
    'W': './assets/Blurred Wild.png'
};

// Symbol animation frame counts (verified from assets)
const SYMBOL_ANIMATION_FRAMES = {
    'L1': 16, 'L2': 16, 'L3': 16, 'L4': 16, 'L5': 16,  // Low symbols: 16 frames
    'H1': 24, 'H2': 24, 'H3': 24, 'H4': 24, 'H5': 24, // High symbols: 24 frames
    'W': 24,   // Wild: 24 frames
    'S': 24    // Scatter: 24 frames
};

// Symbol animation paths
const SYMBOL_ANIMATIONS = {
    'L1': './assets/Animations/J/',
    'L2': './assets/Animations/Q/',
    'L3': './assets/Animations/K/',
    'L4': './assets/Animations/A/',
    'L5': './assets/Animations/10/',
    'H1': './assets/Animations/Sock/',
    'H2': './assets/Animations/Cookies/',
    'H3': './assets/Animations/Candles/',
    'H4': './assets/Animations/Bells/',
    'H5': './assets/Animations/Wreath/',
    'W': './assets/Animations/Wild/',
    'S': './assets/Animations/Scatter/'
};

// ==========================================
// UI Blocking Functions - Prevent interaction during bonus
// ==========================================
function disableBonusButtons() {
    debugLog('UI', '🔒 Disabling UI buttons during bonus');
    const spinBtn = document.getElementById('spin-button');
    const autoPlayBtn = document.getElementById('autoplay-button');
    const bonusBuyBtn = document.getElementById('bonus-buy-button');
    const betControls = document.querySelectorAll('#bet-minus, #bet-plus, #total-bet-button');
    
    // Disable main buttons (except bonus button which becomes counter)
    [spinBtn, autoPlayBtn].forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        }
    });
    
    // Handle bonus button specially - keep normal appearance but disable clicks
    if (bonusBuyBtn) {
        bonusBuyBtn.disabled = true;
        bonusBuyBtn.style.pointerEvents = 'none';
        // Keep normal opacity - don't grey it out
        updateBonusButtonAsCounter();
    }
    
    // Disable bet controls
    betControls.forEach(control => {
        if (control) {
            control.disabled = true;
            control.style.opacity = '0.5';
            control.style.pointerEvents = 'none';
        }
    });
}

function enableBonusButtons() {
    debugLog('UI', '🔓 Re-enabling UI buttons after bonus');
    const spinBtn = document.getElementById('spin-button');
    const autoPlayBtn = document.getElementById('autoplay-button');
    const bonusBuyBtn = document.getElementById('bonus-buy-button');
    const betControls = document.querySelectorAll('#bet-minus, #bet-plus, #total-bet-button');
    
    // Re-enable main buttons
    [spinBtn, autoPlayBtn, bonusBuyBtn].forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    });
    
    // Restore bonus button text
    if (bonusBuyBtn) {
        const buttonText = bonusBuyBtn.querySelector('.button-text');
        if (buttonText) {
            buttonText.textContent = 'BONUS';
        }
    }
    
    // Re-enable bet controls
    betControls.forEach(control => {
        if (control) {
            control.disabled = false;
            control.style.opacity = '1';
            control.style.pointerEvents = 'auto';
        }
    });
}

// Game State Management (Following Example Pattern)
let gameState = {
    balance: { amount: 0, currency: "EUR" },
    config: null,
    sessionID: null,
    rgsUrl: null,
    currentRound: null,
    isSpinning: false,
    currentBet: 1000000, // €1.00 in RGS format
    lastWin: 0,
    isAnimating: false,
    animationSkipped: false,
    lines: 20,
    board: null,
    displayedBoard: null, // What frontend is actually showing (for win verification)
    turboMode: false,
    anticipation: [0, 0, 0, 0, 0], // Scatter anticipation array for reel delays
    currentGameType: 'basegame', // Track current reel type: 'basegame' (BR0) or 'freegame' (FR0)
    autoPlay: {
        active: false,
        spinsRemaining: 0,
        totalSpins: 0,
        infinite: false,
        stopOnBonus: false
    },
    // Replay mode properties
    isReplayMode: false,
    replayParams: {
        game: null,
        version: null,
        mode: null,
        event: null,
        rgsUrl: null,
        currency: null,
        amount: null,
        lang: null,
        device: null,
        social: null
    },
    replayData: null
};

// Bonus game state management
let bonusGameState = {
    isInBonusMode: false,
    bonusSpinsRemaining: 0,
    totalBonusSpins: 0,
    currentSpinNumber: 0,
    bonusWinnings: 0,
    scatterPositions: [],
    bonusType: null // 'freespins', 'bonus', etc.
};

// RGS Integration Functions (Following Example Pattern)

// Centralized API call function (matches example implementation)
async function apiCall(endpoint, data) {
    if (MASTER_DEBUG) {
        console.log('🎯 === API CALL INTERCEPTED ===');
        console.log('🎯 Endpoint:', endpoint);
        console.log('🎯 Data:', data);
    }
    
    try {
        const response = await fetch(`${gameState.rgsUrl}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (MASTER_DEBUG) {
            console.log('🎯 === API RESPONSE RECEIVED ===');
            console.log('🎯 Response for', endpoint + ':');
            console.log('🎯 Full result:', result);
        }
        if (result.round) {
            if (MASTER_DEBUG) {
                console.log('🎯 EVENT ID CHECK - result.round.id:', result.round.id);
                console.log('🎯 EVENT ID CHECK - result.round.eventId:', result.round.eventId);
            }
        }
        if (MASTER_DEBUG) {
            console.log('🎯 EVENT ID CHECK - result.eventId:', result.eventId);
            console.log('🎯 EVENT ID CHECK - result.id:', result.id);
        }
        
        if (!response.ok) {
            throw new Error(`API Error: ${result.error || response.statusText}`);
        }
        
        return result;
    } catch (error) {
        console.error('API call failed');
        showError('Unable to connect. Please try again.');
        if (MASTER_DEBUG) {
            console.error('Debug - Error details:', error);
        }
        throw error;
    }
}

function getURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if this is replay mode
    const isReplay = urlParams.get("replay") === "true";
    
    if (isReplay) {
        // Replay mode parameters
        let rgsUrlParam = urlParams.get("rgs_url");
        
        // Ensure rgsUrl has protocol for replay mode
        let rgsUrl;
        if (rgsUrlParam && !rgsUrlParam.startsWith("http://") && !rgsUrlParam.startsWith("https://")) {
            rgsUrl = `https://${rgsUrlParam}`;
        } else {
            rgsUrl = rgsUrlParam;
        }
        
        const eventId = urlParams.get("event");
        console.log('🎯 REPLAY EVENT ID:', eventId);
        
        return {
            isReplay: true,
            replayParams: {
                game: urlParams.get("game"),
                version: urlParams.get("version"),
                mode: urlParams.get("mode"),
                event: eventId,
                rgsUrl: rgsUrl,
                currency: urlParams.get("currency") || "USD",
                amount: parseInt(urlParams.get("amount")) || 1000000, // Default 1.00 USD in micro-cents
                lang: urlParams.get("lang") || "en",
                device: urlParams.get("device") || "desktop",
                social: urlParams.get("social") === "true"
            }
        };
    } else {
        // Normal mode parameters
        const sessionID = urlParams.get("sessionID");
        let rgsUrlParam = urlParams.get("rgs_url") || "https://api.stake-engine.com";
        
        // Ensure rgsUrl has protocol (matching example logic)
        let rgsUrl;
        if (!rgsUrlParam.startsWith("http://") && !rgsUrlParam.startsWith("https://")) {
            rgsUrl = `https://${rgsUrlParam}`;
        } else {
            rgsUrl = rgsUrlParam;
        }
        
        return {
            isReplay: false,
            sessionID: sessionID,
            rgsUrl: rgsUrl,
            lang: urlParams.get('lang') || 'en',
            device: urlParams.get('device') || 'desktop'
        };
    }
}

// Fetch replay data from RGS (GET request, no authentication)
async function fetchReplayData() {
    const { game, version, mode, event, rgsUrl } = gameState.replayParams;
    
    if (MASTER_DEBUG) {
        console.log('🎬 [REPLAY INVESTIGATION] === FETCHING REPLAY DATA ===');
        console.log('🎬 [REPLAY INVESTIGATION] Game ID:', game);
        console.log('🎬 [REPLAY INVESTIGATION] Version:', version);
        console.log('🎬 [REPLAY INVESTIGATION] Mode:', mode);
        console.log('🎬 [REPLAY INVESTIGATION] Event ID (CRITICAL):', event);
        console.log('🎬 [REPLAY INVESTIGATION] RGS URL:', rgsUrl);
    }
    
    // Construct replay endpoint URL
    const url = `${rgsUrl}/bet/replay/${game}/${version}/${mode}/${event}`;
    
    if (MASTER_DEBUG) {
        console.log('🎬 [REPLAY INVESTIGATION] Full URL being called:', url);
        console.log('🎬 [REPLAY INVESTIGATION] Expected URL format: {rgsUrl}/bet/replay/{game}/{version}/{mode}/{event}');
    }
    
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        gameState.replayData = result;
        
        console.log('🎯 RGS PAYOUT:', result.payoutMultiplier + 'x');
        

        

        
        return result;
    } catch (error) {
        console.error('Failed to fetch replay data');
        if (MASTER_DEBUG) {
            console.error('Debug - Error details:', error.message);
        }
        throw error;
    }
}

async function authenticateSession() {
    const params = getURLParams();
    
    // Check if this is replay mode
    if (params.isReplay) {

        
        console.log('🎬 Replay mode detected - skipping authentication');
        gameState.isReplayMode = true;
        gameState.replayParams = params.replayParams;
        gameState.rgsUrl = params.replayParams.rgsUrl;
        
        // Validate required replay parameters
        if (!gameState.replayParams.game || !gameState.replayParams.version || 
            !gameState.replayParams.mode || !gameState.replayParams.event) {
            showError('Error: Missing required replay parameters (game, version, mode, event)');
            return false;
        }
        
        try {
            // Initialize replay mode
            await initReplayMode();
            return true;
        } catch (error) {
            console.error('Replay initialization failed');
            showError('Unable to initialize replay mode. Please try again.');
            if (MASTER_DEBUG) {
                console.error('Debug - Error details:', error.message);
            }
            return false;
        }
    }
    
    // Normal mode authentication
    gameState.sessionID = params.sessionID;
    gameState.rgsUrl = params.rgsUrl;
    
    console.log('Session authentication initialized');
    console.log('RGS connection established');
    
    if (!gameState.sessionID) {
        console.error('❌ No session ID provided');
        showError("Error: No session ID provided");
        return false;
    }

    try {
        console.log("Authenticating session...");
        console.log('Connecting to wallet service');
        
        // Use the centralized apiCall function (matching example)
        const result = await apiCall("/wallet/authenticate", {
            sessionID: gameState.sessionID
        });
        
        // Update game state (matching example pattern)
        gameState.balance = result.balance;
        gameState.config = result.config;
        gameState.currentRound = result.round;
        
        // Set default bet from RGS config
        setDefaultBetAmount(result.config);
        
        // ✅ CRITICAL: Populate bet levels from RGS config (Stake Engine requirement)
        populateBetLevels(result.config);
        
        updateBalanceDisplay();
        
        // Handle any active round from previous session (matching example)
        if (gameState.currentRound && gameState.currentRound.active === true) {
            await handleActiveRound();
        }
        return true;
        
    } catch (error) {
        console.error('Authentication failed');
        showError('Unable to authenticate. Please check your connection and try again.');
        if (MASTER_DEBUG) {
            console.error('Debug - Error details:', error.message);
        }
        return false;
    }
}

async function initReplayMode() {
    console.log('🎬 Initializing replay mode');
    
    try {
        // Fetch replay data from RGS
        await fetchReplayData();
        
        // Add replay mode class to body for CSS styling
        document.body.classList.add('replay-mode');
        
        // Hide UI elements not needed in replay mode
        const elementsToHide = [
            'bonus-buy-button',
            'auto-play-button', 
            'turbo-button',
            'bet-up',
            'bet-down',
            'balance-section',
            'auto-button',
            'autoplay-button'
        ];
        
        // Also hide elements by class
        const classesToHide = [
            'auto-button',
            'autoplay-button'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Hide elements by class
        classesToHide.forEach(className => {
            const elements = document.getElementsByClassName(className);
            for (let element of elements) {
                element.style.display = 'none';
            }
        });
        
        // Set spin button text
        const spinBtn = document.getElementById('spin-button');
        if (spinBtn) {
            spinBtn.textContent = 'START REPLAY';
            spinBtn.disabled = false;
        }
        
        // Set bet amount to replay amount
        gameState.currentBet = gameState.replayParams.amount;
        
        // Set balance display (cosmetic only in replay mode)
        gameState.balance = {
            amount: gameState.replayParams.amount,
            currency: gameState.replayParams.currency
        };
        
        // Update displays with replay values
        updateBetDisplay();
        updateBalanceDisplay();
        
        // Show replay bet info
        updateReplayBetInfo();
        
        // Setup play again button
        setupPlayAgainButton();
        
        console.log('🎬 Replay mode initialization completed successfully');
        
    } catch (error) {
        console.error(`Replay mode initialization failed: ${error.message}`);
        throw error;
    }
}

function setDefaultBetAmount(config) {
    // CRITICAL: All fallbacks must use RGS config (Stefan's requirement)
    let defaultBetAmount = null;
    
    if (config && config.defaultBetLevel) {
        defaultBetAmount = config.defaultBetLevel;
    } else if (config && config.minBet) {
        defaultBetAmount = config.minBet;
    } else if (config && config.betLevels && config.betLevels.length > 0) {
        defaultBetAmount = config.betLevels[0];
    }
    
    if (defaultBetAmount) {
        gameState.currentBet = defaultBetAmount;
        updateBetDisplay();
        populateBetLevels(config);
    }
}

function populateBetLevels(config) {
    console.log('🎰 Populating bet levels from config:', config?.betLevels);
    
    if (!config || !config.betLevels) {
        console.warn('⚠️ No bet levels found in config');
        return;
    }
    
    // Log available bet levels for debugging
    console.log('✅ Available bet levels:', config.betLevels.map(formatCurrency));
    console.log('🎰 Bet levels ready for popup selection');
}

function selectBetLevel(amount) {
    gameState.currentBet = amount;
    updateBetDisplay();
    // Removed updateBonusCostDisplay call
    // Selected bet level updated
}

async function playRound(mode = 'BASE') {
    debugLog('TIMING', '🎰 PLAY ROUND STARTED', { mode, timestamp: Date.now() });
    console.log('🎰 PLAY ROUND STARTED - Mode:', mode);
    
    // CRITICAL: Prevent concurrent spins
    if (gameState.isSpinning || gameState.isAnimating) {
        console.log('❌ SPIN BLOCKED - Already spinning or animating');
        return;
    }
    
    console.log('✅ SPIN ALLOWED - Starting play round');
    
    // Check balance (matching example pattern)
    if (gameState.balance.amount < gameState.currentBet) {
        showError("Insufficient coins for this play!");
        throw new Error("Insufficient funds for spin");
    }
    
    gameState.isSpinning = true;
    gameState.isAnimating = true;
    
    // Multipliers will be cleared when new board is displayed (like symbols)
    console.log('[MULTIPLIER] 🚀 New user spin - multipliers will clear with board display');
    
    updateSpinButton();

    // Start reel spinning animation
    const spinStartTime = Date.now();
    startReelSpinning();

    try {
        // Use centralized apiCall function (matching example)
        const result = await apiCall("/wallet/play", {
            sessionID: gameState.sessionID,
            amount: gameState.currentBet,
            mode: mode
        });
        
        // Ensure minimum spin duration for better feel (like real slot machines)
        const spinDuration = Date.now() - spinStartTime;
        const minimumSpinTime = gameState.turboMode ? 800 : 1500; // 1.5s normal, 0.8s turbo
        
        if (spinDuration < minimumSpinTime) {
            const remainingTime = minimumSpinTime - spinDuration;
            debugLog('GENERAL', `⏱️ Ensuring minimum spin duration: waiting ${remainingTime}ms more`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        console.log(`💸 PRE-SPIN BALANCE: ${formatCurrency(gameState.balance.amount)} (${gameState.balance.amount} micro-cents)`);

        
        // 🎯 EVENT ID LOGGING FOR REPLAY TESTING
        console.log('🎯 === EVENT ID INVESTIGATION ===');
        console.log('🎯 Full RGS result keys:', Object.keys(result));
        if (result.round) {
            console.log('🎯 Round keys:', Object.keys(result.round));
            if (result.round.id) {
                console.log('🎯 REGULAR GAME EVENT ID (round.id):', result.round.id);
            } else if (result.round.eventId) {
                console.log('🎯 REGULAR GAME EVENT ID (round.eventId):', result.round.eventId);
            } else if (result.round.event) {
                console.log('🎯 REGULAR GAME EVENT ID (round.event):', result.round.event);
            } else {
                console.log('⚠️ NO EVENT ID FOUND in round object');
            }
        }
        if (result.eventId) {
            console.log('🎯 REGULAR GAME EVENT ID (result.eventId):', result.eventId);  
        } else if (result.id) {
            console.log('🎯 REGULAR GAME EVENT ID (result.id):', result.id);
        } else if (result.event) {
            console.log('🎯 REGULAR GAME EVENT ID (result.event):', result.event);
        } else {
            console.log('⚠️ NO EVENT ID FOUND in result object');
        }
        console.log('🎯 ===========================');
        
        if (result.round && MASTER_DEBUG && DEBUG_CONFIG.RGS) {
            console.log('[RGS] 🎯 Round Analysis:');
            console.log(`   Active: ${result.round.active}`);
            console.log(`   Payout: ${result.round.payout}`);
            console.log(`   PayoutMultiplier: ${result.round.payoutMultiplier}`);
            console.log(`   State Events: ${result.round.state ? result.round.state.length : 'none'}`);
        }
        

        

        
        // Update game state (matching example pattern)
        const oldBalance = gameState.balance.amount;
        gameState.balance = result.balance;
        gameState.currentRound = result.round;
        
        updateBalanceDisplay();
        
        // DEBUG: Log balance update result

        
        // Process events
        if (result.round && result.round.state) {
            const events = result.round.state;
            
            // Get the first reveal for initial board setup
            const initialReveal = events.find(event => event.type === "reveal");
            if (initialReveal && initialReveal.board) {
                debugLog('SYMBOLS', '=== SYMBOL VERIFICATION ===');
                debugLog('SYMBOLS', 'Math Engine Board:', initialReveal.board);
                
                if (MASTER_DEBUG && DEBUG_CONFIG.SYMBOLS) {

                    initialReveal.board.forEach((reel, reelIndex) => {
                        console.log(`   Reel ${reelIndex}: [${reel.map(sym => sym.symbol || sym).join(', ')}]`);
                        reel.forEach((symbol, symbolIndex) => {
                            const symName = symbol.symbol || symbol;
                            console.log(`     Position ${reelIndex}-${symbolIndex}: ${symName}`);
                        });
                    });
                }
                
                await stopReelSpinning(initialReveal.board);
                gameState.board = initialReveal.board;
                displayBoard(initialReveal.board);
                
                // Multipliers will be added during individual reel stops
                
                debugLog('SYMBOLS', '✅ Reels stopped - verifying our display matches math engine...');
            } else {
                debugLog('SYMBOLS', '⚠️ No board data from math engine - using fallback symbols');
                await stopReelSpinning(); // Fallback without board data
            }
            
            // Process events with bonus grouping (like example game)
            debugLog('EVENTS', '=== EVENT PROCESSING ===');
            debugLog('EVENTS', `📝 Processing ${events.length} events from RGS`);
            
            // Group events into base game and individual bonus spins
            const { baseEvents, bonusSpins } = groupBonusEvents(events);
            
            // Process base game events first
            debugLog('EVENTS', '🎯 Processing base game events');
            for (const event of baseEvents) {
                // Skip events that will be handled by bonus processing
                if (bonusSpins.length > 0 && (event.type === 'freeSpinEnd' || event.type === 'finalWin')) {
                    debugLog('EVENTS', `⏭️ Skipping ${event.type} - will be handled by bonus processing`);
                    continue;
                }
                await processEvent(event);
            }
            
            // Process bonus spins sequentially if any exist
            if (bonusSpins.length > 0) {
                debugLog('EVENTS', `🎰 Starting ${bonusSpins.length} bonus spins`);
                
                for (let i = 0; i < bonusSpins.length; i++) {
                    const spinEvents = bonusSpins[i];
                    await processSingleBonusSpin(spinEvents, i + 1, bonusSpins.length);
                    
                    // Small delay between bonus spins for better UX (match example game)
                    if (i < bonusSpins.length - 1) {
                        await sleep(500); // Match example game timing
                    }
                }
                
                debugLog('EVENTS', '🎉 All bonus spins complete!');
            }
            
            // Process final bonus events
            if (baseEvents.some(event => event.type === 'freeSpinTrigger')) {
                await processFinalBonusEvents(baseEvents);
            }
        }
        
        // Handle active rounds with payout verification
        if (result.round && result.round.active === true) {
            debugLog('RGS', '=== ACTIVE ROUND ANALYSIS ===');
            debugLog('RGS', `🔄 Round Active: ${result.round.active}`);
            debugLog('RGS', `💰 Round Payout: ${result.round.payout}`);
            debugLog('RGS', `🎲 PayoutMultiplier: ${result.round.payoutMultiplier}`);
            

            
            if (result.round.payout && result.round.payoutMultiplier && MASTER_DEBUG && DEBUG_CONFIG.RGS) {
                const calculatedPayout = result.round.payoutMultiplier * gameState.currentBet;
                console.log('[RGS] 🧮 Payout Verification:');
                console.log(`   PayoutMultiplier: ${result.round.payoutMultiplier}`);
                console.log(`   Current Bet: ${gameState.currentBet} micro-cents`);
                console.log(`   Calculated Payout: ${calculatedPayout} micro-cents`);
                console.log(`   RGS Payout: ${result.round.payout} micro-cents`);
                console.log(`   Match: ${calculatedPayout === result.round.payout ? '✅' : '❌'}`);
            }
            
            // End round if there's a payout
            if (result.round.payout && result.round.payout > 0) {
                debugLog('RGS', `💰 Ending round with payout: ${formatCurrency(result.round.payout)}`);
                await endRound();
            }
        }
        
        // Final balance verification
        console.log('💰 FINAL BALANCE VERIFICATION:');
        console.log(`   Current balance: ${formatCurrency(gameState.balance.amount)} (${gameState.balance.amount} micro-cents)`);
        console.log(`   Last win: ${formatCurrency(gameState.lastWin)} (${gameState.lastWin} micro-cents)`);
        if (gameState.currentRound) {
            console.log(`   Round payout: ${formatCurrency(gameState.currentRound.payout)} (${gameState.currentRound.payout} micro-cents)`);
        }
        
    } catch (error) {
        console.error('💥 PLAY ROUND ERROR:', error.message);
        showError('Play failed. Please try again.');
    } finally {
        debugLog('TIMING', '🏁 PLAY ROUND COMPLETED', { timestamp: Date.now() });
        gameState.isSpinning = false;
        gameState.isAnimating = false;
        updateSpinButton();
        
        // Multipliers will clear when next board is displayed (like symbols do)
        // No premature clearing based on win/non-win status
        
        // Continue AutoPlay if active
        if (gameState.autoPlay && gameState.autoPlay.active) {
            handleAutoPlayContinuation();
        }
    }
}

// Replay a round using cached event data (no RGS calls)
async function replayRound() {
    if (!gameState.replayData) {
        showError('No replay data available');
        return;
    }
    
    const spinBtn = document.getElementById('spin-button');
    spinBtn.disabled = true;
    spinBtn.textContent = 'PLAYING...';
    
    gameState.isSpinning = true;
    gameState.isAnimating = true;
    
    try {
        // Construct simulated result from cached replay data
        const baseBet = gameState.replayParams.amount; // Amount is already in micro-cents
        const costMultiplier = gameState.replayData.costMultiplier || 1;
        const actualBetCost = baseBet * costMultiplier;
        const calculatedPayout = gameState.replayData.payoutMultiplier * baseBet / 1000000;
        
        console.log('🎬 [REPLAY DEBUG] === REPLAY ROUND CALCULATION ===');
        console.log('🎬 [REPLAY DEBUG] Base bet (micro-cents):', baseBet);
        console.log('🎬 [REPLAY DEBUG] Cost multiplier:', costMultiplier);
        console.log('🎬 [REPLAY DEBUG] Actual bet cost:', actualBetCost);
        console.log('🎬 [REPLAY DEBUG] Payout multiplier:', gameState.replayData.payoutMultiplier);
        console.log('🎬 [REPLAY DEBUG] Calculated payout (currency units):', calculatedPayout);
        
        const result = {
            round: {
                state: gameState.replayData.state,
                payout: calculatedPayout,
                active: false
            },
            balance: {
                amount: actualBetCost,
                currency: gameState.replayParams.currency || 'USD'
            }
        };
        
        console.log('🎬 [REPLAY DEBUG] Final result object:', JSON.stringify(result, null, 2));
        
        gameState.balance = result.balance;
        gameState.currentRound = result.round;
        
        // Initialize reel spinning animation
        try {
            await startReelSpinning();
            // Small delay to show spinning before reveal
            await new Promise(resolve => setTimeout(resolve, gameState.turboMode ? 500 : 1000));
        } catch (error) {
            console.error('Error starting reel spin in replay:', error);
        }
        
        // Stop reels and display the board from reveal event
        const revealEvent = result.round.state.find(e => e.type === 'reveal');
        if (revealEvent && revealEvent.board) {
            try {
                gameState.board = revealEvent.board;
                await stopReelSpinning(revealEvent.board);
                displayBoard(revealEvent.board);
                await new Promise(resolve => setTimeout(resolve, gameState.turboMode ? 300 : 600));
            } catch (error) {
                console.error('Error processing reveal event in replay:', error);
                // Continue with basic board display
                gameState.board = revealEvent.board;
                displayBoard(revealEvent.board);
            }
        }
        
        // Check for bonus trigger in replay data
        const hasBonusTrigger = result.round.state.some(e => e.type === 'freeSpinTrigger');
        
        if (hasBonusTrigger) {
            try {
                // Group events and process bonus spins
                const { baseEvents, bonusSpins } = groupBonusEvents(result.round.state);
                
                // Process base events first
                console.log('🎬 [REPLAY DEBUG] Processing base events:', baseEvents.length);
                for (const event of baseEvents) {
                    if (event.type !== 'reveal') { // Skip reveal since we handled it above
                        console.log('🎬 [REPLAY DEBUG] Processing base event:', event.type, event);
                        await processEvent(event);
                    } else {
                        console.log('🎬 [REPLAY DEBUG] Skipping reveal event (already processed)');
                    }
                }
                
                // Process bonus spins
                for (let i = 0; i < bonusSpins.length; i++) {
                    const spinEvents = bonusSpins[i];
                    await processSingleBonusSpin(spinEvents, i + 1, bonusSpins.length);
                    if (i < bonusSpins.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                
                // Process final bonus events
                await processFinalBonusEvents(baseEvents);
            } catch (error) {
                console.error('Error processing bonus events in replay:', error);
            }
        } else {
            try {
                // Process regular base game events (skip reveal since we handled it)
                console.log('🎬 [REPLAY DEBUG] Processing base game events:', result.round.state.length);
                for (const event of result.round.state) {
                    if (event.type !== 'reveal') {
                        console.log('🎬 [REPLAY DEBUG] Processing event:', event.type, event);
                        await processEvent(event);
                    } else {
                        console.log('🎬 [REPLAY DEBUG] Skipping reveal event (already processed)');
                    }
                }
            } catch (error) {
                console.error('Error processing game events in replay:', error);
            }
        }
        
        // Update last win
        console.log('🎬 [REPLAY DEBUG] === WIN UPDATE ===');
        console.log('🎬 [REPLAY DEBUG] Previous lastWin:', gameState.lastWin);
        console.log('🎬 [REPLAY DEBUG] New lastWin from result.round.payout:', result.round.payout);
        
        gameState.lastWin = result.round.payout || 0;
        
        console.log('🎬 [REPLAY DEBUG] Updated gameState.lastWin:', gameState.lastWin);
        console.log('🎬 [REPLAY DEBUG] Calling updateBalanceDisplay...');
        updateBalanceDisplay();
        
        // Show play again button for base replays
        // For bonus replays, let the bonus summary handle it
        if (!hasBonusTrigger) {
            spinBtn.style.display = 'none';
            const playAgainBtn = document.getElementById('replay-again-button');
            if (playAgainBtn) playAgainBtn.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Replay failed:', error);
        showError(`Replay failed: ${error.message}`);
    } finally {
        gameState.isSpinning = false;
        gameState.isAnimating = false;
        
        // Reset spin button text after replay completes
        if (spinBtn && !spinBtn.style.display === 'none') {
            spinBtn.textContent = 'START REPLAY';
            spinBtn.disabled = false;
        }
    }
}

async function endRound() {
    // Skip API call in replay mode since there's no session
    if (gameState.isReplayMode) {
        // Clean up local game state only
        gameState.isSpinning = false;
        gameState.isAnimating = false;
        return;
    }
    
    try {
        const result = await apiCall("/wallet/end-round", {
            sessionID: gameState.sessionID
        });
        
        // Update game state (matching example)
        gameState.balance = result.balance;
        gameState.currentRound = null;
        
        updateBalanceDisplay();
        
        // Reset to normal play state
        gameState.isSpinning = false;
        gameState.activeWinSequence = false; // Ensure win sequence is reset
        updateSpinButton();
        
    } catch (error) {
        console.error('💥 END ROUND ERROR:', error.message);
        showError('Failed to end round. Please refresh the page.');
    }
}

async function handleActiveRound() {
    const round = gameState.currentRound;
    
    if (round.state) {
        // Process the board reveal
        const revealEvent = round.state.find((event) => event.type === "reveal");
        if (revealEvent && revealEvent.board) {
            displayBoard(revealEvent.board);
            // Multipliers will be added during individual reel stops
        }
        
        // Handle win sequence
        if (round.payout && round.payout > 0) {
            gameState.lastWin = round.payout;
            updateWinDisplay();
            
            setTimeout(async () => {
                await endRound();
            }, 2000);
        } else {
            setTimeout(async () => {
                await endRound();
            }, 1000);
        }
    } else {
        await endRound();
    }
}

async function processEvent(event, eventIndex = 0) {
    debugLog('EVENTS', `🎯 Processing Event ${eventIndex}: ${event.type}`);
    debugLog('EVENTS', '📊 Event Data:', event);
    
    switch (event.type) {
        case 'reveal':
            if (event.board) {
                gameState.board = event.board;
                
                // CRITICAL: Track gameType for proper reel selection (BR0 vs FR0)
                const gameType = event.gameType || 'basegame';
                const previousGameType = gameState.currentGameType;
                gameState.currentGameType = gameType;
                
                debugLog('SYMBOLS', '=== 🎯 REVEAL EVENT ANALYSIS ===');
                debugLog('SYMBOLS', `📊 Previous GameType: ${previousGameType}`);
                debugLog('SYMBOLS', `🎲 New GameType: ${gameType}`);
                debugLog('SYMBOLS', `🎰 Reel Set: ${gameType === 'freegame' ? 'FR0 (Freegame - More Wilds)' : 'BR0 (Basegame - Has Scatters)'}`);
                
                if (previousGameType !== gameType) {
                    // Reel transition detected but no debug output in production
                }
                
                debugLog('SYMBOLS', 'Board Data:', event.board);
                
                // CRITICAL FIX: Actually display the board with correct gameType
                displayBoard(event.board);
                
                // Multipliers will be added during individual reel stops for correct timing
                
                // Handle scatter anticipation for enhanced reel stopping
                if (event.anticipation && Array.isArray(event.anticipation)) {
                    gameState.anticipation = event.anticipation;
                    debugLog('SYMBOLS', 'Anticipation detected:', event.anticipation);
                } else {
                    gameState.anticipation = [0, 0, 0, 0, 0]; // Default no anticipation
                }
            }
            break;
            
        case 'winInfo':
            console.log('🎬 [REPLAY DEBUG] === WIN INFO EVENT DETECTED ===');
            console.log('🎬 [REPLAY DEBUG] Event totalWin:', event.totalWin);
            console.log('🎬 [REPLAY DEBUG] Event wins array:', event.wins);
            console.log('🎬 [REPLAY DEBUG] Current gameState.lastWin:', gameState.lastWin);
            
            if (event.totalWin > 0) {
                console.log(`🎯 EVENT SEQUENCE: WinInfo with ${event.totalWin} cents (${event.wins ? event.wins.length : 0} individual wins)`);
                await processWinInfo(event);
            } else {
                console.log(`🎯 EVENT SEQUENCE: WinInfo with 0 cents (no win this spin)`);
                debugLog('WINS', '💸 WinInfo Event - No win (totalWin: 0)');
                
                // Still track zero-win events for complete picture
                if (gameState.bonusRoundTracking) {
                    gameState.bonusRoundTracking.winInfoEvents.push({
                        totalWin: 0,
                        winsCount: 0,
                        timestamp: new Date().toISOString().slice(11,19)
                    });
                }
            }
            break;
            
        case 'finalWin':
            await processFinalWin(event);
            break;
            
        case 'setWin':
            await processSetWin(event);
            break;
            
        case 'setTotalWin':
            console.log(`🎯 EVENT SEQUENCE: SetTotalWin updating to ${event.amount || 0} cents`);
            await processSetTotalWin(event);
            break;
            
        case 'freeSpinTrigger':
            await processFreeSpinTrigger(event);
            break;
            
        case 'updateFreeSpin':
            await processUpdateFreeSpin(event);
            break;
            
        case 'freeSpinEnd':
            await processFreeSpinEnd(event);
            break;
            
        default:
            debugLog('EVENTS', `⚠️ Unknown event type: ${event.type}`);
            break;
    }
}

// ==========================================
// Win Processing & Verification Functions
// ==========================================

async function processWinInfo(event) {
    console.log('🎬 [REPLAY DEBUG] === PROCESSING WIN INFO ===');
    console.log('🎬 [REPLAY DEBUG] Win event data:', JSON.stringify(event, null, 2));
    console.log('🎬 [REPLAY DEBUG] Win totalWin:', event.totalWin);
    console.log('🎬 [REPLAY DEBUG] Current gameState.lastWin before processing:', gameState.lastWin);
    console.log('🎬 [REPLAY DEBUG] isReplayMode:', gameState.isReplayMode);
    
    originalConsole('🚨 PROCESS WIN INFO CALLED!', event);
    debugLog('TIMING', '💰 WIN PROCESSING STARTED', { timestamp: Date.now() });
    debugLog('WINS', '=== WIN INFO PROCESSING ===');
    debugLog('WINS', 'Raw WinInfo Event:', event);
    debugLog('WINS', `🔢 RGS TotalWin: ${event.totalWin} (RGS format)`);
    
    // Track this winInfo event for bonus verification
    if (gameState.bonusRoundTracking) {
        gameState.bonusRoundTracking.winInfoEvents.push({
            totalWin: event.totalWin,
            winsCount: event.wins ? event.wins.length : 0,
            timestamp: new Date().toISOString().slice(11,19)
        });
        console.log(`📊 BONUS TRACKING - WinInfo #${gameState.bonusRoundTracking.winInfoEvents.length}:`);
        console.log(`   This Spin Win: ${event.totalWin} cents`);
        console.log(`   Individual Wins: ${event.wins ? event.wins.length : 0}`);
        if (event.wins && event.wins.length > 0) {
            const individualWins = event.wins.map(w => w.win || 0);
            console.log(`   Win Breakdown: [${individualWins.join(', ')}] cents`);
        }
    }
    
    // Log clean win summary for payout verification
    logWinSummary(event.wins, event.totalWin, gameState.currentBet);
    
    // CRITICAL: Verify win integrity before processing
    verifyWinIntegrity(event, gameState.displayedBoard);
    
    // Convert RGS cents to micro-cents and apply bet scaling
    const baseBetMicroCents = 1000000; // €1.00 base bet in micro-cents
    const currentBetMicroCents = gameState.currentBet;
    const betScaleFactor = currentBetMicroCents / baseBetMicroCents;
    
    // Bet scaling calculation
    
    // RGS gives cents, convert to micro-cents then scale by bet
    const centToMicroCents = event.totalWin * 10000;
    const displayAmount = centToMicroCents * betScaleFactor;
    
    // Clean conversion without verbose logging
    
    // Don't update display here - let handleWinSequence do it
    // Use new win animation system (this will update gameState.lastWin and display)
    await handleWinSequence(displayAmount, event);
}

async function processFinalWin(event) {
    debugLog('WINS', '=== FINAL WIN PROCESSING ===');
    debugLog('WINS', 'FinalWin Event:', event);
    
    if (event.amount && MASTER_DEBUG && DEBUG_CONFIG.WINS) {
        const baseBetMicroCents = 1000000;
        const currentBetMicroCents = gameState.currentBet;
        const betScaleFactor = currentBetMicroCents / baseBetMicroCents;
        const centToMicroCents = event.amount * 10000;
        const displayAmount = centToMicroCents * betScaleFactor;
        
        console.log(`[WINS] 💰 Final Win Conversion: ${event.amount} cents → ${displayAmount} micro-cents = ${formatCurrency(displayAmount)}`);
    }
    debugLog('TIMING', '✅ WIN PROCESSING COMPLETE', { timestamp: Date.now() });
}

async function processSetWin(event) {
    debugLog('WINS', '=== SET WIN PROCESSING ===');
    debugLog('WINS', 'SetWin Event:', event);
    
    // Skip setWin processing - it duplicates winInfo and causes double popups
    // winInfo already handles the win sequence properly
    if (bonusGameState.isInBonusMode) {
        debugLog('WINS', 'Skipping setWin during bonus mode (winInfo already processed)');
        return;
    }
    
    if (event.amount > 0) {
        if (MASTER_DEBUG && DEBUG_CONFIG.WINS) {
            console.log(`[WINS] 💰 SetWin: ${event.amount} micro-cents = ${formatCurrency(event.amount)}`);
        }
        
        // Skip win sequence - winInfo already handled this
        debugLog('WINS', 'Skipping setWin win sequence (winInfo already processed this win)');
    }
}

async function processSetTotalWin(event) {
    logTiming('EVENT', 'START', 'setTotalWin');
    debugLog('WINS', '=== SET TOTAL WIN PROCESSING ===');
    debugLog('WINS', 'SetTotalWin Event:', event);
    
    if (event.amount && event.amount > 0) {
        // Track setTotalWin for bonus verification
        if (gameState.bonusRoundTracking) {
            gameState.bonusRoundTracking.setTotalWinEvents.push({
                amount: event.amount,
                timestamp: new Date().toISOString().slice(11,19)
            });
            
            console.log(`📊 BONUS TRACKING - SetTotalWin #${gameState.bonusRoundTracking.setTotalWinEvents.length}:`);
            console.log(`   Running Total: ${event.amount} cents`);
            
            // Calculate expected total from winInfo events
            const winInfoTotal = gameState.bonusRoundTracking.winInfoEvents.reduce((sum, w) => sum + w.totalWin, 0);
            console.log(`   WinInfo Sum: ${winInfoTotal} cents`);
            console.log(`   Difference: ${event.amount - winInfoTotal} cents ${event.amount === winInfoTotal ? '✅ MATCH' : '⚠️ MISMATCH'}`);
        }
        
        const baseBetMicroCents = 1000000;
        const currentBetMicroCents = gameState.currentBet;
        const betScaleFactor = currentBetMicroCents / baseBetMicroCents;
        const centToMicroCents = event.amount * 10000;
        const displayAmount = centToMicroCents * betScaleFactor;
        
        console.log(`[WINS] 💰 Total Win Conversion: ${event.amount} cents → ${displayAmount} micro-cents = ${formatCurrency(displayAmount)}`);
        
        // Calculate bet multiplier for debugging
        const betMultiplier = displayAmount / gameState.currentBet;
        console.log(`[WINS] 📊 Bet Multiplier: ${formatCurrency(displayAmount)} ÷ ${formatCurrency(gameState.currentBet)} = ${betMultiplier.toFixed(2)}x bet`);
        
        // Check if we already processed a winInfo event for this amount
        const alreadyProcessed = gameState.lastWin === displayAmount;
        
        if (alreadyProcessed) {
            console.log(`[WINS] ⏭️  Win already processed by winInfo event - skipping duplicate processing`);
        } else {
            console.log(`[WINS] 🚨 MISSING winInfo EVENT - Processing win without detailed breakdown`);
            console.log(`[WINS] 💰 Win Amount: ${formatCurrency(displayAmount)} (${displayAmount} micro-cents)`);
            
            // Update game state  
            gameState.lastWin = displayAmount;
            updateWinDisplay();
            
            // NO POPUP HERE - Only winInfo should create popups with proper bet multiplier logic
            console.log(`[WINS] 💡 Win popup will be handled by winInfo event (bet multiplier-based)`);
            
            // Note: Balance update will happen when round ends with payout
            console.log(`[WINS] 💡 Balance will be updated when round ends (RGS handles balance)`);
        }
    }
    
    logTiming('EVENT', 'END', 'setTotalWin');
}

// ==========================================
// Win Summary System (for payout verification)
// ==========================================
function logWinSummary(wins, totalWin, bet) {
    // Always log wins using original console (bypass production override)
    originalConsole('🔔 WIN SUMMARY FUNCTION CALLED!', {wins, totalWin, bet});
    
    if (!wins || wins.length === 0) {
        originalConsole('⚠️ No wins to display');
        return;
    }
    
    originalConsole(`🎰 === WIN SUMMARY ===`);
    originalConsole(`💰 Total Win: $${(totalWin / 100).toFixed(2)} (${totalWin} cents)`);
    originalConsole(`🎲 Bet: $${(bet / 1000000).toFixed(2)} (${bet} micro-cents = ${(bet/10000).toFixed(0)} cents)`);
    
    // Calculate multiplier using cents for both
    const betInCents = bet / 10000; // Convert micro-cents to cents
    const multiplier = betInCents > 0 ? (totalWin / betInCents).toFixed(2) : '0';
    originalConsole(`📊 Multiplier: ${multiplier}x`);
    originalConsole(``);
    
    wins.forEach((win, index) => {
        // Raw win data for debugging
        originalConsole(`=== WIN ${index + 1} ANALYSIS ===`);
        originalConsole(`Raw Win Object:`, win);
        
        const symbolName = getSymbolName(win.symbol);
        const symbolCode = win.symbol;
        const count = win.positions ? win.positions.length : 'unknown';
        
        // Show exact positions
        let positionDetails = '';
        if (win.positions && Array.isArray(win.positions)) {
            const posStrings = win.positions.map(pos => {
                if (Array.isArray(pos) && pos.length >= 2) {
                    return `${pos[0]}-${pos[1]}`;
                } else if (typeof pos === 'object') {
                    const reel = pos.reel || pos.x || '?';
                    const row = pos.row || pos.y || '?';
                    return `${reel}-${row}`;
                }
                return JSON.stringify(pos);
            });
            positionDetails = ` at positions [${posStrings.join(', ')}]`;
        }
        
        // Try different possible payout properties
        const payout = win.payout || win.win || win.amount || 0;
        
        const betInCents = bet / 10000; // Convert micro-cents to cents
        const multiplier = betInCents > 0 ? (payout / betInCents).toFixed(2) : '0';
        
        originalConsole(`Symbol: ${symbolName} (${symbolCode}) x${count}${positionDetails}`);
        originalConsole(`Payout: ${payout} cents = ${multiplier}x bet`);
        originalConsole(`Win Properties:`, Object.keys(win));
        originalConsole(`---`);
    });
    originalConsole(`🎰 ==================`);
}

function getSymbolName(symbol) {
    const symbolNames = {
        'H1': '🧦 Sock',
        'H2': '🎄 Tree', 
        'H3': '🎁 Present',
        'H4': '⭐ Star',
        'H5': '🔔 Bell',
        'L1': '🃏 J',
        'L2': '🃏 Q', 
        'L3': '🃏 K',
        'L4': '🃏 A',
        'L5': '🃏 10',
        'W': '🎅 Wild',
        'S': '💀 Scatter'
    };
    return symbolNames[symbol] || symbol;
}

// ==========================================
// Bonus Event Processing Functions
// ==========================================

// Group bonus events into individual spin sequences (like example game)
function groupBonusEvents(events) {
    debugLog('EVENTS', '🎰 Grouping bonus events into individual spins');
    
    const baseEvents = [];
    const bonusSpins = [];
    let currentSpin = [];
    let inBonusMode = false;
    
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        if (event.type === 'freeSpinTrigger') {
            inBonusMode = true;
            baseEvents.push(event);
            continue;
        }
        
        if (!inBonusMode) {
            baseEvents.push(event);
            continue;
        }
        
        // We're in bonus mode - group events by spin
        currentSpin.push(event);
        
        // End of spin is marked by updateFreeSpin or freeSpinEnd
        if (event.type === 'updateFreeSpin' || event.type === 'freeSpinEnd') {
            bonusSpins.push([...currentSpin]);
            currentSpin = [];
            
            // If this is freeSpinEnd, we're done with bonus
            if (event.type === 'freeSpinEnd') {
                inBonusMode = false;
            }
        }
    }
    
    debugLog('EVENTS', `🎰 Grouped into ${baseEvents.length} base events and ${bonusSpins.length} bonus spins`);
    return { baseEvents, bonusSpins };
}

// Process a single bonus spin with full animation cycle
async function processSingleBonusSpin(spinEvents, spinNumber, totalSpins) {
    debugLog('EVENTS', `🎰 Processing bonus spin ${spinNumber}/${totalSpins}`);
    
    // Update bonus spin counter UI
    updateFreeSpinCounter(spinNumber, totalSpins);
    
    // Find the reveal event for this spin
    const revealEvent = spinEvents.find(event => event.type === 'reveal');
    if (!revealEvent || !revealEvent.board) {
        debugLog('EVENTS', '⚠️ Bonus spin has no reveal event - skipping');
        return;
    }
    
    // Start reel spinning animation
    debugLog('EVENTS', '🎬 Starting bonus spin reel animation');
    startReelSpinning();
    
    // Wait for spinning animation (same timing as example game)
    await sleep(gameState.turboMode ? 1000 : 2000);
    
    // Stop reels with bonus board data
    debugLog('EVENTS', '🛑 Stopping reels with bonus spin result');
    gameState.board = revealEvent.board;
    await stopReelSpinning(revealEvent.board);
    
    // CRITICAL FIX: Process the reveal event properly to update gameType and display board
    debugLog('EVENTS', '🎯 Processing reveal event to update board display and gameType');
    await processEvent(revealEvent);
    
    // Multipliers will be added during individual reel stops
    
    // Process other events in this spin and check for wins
    let hasWins = false;
    for (const event of spinEvents) {
        if (event.type !== 'reveal') {
            if (event.type === 'winInfo' || (event.type === 'setWin' && event.amount > 0)) {
                hasWins = true;
            }
            await processEvent(event);
        }
    }
    
    // Conditional timing: short delay for no wins, proper timing for wins
    if (hasWins) {
        debugLog('EVENTS', `⏳ Win detected - waiting for win processing to complete...`);
        await sleep(500); // Reduced delay for win processing
    } else {
        debugLog('EVENTS', `⚡ No wins - brief pause before next spin...`);
        await sleep(200); // Short delay for no-win spins
    }
    
    debugLog('EVENTS', `✅ Bonus spin ${spinNumber}/${totalSpins} complete`);
}

// Process free spin trigger event
async function processFreeSpinTrigger(event) {
    debugLog('EVENTS', '🎪 Processing free spin trigger:', event);
    
    bonusGameState.isInBonusMode = true;
    bonusGameState.bonusSpinsRemaining = event.totalFs || 0;
    bonusGameState.totalBonusSpins = event.totalFs || 0;
    bonusGameState.currentSpinNumber = 0;
    bonusGameState.scatterPositions = event.positions || [];
    bonusGameState.bonusType = 'freespins';
    
    // Block UI during bonus
    disableBonusButtons();
    
    // Show spin counter
    showFreeSpinCounter(bonusGameState.totalBonusSpins);
    
    // Stop AutoPlay during bonus games (like example game)
    if (gameState.autoPlay.active && gameState.autoPlay.stopOnBonus) {
        stopAutoPlay();
        if (MASTER_DEBUG) {
            console.log('[AUTOPLAY] Stopped due to bonus game trigger');
        }
    }
    
    // Animate scatter symbols that triggered the bonus BEFORE showing popup
    if (event.positions && event.positions.length > 0) {
        debugLog('EVENTS', `🎯 Animating ${event.positions.length} scatter symbols before bonus popup`);
        await highlightWinningSymbols({
            type: 'scatterTrigger',
            positions: event.positions,
            amount: 0,  // No win amount for scatter triggers
            isScatterTrigger: true
        });
        
        // Wait additional time for scatter animations to be fully appreciated
        debugLog('EVENTS', '⏳ Allowing extra time for scatter animation appreciation...');
        await sleep(1000); // Increased to 1000ms for better scatter appreciation
    }
    
    // Show bonus popup immediately (transition removed)
    await showBonusTriggerPopup(event.totalFs);
}

// Process update free spin event
async function processUpdateFreeSpin(event) {
    debugLog('EVENTS', '🔄 Processing free spin update:', event);
    
    // Check for retrigger (total spins increased)
    if (event.total && event.total > bonusGameState.totalBonusSpins) {
        const additionalSpins = event.total - bonusGameState.totalBonusSpins;
        debugLog('EVENTS', `🎊 RETRIGGER! +${additionalSpins} spins`);
        
        bonusGameState.totalBonusSpins = event.total;
        bonusGameState.bonusSpinsRemaining = event.total - (event.amount || 0);
        
        // Update counter immediately with new total
        updateFreeSpinCounter();
        
        // For retriggering, no transition needed - just show popup
        await showBonusTriggerPopup(additionalSpins, true); // Direct call like example game
        // No additional wait - popup handles all timing (4 seconds total)
    }
    
    // Update current spin number
    if (event.amount !== undefined) {
        bonusGameState.currentSpinNumber = event.amount + 1;
        bonusGameState.bonusSpinsRemaining = (event.total || bonusGameState.totalBonusSpins) - bonusGameState.currentSpinNumber;
        
        // Update spin counter display
        updateFreeSpinCounter();
    }
}

// Process free spin end event
async function processFreeSpinEnd(event) {
    debugLog('EVENTS', '🏁 Processing free spin end:', event);
    
    // Will show summary in processFinalBonusEvents
}

// Process final bonus events (finalWin, bonus summary)
async function processFinalBonusEvents(baseEvents) {
    debugLog('EVENTS', '🎉 Processing final bonus events');
    
    for (const event of baseEvents) {
        if (event.type === 'finalWin') {
            debugLog('EVENTS', 'Found finalWin event after bonus:', event);
            
            // Calculate total bonus winnings
            const baseBetMicroCents = 1000000;
            const currentBetMicroCents = gameState.currentBet;
            const betScaleFactor = currentBetMicroCents / baseBetMicroCents;
            const centToMicroCents = event.amount * 10000;
            const totalBonusWin = centToMicroCents * betScaleFactor;
            
            bonusGameState.bonusWinnings = totalBonusWin;
            
            // Show bonus summary popup
            await showBonusSummaryPopup(totalBonusWin, bonusGameState.totalBonusSpins);
            
            // Reset bonus state
            resetBonusState();
            break;
        }
    }
}

// Reset bonus state
function resetBonusState() {
    bonusGameState.isInBonusMode = false;
    bonusGameState.bonusSpinsRemaining = 0;
    bonusGameState.totalBonusSpins = 0;
    bonusGameState.currentSpinNumber = 0;
    bonusGameState.bonusWinnings = 0;
    bonusGameState.scatterPositions = [];
    bonusGameState.bonusType = null;
    
    // Hide bonus UI
    hideFreeSpinCounter();
    
    // Re-enable UI after bonus
    enableBonusButtons();
}

// ==========================================
// Symbol Verification Functions
// ==========================================

function verifySymbolDisplay(mathBoard, displayBoard) {
    debugLog('SYMBOLS', '=== 🔍 GAMETYPE-AWARE SYMBOL VERIFICATION ===');
    
    // Handle new displayBoard structure with gameType context
    let actualDisplayBoard, displayGameType;
    if (displayBoard && typeof displayBoard === 'object' && displayBoard.board) {
        actualDisplayBoard = displayBoard.board;
        displayGameType = displayBoard.gameType || 'basegame';
        // Display GameType detected from board structure
    } else {
        actualDisplayBoard = displayBoard;
        displayGameType = gameState.currentGameType || 'basegame';
        // Using fallback GameType
    }
    
    debugLog('SYMBOLS', 'Math Board:', mathBoard);
    debugLog('SYMBOLS', 'Actual Display Board:', actualDisplayBoard);
    
    let matches = true;
    let mismatchDetails = [];
    
    for (let reel = 0; reel < mathBoard.length; reel++) {
        for (let pos = 0; pos < mathBoard[reel].length; pos++) {
            const mathSymbol = mathBoard[reel][pos]?.symbol || mathBoard[reel][pos];
            const displaySymbol = actualDisplayBoard?.[reel]?.[pos]?.symbol || actualDisplayBoard?.[reel]?.[pos];
            
            if (mathSymbol !== displaySymbol) {
                matches = false;
                const mismatch = `${reel}-${pos}: Math='${mathSymbol}' Display='${displaySymbol}'`;
                mismatchDetails.push(mismatch);
                // Mismatch detected
            } else {
                debugLog('SYMBOLS', `✅ Match at ${reel}-${pos}: '${mathSymbol}'`);
            }
        }
    }
    
    if (!matches) {
        // Symbol mismatches detected in production
    }
    
    return matches;
}

// UI Update Functions

function updateBalanceDisplay() {
    console.log('🎬 [REPLAY DEBUG] === UPDATE BALANCE DISPLAY ===');
    console.log('🎬 [REPLAY DEBUG] gameState.balance:', gameState.balance);
    console.log('🎬 [REPLAY DEBUG] gameState.lastWin:', gameState.lastWin);
    console.log('🎬 [REPLAY DEBUG] isReplayMode:', gameState.isReplayMode);
    
    if (gameState.balance && gameState.balance.amount !== undefined) {
        const balanceDisplay = document.getElementById('balance-display');
        if (balanceDisplay) {
            balanceDisplay.textContent = formatCurrency(gameState.balance.amount);
            console.log(`💰 BALANCE UPDATE: ${formatCurrency(gameState.balance.amount)} (${gameState.balance.amount} micro-cents)`);
        }
    } else {
        console.log('⚠️ BALANCE ERROR: gameState.balance is missing or invalid');
    }
}

function updateBetDisplay() {
    const betDisplay = document.getElementById('bet-display');
    if (betDisplay) {
        betDisplay.textContent = formatCurrency(gameState.currentBet);
    }
    
    // Also update bonus cost displays when bet changes
    updateBonusCostDisplay();
}

function updateWinDisplay() {
    const winDisplay = document.getElementById('win-display');
    if (winDisplay) {
        const winAmount = gameState.lastWin || 0;
        winDisplay.textContent = formatCurrency(winAmount);
    }
}



function formatCurrency(amount) {
    // Convert RGS format to display format (1,000,000 = 1.00 in most currencies)
    const baseAmount = amount / 1000000;
    
    // Get currency from gameState.balance, fallback to EUR if not available
    const currency = gameState.balance?.currency || 'EUR';
    
    // Official Stake Engine currency specification
    const CurrencyMeta = {
        USD: { symbol: '$', decimals: 2 },
        CAD: { symbol: 'CA$', decimals: 2 },
        JPY: { symbol: '¥', decimals: 0 },
        EUR: { symbol: '€', decimals: 2 },
        RUB: { symbol: '₽', decimals: 2 },
        CNY: { symbol: 'CN¥', decimals: 2 },
        PHP: { symbol: '₱', decimals: 2 },
        INR: { symbol: '₹', decimals: 2 },
        IDR: { symbol: 'Rp', decimals: 0 },
        KRW: { symbol: '₩', decimals: 0 },
        BRL: { symbol: 'R$', decimals: 2 },
        MXN: { symbol: 'MX$', decimals: 2 },
        DKK: { symbol: 'KR', decimals: 2, symbolAfter: true },
        PLN: { symbol: 'zl', decimals: 2, symbolAfter: true },
        VND: { symbol: '₫', decimals: 0, symbolAfter: true },
        TRY: { symbol: '₺', decimals: 2 },
        CLP: { symbol: 'CLP', decimals: 0, symbolAfter: true },
        ARS: { symbol: 'ARS', decimals: 2, symbolAfter: true },
        PEN: { symbol: 'S/', decimals: 2 },
        XGC: { symbol: 'GC', decimals: 2, symbolAfter: true },
        XSC: { symbol: 'SC', decimals: 2, symbolAfter: true }
    };
    
    // Get currency metadata, fallback to currency code if unknown
    const meta = CurrencyMeta[currency] || { 
        symbol: currency, 
        decimals: 2, 
        symbolAfter: true 
    };
    
    // Format amount with correct decimal places
    const formattedAmount = baseAmount.toFixed(meta.decimals);
    
    // Return with correct symbol placement
    if (meta.symbolAfter) {
        return `${formattedAmount} ${meta.symbol}`;
    } else {
        return `${meta.symbol}${formattedAmount}`;
    }
}

// Bet Control Functions with Comprehensive Protection
function increaseBet() {
    // Comprehensive state validation
    if (gameState.isSpinning || gameState.isAnimating) {
        console.warn('⚠️ Cannot change bet while spinning/animating');
        return;
    }
    
    if (gameState.autoPlay && gameState.autoPlay.active) {
        console.warn('⚠️ Cannot change bet during autoplay');
        return;
    }
    
    const config = gameState.config;
    if (!config || !config.betLevels) {
        console.warn('⚠️ Config or betLevels not available');
        return;
    }
    
    const currentIndex = config.betLevels.indexOf(gameState.currentBet);
    if (currentIndex < config.betLevels.length - 1) {
        gameState.currentBet = config.betLevels[currentIndex + 1];
        updateBetDisplay();
        // Removed updateBonusCostDisplay call
        // Bet increased
    } else {
        // At maximum bet level
    }
}

function decreaseBet() {
    // Comprehensive state validation
    if (gameState.isSpinning || gameState.isAnimating) {
        console.warn('⚠️ Cannot change bet while spinning/animating');
        return;
    }
    
    if (gameState.autoPlay && gameState.autoPlay.active) {
        console.warn('⚠️ Cannot change bet during autoplay');
        return;
    }
    
    const config = gameState.config;
    if (!config || !config.betLevels) {
        console.warn('⚠️ Config or betLevels not available');
        return;
    }
    
    const currentIndex = config.betLevels.indexOf(gameState.currentBet);
    if (currentIndex > 0) {
        gameState.currentBet = config.betLevels[currentIndex - 1];
        updateBetDisplay();
        updateBonusCostDisplay();
        // Bet decreased
    } else {
        // At minimum bet level
    }
}

// Popup Management Functions
function toggleVolumePopup() {
    console.log('🔊 Volume button clicked!');
    const popup = document.getElementById('volume-popup');
    if (popup) {
        popup.classList.toggle('hidden');
        console.log('✅ Volume popup toggled, hidden class:', popup.classList.contains('hidden'));
    } else {
        console.error('❌ Volume popup not found!');
    }
}

// ==========================================
// Bonus Buy System
// ==========================================

let pendingBonusBuyMode = null; // Store the bonus mode for confirmation

/**
 * Show the bonus buy popup panel
 */
function showBonusBuyPopup() {
    debugLog('GENERAL', '🎪 Bonus buy button clicked - showing bonus panel');
    
    // Update displays before showing popup
    updateBonusCostDisplay();
    
    const popup = document.getElementById('bonus-buy-panel');
    if (popup) {
        popup.style.display = 'flex';
        debugLog('GENERAL', '✅ Bonus buy panel displayed');
    } else {
        debugLog('GENERAL', '❌ Could not find bonus-buy-panel element');
    }
}

/**
 * Hide the bonus buy popup panel
 */
function hideBonusBuyPopup() {
    const popup = document.getElementById('bonus-buy-panel');
    if (popup) {
        popup.style.display = 'none';
        debugLog('GENERAL', '✅ Bonus buy panel hidden');
    }
}

/**
 * Update the bonus cost display based on current bet
 */
function updateBonusCostDisplay() {
    const bonusCostElement = document.getElementById('bonus-cost-display');
    const bonusBetElement = document.getElementById('bonus-bet-display');
    
    if (bonusCostElement) {
        const cost = 100; // 100x multiplier
        const totalCost = gameState.currentBet * cost;
        bonusCostElement.textContent = formatCurrency(totalCost);
    }
    
    if (bonusBetElement) {
        bonusBetElement.textContent = formatCurrency(gameState.currentBet);
    }
}

/**
 * Purchase bonus - shows confirmation popup
 */
async function purchaseBonus(mode) {
    debugLog('GENERAL', `🎰 Purchasing bonus mode: ${mode}`);
    showBonusBuyConfirmation();
}

/**
 * Show the bonus buy confirmation popup
 */
function showBonusBuyConfirmation() {
    debugLog('GENERAL', '🔍 Showing bonus buy confirmation');
    
    const cost = 100; // Fixed cost for the single bonus option
    const totalCost = gameState.currentBet * cost;
    
    // Update the popup with current cost
    const costElement = document.getElementById('bonus-buy-cost');
    if (costElement) {
        costElement.textContent = formatCurrency(totalCost);
    }
    
    // Store the mode for later confirmation
    pendingBonusBuyMode = 'BONUS';
    
    const popup = document.getElementById('bonus-buy-confirmation-popup');
    if (popup) {
        popup.style.display = 'flex';
        debugLog('GENERAL', '💰 Bonus buy confirmation popup displayed');
    } else {
        debugLog('GENERAL', '❌ Could not find bonus-buy-confirmation-popup element');
    }
}

/**
 * Hide the bonus buy confirmation popup
 */
function hideBonusBuyConfirmation() {
    const popup = document.getElementById('bonus-buy-confirmation-popup');
    if (popup) {
        popup.style.display = 'none';
        pendingBonusBuyMode = null; // Clear pending mode
        debugLog('GENERAL', '💰 Bonus buy confirmation popup closed');
    }
}

/**
 * Confirm and execute the bonus purchase
 */
function confirmBonusPurchase() {
    if (pendingBonusBuyMode) {
        // Store the mode before hiding popup (which clears it)
        const mode = pendingBonusBuyMode;
        hideBonusBuyConfirmation();
        hideBonusBuyPopup(); // Also close the original bonus buy menu
        
        // Execute the purchase without browser confirmation dialog
        executeBonusPurchase(mode);
    } else {
        debugLog('GENERAL', '❌ No pending bonus buy mode found');
    }
}

/**
 * Execute bonus purchase without confirmation dialog
 */
async function executeBonusPurchase(mode) {
    console.log('🎯 === BONUS PURCHASE STARTED ===');
    console.log('🎯 Mode:', mode);
    console.log('🎯 executeBonusPurchase() function called');
    
    const cost = 100; // Fixed cost for the single bonus option
    const totalCost = gameState.currentBet * cost;
    
    if (gameState.balance.amount < totalCost) {
        // Show insufficient balance message
        debugLog('GENERAL', '❌ Insufficient balance for bonus purchase');
        alert('Insufficient Balance: You do not have enough balance to purchase this bonus feature.');
        return;
    }
    
        console.log(`💸 PRE-BONUS BALANCE: ${formatCurrency(gameState.balance.amount)} (${gameState.balance.amount} micro-cents)`);
        console.log(`🎪 BONUS COST: ${formatCurrency(totalCost)} (${totalCost} micro-cents)`);
        console.log(`💰 EXPECTED POST-BONUS: ${formatCurrency(gameState.balance.amount - totalCost)} (before any wins)`);
        
        debugLog('GENERAL', `🎪 Purchasing bonus for ${formatCurrency(totalCost)}`);
        
        // Prevent multiple spins during bonus purchase
        if (gameState.isSpinning) {
            debugLog('GENERAL', '⚠️ Cannot purchase bonus while spinning');
            return;
        }
        
        gameState.isSpinning = true;
        
        try {
            debugLog('GENERAL', '🎰 Calling bonus API...');
            debugLog('GENERAL', `🐛 Bonus Purchase API Call:`);
            debugLog('GENERAL', `   Cost multiplier: ${cost}x`);
            debugLog('GENERAL', `   Current bet: ${gameState.currentBet} micro-cents (${formatCurrency(gameState.currentBet)})`);
            debugLog('GENERAL', `   Total cost: ${totalCost} micro-cents (${formatCurrency(totalCost)})`);
            debugLog('GENERAL', `   Sending to RGS: amount=${gameState.currentBet}, mode=${mode}`);
            
            // Call the API directly to get the result for event processing
            console.log('🎯 About to call RGS API for bonus purchase...');
            console.log('🎯 API endpoint: /wallet/play');
            console.log('🎯 Parameters: sessionID=' + gameState.sessionID + ', amount=' + gameState.currentBet + ', mode=' + mode);
            
            const result = await apiCall("/wallet/play", {
                sessionID: gameState.sessionID,
                amount: gameState.currentBet,
                mode: mode
            });
            
            console.log('🎯 === RGS API RESPONSE RECEIVED ===');
            console.log('🎯 Raw result object:', result);
            
            debugLog('GENERAL', '🎯 Bonus API result:', result);
            
            // 🎯 BONUS EVENT ID LOGGING FOR REPLAY TESTING
            console.log('🎯 === BONUS EVENT ID INVESTIGATION ===');
            console.log('🎯 Full BONUS RGS result keys:', Object.keys(result));
            if (result.round) {
                console.log('🎯 Bonus round keys:', Object.keys(result.round));
                if (result.round.id) {
                    console.log('🎯 BONUS EVENT ID (round.id):', result.round.id);
                } else if (result.round.eventId) {
                    console.log('🎯 BONUS EVENT ID (round.eventId):', result.round.eventId);
                } else if (result.round.event) {
                    console.log('🎯 BONUS EVENT ID (round.event):', result.round.event);
                } else {
                    console.log('⚠️ NO EVENT ID FOUND in bonus round object');
                }
            }
            if (result.eventId) {
                console.log('🎯 BONUS EVENT ID (result.eventId):', result.eventId);  
            } else if (result.id) {
                console.log('🎯 BONUS EVENT ID (result.id):', result.id);
            } else if (result.event) {
                console.log('🎯 BONUS EVENT ID (result.event):', result.event);
            } else {
                console.log('⚠️ NO EVENT ID FOUND in bonus result object');
            }
            console.log('🎯 ===============================');
            
            if (result && result.round) {

                console.log(`🎯 BONUS ROUND PAYOUT: ${formatCurrency(result.round.payout)} (${result.round.payout} micro-cents)`);
                console.log(`📊 BONUS BALANCE CHANGE: ${formatCurrency(result.balance.amount - gameState.balance.amount)} micro-cents`);
                
                // Final bonus verification summary
                if (gameState.bonusRoundTracking) {
                    const tracking = gameState.bonusRoundTracking;
                    console.log('\n🎰 ===== BONUS ROUND VERIFICATION SUMMARY =====');
                    console.log(`📈 WinInfo Events: ${tracking.winInfoEvents.length}`);
                    tracking.winInfoEvents.forEach((win, i) => {
                        console.log(`   ${i+1}. ${win.totalWin} cents (${win.winsCount} individual wins) at ${win.timestamp}`);
                    });
                    
                    const totalWinInfo = tracking.winInfoEvents.reduce((sum, w) => sum + w.totalWin, 0);
                    console.log(`📊 Total from WinInfo: ${totalWinInfo} cents`);
                    
                    console.log(`📈 SetTotalWin Events: ${tracking.setTotalWinEvents.length}`);
                    if (tracking.setTotalWinEvents.length > 0) {
                        const finalTotal = tracking.setTotalWinEvents[tracking.setTotalWinEvents.length - 1].amount;
                        console.log(`🎯 Final SetTotalWin: ${finalTotal} cents`);
                        console.log(`✅ Verification: ${totalWinInfo === finalTotal ? 'PASS' : 'FAIL'} (${totalWinInfo} === ${finalTotal})`);
                    }
                    
                    // Convert to display currency for final check
                    const payoutCents = Math.round(result.round.payout / 10000);
                    console.log(`💰 RGS Payout: ${payoutCents} cents`);

                    console.log('🎰 ============================================\n');
                    
                    // Clear tracking for next bonus
                    gameState.bonusRoundTracking = null;
                }
                
                // Process the bonus buy result through the same system as natural bonuses
                gameState.currentRound = result.round;
                gameState.balance = result.balance;
                
                // Update balance display
                updateBalanceDisplay();            debugLog('BONUS BUY', '💰 Bonus purchase complete - processing through existing bonus system');
            debugLog('BONUS BUY', '=== MATH SOURCE TRACKING ===');
            debugLog('BONUS BUY', `📚 Math source: BONUS MODE (books_bonus.jsonl.zst) - cost: 100x`);
            debugLog('BONUS BUY', `🎯 RGS round mode: ${result.round.mode || 'unknown'}`);
            debugLog('BONUS BUY', `💰 RGS round payout: ${formatCurrency(result.round.payout)}`);
            debugLog('BONUS BUY', `🎲 PayoutMultiplier: ${result.round.payoutMultiplier}`);
            
            // Process the bonus buy events with proper spinning animation
            if (result.round && result.round.state) {
                const events = result.round.state;
                
                // Get the first reveal for animation
                const initialReveal = events.find(event => event.type === "reveal");
                if (initialReveal && initialReveal.board) {
                    debugLog('BONUS BUY', '🎰 Starting bonus buy reveal with spinning animation');
                    
                    // Store board for reveal
                    gameState.board = initialReveal.board;
                    
                    // Start spinning animation (like example game)
                    gameState.isSpinning = true;
                    gameState.isAnimating = true;
                    updateSpinButton();
                    startReelSpinning();
                    
                    // Wait for spin animation (normal timing)
                    await sleep(gameState.turboMode ? 1000 : 2000);
                    
                    // Stop spinning and reveal results
                    await stopReelSpinning(initialReveal.board);
                    
                    // Clean up spinning state
                    gameState.isSpinning = false;
                    gameState.isAnimating = false;
                    updateSpinButton();
                } else {
                    debugLog('BONUS BUY', '⚠️ No board data from bonus math - using fallback');
                    await stopReelSpinning(); // Fallback without board data
                }
                
                // Process events with bonus grouping (same as natural bonus)
                debugLog('BONUS BUY', '=== EVENT PROCESSING ===');
                debugLog('BONUS BUY', `📝 Processing ${events.length} events from BONUS MATH`);
                
                // Group events into base game and individual bonus spins (same logic as natural bonus)
                const { baseEvents, bonusSpins } = groupBonusEvents(events);
                
                debugLog('BONUS BUY', `🎯 Grouped into ${baseEvents.length} base events and ${bonusSpins.length} bonus spins`);
                
                // Process base game events first (same as natural bonus)
                debugLog('BONUS BUY', '🎯 Processing base events from bonus math');
                for (const event of baseEvents) {
                    // Skip events that will be handled by bonus processing
                    if (bonusSpins.length > 0 && (event.type === 'freeSpinEnd' || event.type === 'finalWin')) {
                        debugLog('BONUS BUY', `⏭️ Skipping ${event.type} - will be handled by bonus processing`);
                        continue;
                    }
                    await processEvent(event);
                }
                
                // Process bonus spins sequentially if any exist (same as natural bonus)
                if (bonusSpins.length > 0) {
                    debugLog('BONUS BUY', `🎰 Starting ${bonusSpins.length} bonus spins from bonus math`);
                    
                    for (let i = 0; i < bonusSpins.length; i++) {
                        const spinEvents = bonusSpins[i];
                        await processSingleBonusSpin(spinEvents, i + 1, bonusSpins.length);
                        
                        // Small delay between bonus spins for better UX
                        if (i < bonusSpins.length - 1) {
                            await sleep(500); // Match example game timing
                        }
                    }
                    
                    debugLog('BONUS BUY', '🎉 All bonus spins complete!');
                }
                
                // Process final bonus events (same as natural bonus)
                if (baseEvents.some(event => event.type === 'freeSpinTrigger')) {
                    await processFinalBonusEvents(baseEvents);
                }
            }
            
            // Handle active rounds with payout verification (same as natural bonus)
            if (result.round && result.round.active === true) {
                debugLog('BONUS BUY', '=== ACTIVE ROUND ANALYSIS ===');
                debugLog('BONUS BUY', `🔄 Round Active: ${result.round.active}`);
                debugLog('BONUS BUY', `💰 Round Payout: ${result.round.payout}`);
                debugLog('BONUS BUY', `🎲 PayoutMultiplier: ${result.round.payoutMultiplier}`);
                
                // End round if there's a payout
                if (result.round.payout && result.round.payout > 0) {
                    debugLog('BONUS BUY', `💰 Ending round with payout: ${formatCurrency(result.round.payout)}`);
                    await endRound();
                }
            }
        } else {
            debugLog('GENERAL', '❌ Invalid bonus purchase response');
            gameState.isSpinning = false;
        }
        
    } catch (error) {
        debugLog('GENERAL', '❌ Bonus purchase error:', error);
        gameState.isSpinning = false;
        alert('Bonus purchase failed. Please try again.');
    }
}

// Bet Selection Popup Functions
function showBetSelectionPopup() {
    console.log('🎰 showBetSelectionPopup called!');
    
    // Debug current states
    console.log('Debug states:', {
        bonusGame: bonusGameState.isBonusGame,
        autoPlay: gameState.autoPlay.isActive,
        spinning: gameState.isSpinning,
        hasConfig: !!gameState.config,
        betLevels: gameState.config?.betLevels
    });
    
    // Prevent opening during restricted states
    if (bonusGameState.isBonusGame) {
        console.warn('⚠️ Cannot open bet selection during bonus game');
        return;
    }
    
    if (gameState.autoPlay.isActive) {
        console.warn('⚠️ Cannot open bet selection during autoplay');
        return;
    }
    
    if (gameState.isSpinning) {
        console.warn('⚠️ Cannot open bet selection while spinning');
        return;
    }

    console.log('🎰 Opening bet selection popup...');
    const modal = document.getElementById('bet-selection-modal');
    const grid = document.getElementById('bet-options-grid');
    
    console.log('Elements found:', { modal: !!modal, grid: !!grid });
    
    if (!modal || !grid) {
        console.error('❌ Bet selection elements not found!', { modal, grid });
        return;
    }

    // Clear existing options
    grid.innerHTML = '';
    
    // Check if we have bet levels from RGS config
    if (!gameState.config || !gameState.config.betLevels) {
        console.error('❌ No bet levels found in RGS config!', gameState.config);
        return;
    }
    
    console.log('🎰 Using bet levels from RGS config:', gameState.config.betLevels);
    
    // Populate bet options from RGS config bet levels
    gameState.config.betLevels.forEach(betAmount => {
        const button = document.createElement('button');
        button.className = 'bet-option-button';
        if (betAmount === gameState.currentBet) {
            button.classList.add('current-bet');
        }
        
        button.innerHTML = `
            <img src="./assets/Green Button Normal.png" alt="Bet Option" class="bet-option-bg"
                 onmouseover="this.src='./assets/Green Button Hover.png'"
                 onmouseout="this.src='./assets/Green Button Normal.png'">
            <span class="bet-option-text">${formatCurrency(betAmount)}</span>
        `;
        
        button.onclick = () => {
            simpleAudioManager.playButtonClick();
            selectBetAmount(betAmount);
        };
        grid.appendChild(button);
    });
    
    modal.style.display = 'flex';
    console.log('✅ Bet selection popup displayed');
}

function hideBetSelectionPopup() {
    const modal = document.getElementById('bet-selection-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('🎰 Bet selection popup closed');
    }
}

function selectBetAmount(amount) {
    console.log(`🎰 Selected bet amount: ${formatCurrency(amount)}`);
    
    // Update game state
    gameState.currentBet = amount;
    
    // Update UI display
    updateBetDisplay();
    
    // Close popup
    hideBetSelectionPopup();
    
    // Log the change
    debugLog('BET', `Bet amount changed to: ${formatCurrency(amount)}`);
}

// Make functions globally accessible for onclick handlers
window.confirmBonusPurchase = confirmBonusPurchase;
window.hideBonusBuyConfirmation = hideBonusBuyConfirmation;
window.showBetSelectionPopup = showBetSelectionPopup;
window.hideBetSelectionPopup = hideBetSelectionPopup;
window.selectBetAmount = selectBetAmount;
window.populateBetLevels = populateBetLevels;

// Add CSS for win animations
const winAnimationCSS = `
.winning-symbol {
    animation: winPulse 0.5s ease-in-out infinite alternate;
    filter: brightness(1.3) saturate(1.5);
    transform: scale(1.05);
    box-shadow: 0 0 1.2vw rgba(255, 215, 0, 0.8);
    border: 0.15vw solid #FFD700;
    border-radius: 0.6vw;
    transition: none !important; /* Override any inherited transitions to prevent flashing */
}

.big-win {
    animation: bigWinGlow 0.3s ease-in-out infinite alternate;
    filter: brightness(1.5) saturate(2);
    transform: scale(1.1);
    box-shadow: 0 0 2vw rgba(255, 69, 0, 0.9);
    border: 0.2vw solid #FF4500;
    transition: none !important; /* Override any inherited transitions to prevent flashing */
}

.mega-win {
    animation: megaWinExplosion 0.2s ease-in-out infinite alternate;
    filter: brightness(2) saturate(3);
    transform: scale(1.15);
    box-shadow: 0 0 2.5vw rgba(255, 20, 147, 1);
    border: 0.3vw solid #FF1493;
    transition: none !important; /* Override any inherited transitions to prevent flashing */
}

@keyframes winPulse {
    0% { 
        transform: scale(1.05); 
        filter: brightness(1.3) saturate(1.5);
    }
    100% { 
        transform: scale(1.15); 
        filter: brightness(1.5) saturate(1.8);
    }
}

@keyframes bigWinGlow {
    0% { 
        transform: scale(1.1); 
        box-shadow: 0 0 2vw rgba(255, 69, 0, 0.9);
        filter: brightness(1.5) saturate(2);
    }
    100% { 
        transform: scale(1.2); 
        box-shadow: 0 0 2.5vw rgba(255, 69, 0, 1);
        filter: brightness(1.8) saturate(2.5);
    }
}

@keyframes megaWinExplosion {
    0% { 
        transform: scale(1.15); 
        box-shadow: 0 0 2.5vw rgba(255, 20, 147, 1);
        filter: brightness(2) saturate(3);
    }
    100% { 
        transform: scale(1.25); 
        box-shadow: 0 0 3vw rgba(255, 20, 147, 1.2);
        filter: brightness(2.5) saturate(3.5);
    }
}

/* Themed Win Popup Styles (matching example game) */
.themed-win-popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    background: transparent;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.4s ease-out;
    pointer-events: none;
}

.themed-win-popup.show {
    opacity: 1;
    transform: scale(1);
}

.themed-win-popup.fade-out {
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.5s ease-in;
}

.themed-win-background {
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    width: 80vw;
    height: 60vh;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.mega-win-bg {
    background-image: url('./assets/Mega-Win-Pop-Up.png');
    background-color: #4ECDC4;
    border: 0.4vw solid #FFD700;
    border-radius: 1.5vw;
    box-shadow: 0 0 2.2vw rgba(255, 215, 0, 0.8);
}

.huge-win-bg {
    background-image: url('./assets/Huge-Win-Pop-Up.png');
    background-color: #45B7D1;
    border: 0.4vw solid #FFD700;
    border-radius: 1.5vw;
    box-shadow: 0 0 2.2vw rgba(255, 215, 0, 0.8);
}

.big-win-bg {
    background-image: url('./assets/Big-Win-Pop-Up.png');
    background-color: #96CEB4;
    border: 0.4vw solid #FFD700;
    border-radius: 1.5vw;
    box-shadow: 0 0 2.2vw rgba(255, 215, 0, 0.8);
}

.jackpot-win-bg {
    background-image: url('./assets/Jackpot-Pop-Up.png');
    background-color: #FF6B6B;
    border: 0.4vw solid #FFD700;
    border-radius: 1.5vw;
    box-shadow: 0 0 2.2vw rgba(255, 215, 0, 0.8);
}

.themed-win-content {
    position: relative;
    z-index: 1;
}

.themed-win-amount {
    font-size: 8vw;
    font-weight: bold;
    color: #FFD700;
    text-shadow: 0.25vw 0.25vw 0.5vw rgba(0,0,0,0.8);
    text-align: center;
}
`;

// CSS is injected during DOM initialization

// ==========================================
// Win Animation System
// ==========================================

/**
 * Main win processing with animations
 * Handles win display updates and determines appropriate popup based on win tier
 * @param {number} payoutAmount - Win amount in micro-cents
 * @param {Object} winEvent - Event object containing win information
 */
async function handleWinSequence(payoutAmount, winEvent) {
    debugLog('WINS', '🎉 Handling win sequence:', { amount: payoutAmount, event: winEvent.type });
    
    // Mark win sequence as active to preserve multipliers
    gameState.activeWinSequence = true;
    
    // Update last win amount
    gameState.lastWin = payoutAmount;
    updateWinDisplay();
    
    // Determine win tier and show appropriate popup
    const betMultiplier = payoutAmount / gameState.currentBet;
    
    // Play appropriate win sound based on win size
    if (betMultiplier >= 3) {
        // Big wins (3x+ bet) get random big win SFX
        simpleAudioManager.playRandomBigWinSFX();
    } else {
        // Small wins get standard small win sound
        simpleAudioManager.playSound('./assets/small win sfx.mp3', 1.0);
    }
    
    // Store the win popup promise to await it later
    let winPopupPromise = null;
    
    // For big wins, delay popup until after first animation cycle
    if (betMultiplier >= 3) {
        // Calculate first cycle duration based on turbo mode
        const frameDelay = gameState.turboMode ? 25 : 50;
        const maxFrames = 24; // Assume high-value symbols for big wins
        const firstCycleDuration = maxFrames * frameDelay;
        
        debugLog('WINS', `Delaying big win popup by ${firstCycleDuration}ms (first animation cycle)`);
        
        // Create a promise that resolves with the delayed popup
        winPopupPromise = new Promise((resolve) => {
            setTimeout(() => {
                let popupPromise;
                if (betMultiplier >= 100) {
                    // Jackpot: 100x+ bet
                    popupPromise = showThemedWinPopup(payoutAmount, 'jackpot');
                } else if (betMultiplier >= 25) {
                    // Mega Win: 25x+ bet  
                    popupPromise = showThemedWinPopup(payoutAmount, 'mega');
                } else if (betMultiplier >= 10) {
                    // Huge Win: 10x+ bet
                    popupPromise = showThemedWinPopup(payoutAmount, 'huge');
                } else {
                    // Big Win: 3x+ bet
                    popupPromise = showThemedWinPopup(payoutAmount, 'big');
                }
                // Wait for the popup to complete, then resolve our outer promise
                popupPromise.then(resolve);
            }, firstCycleDuration);
        });
    } else {
        // Small wins: quick flash only
        showSmallWinFlash(payoutAmount);
    }
    
    // Start highlighting winning symbols and show real multipliers concurrently
    const symbolAnimation = highlightWinningSymbols(winEvent);
    
    // Multipliers are already shown when symbols are rendered (from math data)
    
    // Timing based on win size and game mode (runs concurrent with animations)
    const isAutoplay = gameState.autoPlay && gameState.autoPlay.active;
    const isBonusMode = bonusGameState.isInBonusMode;
    
    if (betMultiplier >= 10) {
        // Big wins: longer display (concurrent with animations)
        const bigWinDelay = gameState.turboMode ? (isAutoplay ? 500 : 600) : (isAutoplay ? 800 : 1000);
        debugLog('WINS', `Big win - waiting ${bigWinDelay}ms (concurrent with animations)`);
        await sleep(bigWinDelay);
    } else {
        // Small wins: much shorter delay to match example game timing
        const smallWinDelay = gameState.turboMode ? (isAutoplay ? 50 : 100) : (isAutoplay ? 150 : 300);
        debugLog('WINS', `Small win - waiting ${smallWinDelay}ms (concurrent with animations)`);
        await sleep(smallWinDelay);
    }
    
    // Wait for symbol animation to complete
    await symbolAnimation;
    
    // Wait for win popup to complete if it exists
    if (winPopupPromise) {
        debugLog('WINS', '⏳ Waiting for win popup to complete...');
        await winPopupPromise;
    }
    
    // Additional safety wait to ensure all UI updates complete
    await sleep(100);
    
    // Mark win sequence as complete - now clear multipliers with a short delay
    gameState.activeWinSequence = false;
    
    // Multipliers will stay visible until next board display (like symbols)
    console.log('[MULTIPLIER] 🎉 Win sequence complete - multipliers will clear with next board display');
    
    debugLog('WINS', '✅ Win sequence complete');
}

// Show themed win popup based on win size - returns Promise when complete
function showThemedWinPopup(amount, type) {
    return new Promise((resolve) => {
        // DEBUG: Track who is calling this function
        console.log(`🚨 POPUP CREATION DEBUG: showThemedWinPopup called for ${type} - ${formatCurrency(amount)}`);
        console.log('🚨 POPUP CREATION STACK TRACE:');
        console.trace();
        
        // Check how many popups currently exist
        const existingPopups = document.querySelectorAll('.themed-win-popup');
        console.log(`🚨 EXISTING POPUPS BEFORE CREATION: ${existingPopups.length}`);
        existingPopups.forEach((popup, index) => {
            console.log(`   Popup ${index + 1}:`, popup.className, popup.style.backgroundImage);
        });
        
        debugLog('TIMING', `🏆 BIG WIN POPUP STARTED (${type.toUpperCase()})`, { amount, type, timestamp: Date.now() });
        logTiming('WIN_POPUP', 'START', `${type} - ${formatCurrency(amount)}`);
        
        // Hide any existing popups
        hideAllWinPopups();
    
    let popupImage;
    switch (type) {
        case 'jackpot':
            popupImage = './assets/Jackpot-Pop-Up.png';
            break;
        case 'mega':
            popupImage = './assets/Mega-Win-Pop-Up.png';
            break;
        case 'huge':
            popupImage = './assets/Huge-Win-Pop-Up.png';
            break;
        case 'big':
            popupImage = './assets/Big-Win-Pop-Up.png';
            break;
        default:
            return; // No popup for small wins
    }
    
    // Create overlay to block UI interaction
    const overlay = document.createElement('div');
    overlay.className = 'big-win-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // Create popup element with asset image
    const popup = document.createElement('div');
    popup.className = `themed-win-popup win-size-${type}`;
    popup.style.cssText = `
        background-image: url('${popupImage}');
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    popup.innerHTML = `
        <div class="themed-win-content">
            <div class="themed-win-amount win-text-${type} breathing-text">${formatCurrency(amount)}</div>
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // DEBUG: Confirm what was actually created
    console.log(`🚨 POPUP CREATED: ${type} popup added to DOM`);
    const allPopupsAfter = document.querySelectorAll('.themed-win-popup');
    console.log(`🚨 TOTAL POPUPS AFTER CREATION: ${allPopupsAfter.length}`);
    
    // Animate in
    setTimeout(() => {
        overlay.style.opacity = '1';
        popup.classList.add('show');
        logTiming('WIN_POPUP', 'VISIBLE', `${type} popup shown`);
    }, 50);
    
    // Auto-hide after 4 seconds for screenshot testing
    setTimeout(() => {
        debugLog('TIMING', `⏰ BIG WIN POPUP AUTO-HIDE (${type.toUpperCase()})`, { timestamp: Date.now() });
        popup.classList.add('fade-out');
        overlay.style.opacity = '0';
        logTiming('WIN_POPUP', 'HIDE', `${type} popup fading out`);
        setTimeout(() => {
            if (overlay.parentNode) {
                debugLog('TIMING', `✅ BIG WIN POPUP COMPLETE (${type.toUpperCase()})`, { timestamp: Date.now() });
                overlay.remove();
                logTiming('WIN_POPUP', 'END', `${type} popup removed`);
                resolve(); // ✅ Resolve the Promise when popup auto-hides
            }
        }, 300);
    }, 4000);
    }); // Close Promise wrapper
}

// Global flag to prevent duplicate small win popups
let smallWinPopupActive = false;

/**
 * Focused win verification system - clean output for testing
 * Compares what math says vs what frontend displays
 */
function verifyWinIntegrity(winEvent, displayedBoard) {
    if (!MASTER_DEBUG || !DEBUG_CONFIG.WIN_VERIFY) return;
    
    // Display what math sent (both raw and converted)

    console.log(`   Raw Total Win: ${winEvent.totalWin} (RGS format)`);
    
    // Apply the same conversion logic as processWinInfo
    const baseBetMicroCents = 1000000;
    const currentBetMicroCents = gameState.currentBet;
    const betScaleFactor = currentBetMicroCents / baseBetMicroCents;
    const centToMicroCents = winEvent.totalWin * 10000;
    const convertedTotalWin = centToMicroCents * betScaleFactor;
    
    console.log(`   Converted Total Win: ${formatCurrency(convertedTotalWin)} (bet: ${formatCurrency(currentBetMicroCents)})`);
    
    if (winEvent.wins && winEvent.wins.length > 0) {
        winEvent.wins.forEach((win, index) => {
            const convertedWinAmount = (win.win * 10000) * betScaleFactor;
            console.log(`   Win ${index + 1}: ${win.symbol} x${win.kind} = ${formatCurrency(convertedWinAmount)} (raw: ${win.win}) at positions:`, win.positions);
        });
    }
    
    // Display what frontend is showing - handle new displayedBoard structure
    console.log('🎮 FRONTEND BOARD:');
    
    // Handle new displayedBoard structure with gameType context
    let actualBoard, boardGameType;
    if (displayedBoard && typeof displayedBoard === 'object' && displayedBoard.board) {
        actualBoard = displayedBoard.board;
        boardGameType = displayedBoard.gameType || 'basegame';
        console.log(`🎯 Board GameType: ${boardGameType} (${displayedBoard.reelType})`);
    } else {
        actualBoard = displayedBoard;
        boardGameType = gameState.currentGameType || 'basegame';
        console.log(`🎯 Fallback GameType: ${boardGameType}`);
    }
    
    if (actualBoard) {
        for (let reel = 0; reel < actualBoard.length; reel++) {
            const reelSymbols = actualBoard[reel].map(s => s.name || s).join('-');
            console.log(`   Reel ${reel}: [${reelSymbols}]`);
        }
        
        // Verify win positions match frontend board
        console.log('🔍 WIN POSITION VERIFICATION:');
        if (winEvent.wins && winEvent.wins.length > 0) {
            winEvent.wins.forEach((win, winIndex) => {
                console.log(`   Checking Win ${winIndex + 1} (${win.symbol} x${win.kind}):`);
                let allMatch = true;
                win.positions.forEach((pos, posIndex) => {
                    // Convert RGS 1-based row to frontend 0-based row (math sends 1,2,3 but we use 0,1,2)
                    const frontendRow = pos.row - 1;
                    
                    // Check if position is valid (0-2 for rows in 5x3 grid)
                    if (frontendRow < 0 || frontendRow > 2 || pos.reel < 0 || pos.reel > 4) {
                        console.log(`     Position ${posIndex + 1}: Reel ${pos.reel}, Math Row ${pos.row} (Frontend Row ${frontendRow}) -> INVALID POSITION ❌`);
                        allMatch = false;
                        return;
                    }
                    
                    const frontendSymbol = actualBoard[pos.reel] && actualBoard[pos.reel][frontendRow] ? 
                        (actualBoard[pos.reel][frontendRow].name || actualBoard[pos.reel][frontendRow]) : 'MISSING';
                    
                    // Check for wild substitution (W can substitute for any symbol in a win)
                    const matches = frontendSymbol === win.symbol || frontendSymbol === 'W';
                    const wildNote = frontendSymbol === 'W' ? ' (WILD)' : '';
                    
                    console.log(`     Position ${posIndex + 1}: Reel ${pos.reel}, Math Row ${pos.row} (Frontend Row ${frontendRow}) -> Expected: ${win.symbol}, Got: ${frontendSymbol}${wildNote} ${matches ? '✅' : '❌'}`);
                    if (!matches) allMatch = false;
                });
                console.log(`   Win ${winIndex + 1} Result: ${allMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
            });
        }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

/**
 * Display small win flash popup for wins under 10x bet
 * Creates a centered golden popup that appears briefly without blocking gameplay
 * @param {number} amount - Win amount in micro-cents
 */
function showSmallWinFlash(amount) {
    debugLog('TIMING', '💫 SMALL WIN FLASH STARTED', { amount, timestamp: Date.now() });
    // Prevent duplicate popups
    if (smallWinPopupActive) {
        return;
    }
    
    smallWinPopupActive = true;
    
    // Remove any existing popups first
    const existingPopups = document.querySelectorAll('.small-win-popup');
    existingPopups.forEach(popup => {
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    });
    
    // Create floating win amount popup
    const smallWinPopup = document.createElement('div');
    smallWinPopup.className = 'small-win-popup';
    const formattedAmount = formatCurrency(amount);
    smallWinPopup.innerHTML = `
        <div class="small-win-amount">${formattedAmount}</div>
    `;
    
    // Add to game container
    const gameContainer = document.querySelector('.game-container') || document.body;
    gameContainer.appendChild(smallWinPopup);
    
    // Start animation
    setTimeout(() => {
        smallWinPopup.classList.add('show');
    }, 50);
    
    // Remove after animation completes and reset flag
    setTimeout(() => {
        if (smallWinPopup.parentNode) {
            smallWinPopup.classList.add('fade-out');
            setTimeout(() => {
                if (smallWinPopup.parentNode) {
                    debugLog('TIMING', '✅ SMALL WIN FLASH COMPLETE', { timestamp: Date.now() });
                    smallWinPopup.parentNode.removeChild(smallWinPopup);
                }
                smallWinPopupActive = false;
            }, 300);
        } else {
            smallWinPopupActive = false;
        }
    }, 800); // Shows for 0.8 seconds then fades
}

// Hide all win popups
function hideAllWinPopups() {
    // Clean up ALL popup types IMMEDIATELY (no setTimeout)
    const themedPopups = document.querySelectorAll('.themed-win-popup');
    const overlays = document.querySelectorAll('.big-win-overlay');
    
    console.log(`🧹 CLEANUP: Found ${themedPopups.length} themed popups and ${overlays.length} overlays`);
    
    // Remove themed popups
    themedPopups.forEach((popup, index) => {
        console.log(`🗑️  Removing themed popup ${index + 1}: classes=${popup.className}`);
        if (popup.parentNode) {
            popup.parentNode.removeChild(popup);
        }
    });
    
    // Remove overlays
    overlays.forEach((overlay, index) => {
        console.log(`🗑️  Removing overlay ${index + 1}`);
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
    
    console.log(`🧹 CLEANUP COMPLETE: Removed ${themedPopups.length + overlays.length} total elements`);
}

// Highlight winning symbols with animations
async function highlightWinningSymbols(winEvent) {
    debugLog('TIMING', '✨ SYMBOL ANIMATION STARTED', { winEvent: winEvent?.type, timestamp: Date.now() });
    const winAmount = winEvent?.amount || winEvent?.totalWin || 0;
    debugLog('TIMING', '✨ SYMBOL ANIMATION STARTED', { amount: winAmount, type: winEvent?.type, timestamp: Date.now() });
    logTiming('ANIMATION', 'START', `Symbol highlighting - ${formatCurrency(winAmount)}`);
    debugLog('WINS', '✨ Highlighting winning symbols:', { amount: winAmount, type: winEvent?.type });
    
    // Don't clear previous highlights here - let them persist until next spin starts
    
    // Initialize symbolsToAnimate array for proper scoping
    const symbolsToAnimate = [];
    
    // Highlight if there's a win OR if it's a scatter trigger (which has winAmount = 0)
    if (winEvent && (winAmount > 0 || winEvent.isScatterTrigger)) {
        debugLog('WINS', 'Processing win event for symbol highlighting:', winEvent.type);
        
        let winsToProcess = [];
        
        // Handle different win event types
        if (winEvent.wins && Array.isArray(winEvent.wins)) {
            // Standard winInfo event with detailed win data
            winsToProcess = winEvent.wins;
            debugLog('WINS', `Found ${winsToProcess.length} winning combinations from winInfo`);
        } else if (winEvent.type === 'scatterTrigger' && winEvent.positions) {
            // Scatter trigger event - create win data for animation
            debugLog('WINS', `Processing scatter trigger with ${winEvent.positions.length} scatter positions`);
            winsToProcess = [{
                symbol: 'S',
                positions: winEvent.positions,
                win: 0 // No actual win amount for scatter triggers
            }];
        } else if (winEvent.type === 'setWin' && gameState.board) {
            // setWin event - need to analyze the board for wins
            debugLog('WINS', 'setWin event - analyzing board for winning symbols');
            winsToProcess = analyzeWinningSymbols(gameState.board, winAmount);
        } else {
            debugLog('WINS', 'No detailed win data available - using generic highlight');
            // Generic win highlighting - highlight all high-value symbols
            highlightGenericWin(winAmount);
            return;
        }
        
        // Process each win combination
        winsToProcess.forEach((win, winIndex) => {
            debugLog('WINS', `Win ${winIndex + 1}: ${win.symbol} x${win.kind || win.count} = ${win.win}`);
            
            if (win.positions && Array.isArray(win.positions)) {
                win.positions.forEach(pos => {
                    // Convert RGS 1-based row to frontend 0-based row
                    const frontendRow = pos.row - 1;
                    const symbol = document.querySelector(`[data-pos="${pos.reel}-${frontendRow}"]`);
                    
                    if (symbol) {
                        // Get the actual symbol displayed on frontend (important for wilds!)
                        // Handle new displayedBoard structure
                        let boardData = gameState.displayedBoard;
                        if (boardData && typeof boardData === 'object' && boardData.board) {
                            boardData = boardData.board; // Extract actual board from new structure
                        }
                        
                        const actualSymbol = boardData && 
                                           boardData[pos.reel] && 
                                           boardData[pos.reel][frontendRow] ?
                                           (boardData[pos.reel][frontendRow].name || boardData[pos.reel][frontendRow]) :
                                           win.symbol; // Fallback to expected symbol
                        
                        // Determine animation intensity based on win value (bet multipliers)
                        let winClass = 'winning-symbol';
                        const betMultiplier = win.win / gameState.currentBet;
                        if (betMultiplier >= 10) winClass = 'mega-win'; // 10x+ bet
                        else if (betMultiplier >= 3) winClass = 'big-win'; // 3x+ bet
                        
                        symbol.classList.add(winClass);
                        symbolsToAnimate.push({ element: symbol, symbolName: actualSymbol });
                        
                        debugLog('WINS', `Position ${pos.reel}-${frontendRow}: Expected ${win.symbol}, Animating ${actualSymbol} ${actualSymbol === 'W' ? '(WILD)' : ''}`);
                    }
                });
            }
        });
        
        if (symbolsToAnimate.length > 0) {
            debugLog('WINS', `Starting animations for ${symbolsToAnimate.length} winning symbols`);
            
            // Start animations for all winning symbols with position data
            symbolsToAnimate.forEach(({ element, symbolName }) => {
                const dataPos = element.getAttribute('data-pos');
                if (dataPos) {
                    const [reel, row] = dataPos.split('-').map(Number);
                    startSymbolAnimation(element, symbolName, reel, row);
                } else {
                    startSymbolAnimation(element, symbolName, null, null);
                }
            });
            
            // Calculate wait time for animations (don't block, let them play)
            const frameCount = Math.max(...symbolsToAnimate.map(s => SYMBOL_ANIMATION_FRAMES[s.symbolName] || 24));
            const frameDelay = gameState.turboMode ? 25 : 50;
            const cycles = gameState.turboMode ? 1 : 2;
            const totalAnimationTime = frameCount * frameDelay * cycles;
            
            debugLog('WINS', `Animations started, will complete in ~${totalAnimationTime}ms`);
        } else {
            debugLog('WINS', 'No symbols to animate - using generic highlight');
            highlightGenericWin(winAmount);
        }
    }
    
    // Actually wait for animations to complete before marking as complete
    if (symbolsToAnimate.length > 0) {
        // Calculate dynamic animation duration based on symbols and turbo mode
        const maxFrames = Math.max(...symbolsToAnimate.map(s => SYMBOL_ANIMATION_FRAMES[s.symbolName] || 24));
        const frameDelay = gameState.turboMode ? 25 : 50; // Match example game frame timing
        const cycles = gameState.turboMode ? 1 : 2; // Fewer cycles in turbo mode
        const animationDuration = maxFrames * frameDelay * cycles;
        
        debugLog('WINS', `Waiting ${animationDuration}ms for ${symbolsToAnimate.length} symbol animations to complete...`);
        await sleep(animationDuration);
    } else {
        // No animations to wait for - just a brief pause
        debugLog('WINS', 'No symbol animations - minimal delay');
        await sleep(50);
    }
    
    debugLog('TIMING', '✅ SYMBOL ANIMATION COMPLETE', { timestamp: Date.now() });
    debugLog('WINS', 'Symbol highlighting complete');
}

// Animate a single winning symbol (following example game pattern)
function startSymbolAnimation(element, symbolName, reel, row) {
    const frameCount = SYMBOL_ANIMATION_FRAMES[symbolName] || 24;
    const animationPath = SYMBOL_ANIMATIONS[symbolName];
    
    if (!animationPath) {
        debugLog('WINS', `❌ No animation path for symbol: ${symbolName}`);
        return;
    }
    
    debugLog('WINS', `🎬 Starting animation for ${symbolName} with ${frameCount} frames from: ${animationPath}`);
    
    // Store original symbol name to avoid board data corruption during bonus mode
    element.originalSymbol = symbolName;
    
    // Test if first frame exists
    const testImage = new Image();
    const folderName = animationPath.split('/').filter(p => p).pop();
    const firstFramePath = `${animationPath}${folderName} 01.png`;
    testImage.onload = () => {
        debugLog('WINS', `✅ Animation asset exists: ${firstFramePath}`);
    };
    testImage.onerror = () => {
        debugLog('WINS', `❌ Animation asset NOT FOUND: ${firstFramePath}`);
        debugLog('WINS', `📁 Expected: ${animationPath}${folderName} 01.png (folder: ${folderName})`);
    };
    testImage.src = firstFramePath;
    
    // Clear any existing animation
    if (element.animationInterval) {
        clearInterval(element.animationInterval);
    }
    
    element.classList.add('playing');
    
    let currentFrame = 1;
    const frameDelay = gameState.turboMode ? 25 : 50; // Match example game timing
    const animationCycles = gameState.turboMode ? 1 : 2; // Play twice in normal mode
    let currentCycle = 0;
    
        const animationInterval = setInterval(() => {
            const paddedFrame = String(currentFrame).padStart(2, '0');
            
            // Get the actual folder name from the path (last part before /)
            const folderName = animationPath.split('/').filter(p => p).pop();
            const framePath = `${animationPath}${folderName} ${paddedFrame}.png`;
            
            // Debug: Log the first few frames to see if paths are correct
            if (currentFrame <= 3 || currentFrame === frameCount) {
                debugLog('WINS', `📋 Frame ${currentFrame}/${frameCount}: ${framePath} (folder: ${folderName})`);
            }        element.style.backgroundImage = `url('${framePath}')`;
        element.style.backgroundSize = 'contain';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'center';
        
        currentFrame++;
        
        if (currentFrame > frameCount) {
            currentCycle++;
            
            if (currentCycle >= animationCycles) {
                // Animation complete - but DON'T restore symbol yet!
                // Let the symbol keep the winning highlight and breathing until next spin
                clearInterval(animationInterval);
                element.classList.remove('playing');
                delete element.animationInterval;
                
                // Restore the static symbol using stored original symbol (avoids board data corruption)
                const actualBoardSymbol = element.originalSymbol || symbolName;
                debugLog('WINS', `✅ Frame animation complete for ${symbolName}, restoring original symbol: ${actualBoardSymbol}`);
                
                renderSymbolAsImage(element, actualBoardSymbol, false, reel, row);
                
                // CRITICAL FIX: Recreate multipliers after symbol restoration (since renderSymbolAsImage somehow removes them)
                if (reel !== null && row !== null && gameState.displayedBoard && gameState.displayedBoard.board) {
                    const symbolData = gameState.displayedBoard.board[reel][row];
                    if (symbolData) {

                        addMathMultiplierOverlay(element, symbolData, reel, row);
                    }
                }
            } else {
                // Start next cycle
                debugLog('WINS', `🔄 Starting cycle ${currentCycle + 1}/${animationCycles} for ${symbolName}`);
                
                // MULTIPLIER DEBUG: Check if multipliers survive cycle transition
                const multipliersAtCycleStart = element.querySelectorAll('.multiplier-overlay');

                
                currentFrame = 1;
            }
        }
    }, frameDelay);
    
    // Store interval for cleanup
    element.animationInterval = animationInterval;
    
    // Timeout fallback in case assets don't load properly
    setTimeout(() => {
        if (element.animationInterval === animationInterval) {
            debugLog('WINS', `⏰ Animation timeout for ${symbolName} - may indicate asset loading issues`);
            clearInterval(animationInterval);
            element.classList.remove('playing');
            delete element.animationInterval;
            
            // Still restore symbol using stored original symbol
            const actualBoardSymbol = element.originalSymbol || symbolName;
            renderSymbolAsImage(element, actualBoardSymbol, false, reel, row);
            
            // CRITICAL FIX: Recreate multipliers after symbol restoration (timeout case)
            if (reel !== null && row !== null && gameState.displayedBoard && gameState.displayedBoard.board) {
                const symbolData = gameState.displayedBoard.board[reel][row];
                if (symbolData) {

                    addMathMultiplierOverlay(element, symbolData, reel, row);
                }
            }
        }
    }, 10000); // 10 second timeout
}

// Wrapper for Promise-based animation (backwards compatibility)
async function animateWinningSymbol(element, symbolName) {
    return new Promise((resolve) => {
        // Get position from element
        const dataPos = element.getAttribute('data-pos');
        let reel = null, row = null;
        if (dataPos) {
            [reel, row] = dataPos.split('-').map(Number);
        }
        
        // Start animation
        startSymbolAnimation(element, symbolName, reel, row);
        
        // Resolve after animation should be complete
        const frameCount = SYMBOL_ANIMATION_FRAMES[symbolName] || 24;
        const frameDelay = gameState.turboMode ? 25 : 50;
        const cycles = gameState.turboMode ? 1 : 2;
        const totalTime = frameCount * frameDelay * cycles + 100; // Small buffer
        
        setTimeout(resolve, totalTime);
    });
}

// Stop symbol animation (updated for new animation system)
function stopSymbolAnimation(element) {
    if (element.animationInterval) {
        clearInterval(element.animationInterval);
        delete element.animationInterval;
        element.classList.remove('playing');
    }
    // Legacy support
    if (element.winAnimationInterval) {
        clearInterval(element.winAnimationInterval);
        delete element.winAnimationInterval;
    }
}

// Analyze board for winning symbols when detailed win data isn't available
function analyzeWinningSymbols(board, winAmount) {
    debugLog('WINS', 'Analyzing board for winning combinations');
    const wins = [];
    
    // This is a simplified analysis - in a real game you'd check actual paylines
    // For now, just highlight matching symbols in likely winning positions
    if (board && Array.isArray(board)) {
        // Look for matching symbols across reels (left to right)
        for (let row = 0; row < 3; row++) {
            const symbols = [];
            const positions = [];
            
            for (let reel = 0; reel < 5; reel++) {
                if (board[reel] && board[reel][row]) {
                    const symbol = board[reel][row].symbol || board[reel][row];
                    symbols.push(symbol);
                    positions.push({ reel: reel, row: row + 1 }); // RGS uses 1-based rows
                }
            }
            
            // Check for consecutive matching symbols
            if (symbols.length >= 3) {
                let matchLength = 1;
                const firstSymbol = symbols[0];
                
                for (let i = 1; i < symbols.length; i++) {
                    if (symbols[i] === firstSymbol || symbols[i] === 'W' || firstSymbol === 'W') {
                        matchLength++;
                    } else {
                        break;
                    }
                }
                
                if (matchLength >= 3) {
                    wins.push({
                        symbol: firstSymbol,
                        count: matchLength,
                        win: Math.floor(winAmount / 3), // Distribute win amount
                        positions: positions.slice(0, matchLength)
                    });
                }
            }
        }
    }
    
    return wins;
}

// Generic win highlighting when no specific win data is available
function highlightGenericWin(winAmount) {
    debugLog('WINS', 'Applying generic win highlighting');
    
    // Find all symbols on the board and apply a gentle highlight
    const allSymbols = document.querySelectorAll('.symbol');
    const symbolsToHighlight = Array.from(allSymbols).slice(0, Math.min(5, allSymbols.length));
    
    symbolsToHighlight.forEach((symbol, index) => {
        symbol.classList.add('winning-symbol');
        
        // Get symbol name from data or fallback
        const dataPos = symbol.getAttribute('data-pos');
        let symbolName = 'H1'; // Fallback
        
        if (dataPos && gameState.board) {
            const [reel, row] = dataPos.split('-').map(Number);
            if (gameState.board[reel] && gameState.board[reel][row]) {
                const boardSymbol = gameState.board[reel][row];
                symbolName = typeof boardSymbol === 'string' ? boardSymbol : boardSymbol.symbol;
            }
        }
        
        // Stagger animation start slightly
        setTimeout(() => {
            const [reel, row] = dataPos ? dataPos.split('-').map(Number) : [null, null];
            startSymbolAnimation(symbol, symbolName, reel, row);
        }, index * 100);
    });
}

// ==========================================
// Bonus UI Functions
// ==========================================

// Show bonus trigger popup
async function showBonusTriggerPopup(spinsAwarded, isRetrigger = false) {
    debugLog('EVENTS', `Showing bonus popup: ${spinsAwarded} spins, retrigger: ${isRetrigger}`);
    
    // 🎄 Play Christmas bonus trigger sequence (no fade - immediate)
    // Simplified bonus trigger - just play sound
    simpleAudioManager.playSound('./assets/hohoho merry christmas.mp3', 1.0);
    
    return new Promise((resolve) => {
        // Create popup overlay
        const overlay = document.createElement('div');
        overlay.className = 'bonus-popup-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        // Create popup
        const popup = document.createElement('div');
        popup.className = 'bonus-popup';
        popup.style.cssText = `
            background-image: url('./assets/Free-Spin-Pop-Up.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: 80vw;
            height: 60vh;
            position: relative;
            cursor: pointer;
        `;
        
        // Add text overlay
        const text = document.createElement('div');
        text.innerHTML = isRetrigger 
            ? `<div style="font-size: 4vw; color: #FFD700; text-align: center; margin-top: 20vh; font-weight: bold; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8);">+${spinsAwarded} FREE SPINS!</div>`
            : `<div style="font-size: 12vw; color: #FFD700; text-align: center; margin-top: 12vh; font-weight: bold; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8);">${spinsAwarded}</div>
               <div style="font-size: 3vw; color: #FFF; text-align: center; margin-top: 20vh; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8);">Click to continue</div>`;
        
        popup.appendChild(text);
        overlay.appendChild(popup);
        
        // Function to close popup
        const closePopup = () => {
            debugLog('TIMING', '✅ BONUS POPUP CLICKED', { timestamp: Date.now() });
            
            // 🎄 Start Christmas bonus music when user clicks to continue
            simpleAudioManager.switchBackgroundMusic('./assets/bonus game background music.mp3');
            
            overlay.style.opacity = '0';
            setTimeout(() => {
                debugLog('TIMING', '✅ BONUS POPUP COMPLETE', { timestamp: Date.now() });
                // 🔧 FIX: Check if overlay still exists before removing
                if (overlay && overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
                resolve();
            }, 300);
        };
        
        // Wait for click to continue
        popup.addEventListener('click', closePopup);
        overlay.addEventListener('click', closePopup);
        
        // Auto-continue for retriggers after 2 seconds
        if (isRetrigger) {
            setTimeout(() => {
                closePopup();
            }, 2000);
        }
        
        document.body.appendChild(overlay);
        
        // Fade in
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 50);
    });
}

// Show retrigger popup - removed redundant function, now using direct showBonusTriggerPopup call

// Show bonus summary popup
async function showBonusSummaryPopup(totalWin, totalSpins) {
    debugLog('EVENTS', `Showing bonus summary: ${formatCurrency(totalWin)} in ${totalSpins} spins`);
    
    // 🎄 Start Christmas bonus summary music
    simpleAudioManager.switchBackgroundMusic('./assets/bonus summery music.mp3');
    
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'bonus-summary-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const popup = document.createElement('div');
        popup.className = 'bonus-summary-popup';
        popup.style.cssText = `
            background-image: url('./assets/Message-Pop-Up.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            width: 90vw;
            height: 60vh;
            position: relative;
            cursor: pointer;
        `;
        
        const text = document.createElement('div');
        // Check if mobile for bigger text
        const isMobile = window.innerWidth <= 500 && window.innerHeight >= 560;
        const titleSize = isMobile ? '8vw' : '4vw';
        const amountSize = isMobile ? '10vw' : '5vw';
        const subtextSize = isMobile ? '5vw' : '2.5vw';
        const clickSize = isMobile ? '4vw' : '2vw';
        const topMargin = isMobile ? '20vh' : '15vh';
        
        text.innerHTML = `
            <div style="font-size: ${titleSize}; color: #FFD700; text-align: center; margin-top: ${topMargin}; font-weight: bold; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8); line-height: 0.9;">BONUS<br>COMPLETE!</div>
            <div style="font-size: ${amountSize}; color: #FFD700; text-align: center; margin-top: 3vh; font-weight: bold; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8);">${formatCurrency(totalWin)}</div>
            <div style="font-size: ${subtextSize}; color: #FFF; text-align: center; margin-top: 2vh; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8);">Won in ${totalSpins} free spins</div>
            <div style="font-size: ${clickSize}; color: #CCC; text-align: center; margin-top: 3vh; text-shadow: 0.15vw 0.15vw 0.3vw rgba(0,0,0,0.8);">Click to continue</div>
        `;
        
        popup.appendChild(text);
        overlay.appendChild(popup);
        
        popup.addEventListener('click', () => {
            // 🎄 Return to Christmas base game music when summary is closed
            simpleAudioManager.switchBackgroundMusic('./assets/base game background music.mp3');
            
            overlay.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(overlay);
                resolve();
            }, 300);
        });
        
        document.body.appendChild(overlay);
        
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 50);
    });
}

// Show/update free spin counter (now uses bonus button)
function showFreeSpinCounter(totalSpins) {
    // Hide the old counter if it exists
    hideFreeSpinCounter();
    // Update bonus button to show counter
    updateBonusButtonAsCounter();
}

// Update free spin counter display (now updates bonus button)
function updateFreeSpinCounter() {
    updateBonusButtonAsCounter();
}

// Update bonus button to show spin counter
function updateBonusButtonAsCounter() {
    const bonusBuyBtn = document.getElementById('bonus-buy-button');
    if (bonusBuyBtn && bonusGameState.isInBonusMode) {
        const buttonText = bonusBuyBtn.querySelector('.button-text');
        if (buttonText) {
            buttonText.innerHTML = `
                <div style="font-size: 0.8em; line-height: 1;">SPINS</div>
                <div style="font-size: 1.2em; line-height: 1; margin-top: 0.2em;">${bonusGameState.currentSpinNumber}/${bonusGameState.totalBonusSpins}</div>
            `;
        }
    }
}

// Hide free spin counter
function hideFreeSpinCounter() {
    const counter = document.getElementById('freespin-counter');
    if (counter) {
        counter.style.opacity = '0';
        counter.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (counter.parentNode) {
                counter.parentNode.removeChild(counter);
            }
        }, 300);
    }
}

// Asset Preloading System
async function preloadGameAssets() {
    try {
        // Define critical assets to preload
        const criticalAssets = [
            './assets/GUI Elements/PNG GUI Elements/Green Button Normal.png',
            './assets/GUI Elements/PNG GUI Elements/Green Button Pressed.png',
            './assets/Win Button.png',
            './assets/Settings-Pop-Up.png',
            './assets/Free-Spin-Pop-Up.png',
            './assets/Message-Pop-Up.png'
        ];
        
        // Add all symbol animation frames to preload list
        const animationAssets = [];
        console.log('📦 Generating animation frame list for preloading...');
        
        Object.keys(SYMBOL_ANIMATIONS).forEach(symbolName => {
            const animationPath = SYMBOL_ANIMATIONS[symbolName];
            const frameCount = SYMBOL_ANIMATION_FRAMES[symbolName] || 24;
            const folderName = animationPath.split('/').filter(p => p).pop();
            
            for (let frame = 1; frame <= frameCount; frame++) {
                const paddedFrame = String(frame).padStart(2, '0');
                const framePath = `${animationPath}${folderName} ${paddedFrame}.png`;
                animationAssets.push(framePath);
            }
        });
        
        console.log(`📦 Found ${animationAssets.length} animation frames to preload`);
        
        // Combine critical assets with animation frames
        const allAssets = [...criticalAssets, ...animationAssets];
        
        // Preload each asset
        console.log(`📦 Preloading ${allAssets.length} total assets (${criticalAssets.length} critical + ${animationAssets.length} animation frames)...`);
        
        const loadPromises = allAssets.map(async (assetUrl) => {
            try {
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject();
                    img.src = assetUrl;
                });
            } catch (error) {
                // Asset failed to load, continue
                console.log(`⚠️ Failed to preload: ${assetUrl}`);
            }
        });
        
        // Wait for all assets to load (or fail)
        const results = await Promise.allSettled(loadPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`📦 Preloading complete: ${successful} successful, ${failed} failed`);
        console.log('✨ Animation frames should now play smoothly without flashing!');
        
        return true;
    } catch (error) {
        return false;
    }
}

// Snow Overlay Control - Single Load, No Interruption
let snowVideoInitialized = false;

function showSnowOverlay() {
    const snowOverlay = document.getElementById('snow-overlay');
    
    if (!snowOverlay) {
        return;
    }
    
    // Only initialize once to prevent interruptions
    if (snowVideoInitialized) {
        snowOverlay.style.display = 'block';
        return;
    }
    
    // Mark as initialized to prevent multiple calls
    snowVideoInitialized = true;
    
    // Show the video element
    snowOverlay.style.display = 'block';
    
    // Wait for video to be ready, then play
    const attemptPlay = () => {
        if (snowOverlay.readyState >= 3) { // HAVE_FUTURE_DATA
            snowOverlay.play().catch(() => {});
        } else {
            setTimeout(attemptPlay, 500);
        }
    };
    
    // Start loading and attempt play
    if (snowOverlay.readyState === 0) {
        snowOverlay.load();
    }
    
    setTimeout(attemptPlay, 1000);
}

function hideSnowOverlay() {
    const snowOverlay = document.getElementById('snow-overlay');
    if (snowOverlay) {
        snowOverlay.style.display = 'none';
        snowOverlay.pause();
        console.log('❄️ Snow overlay stopped');
    }
}

// Bonus Transition Control - Fade Effect
async function playBonusTransition() {
    return new Promise((resolve) => {
        const overlay = document.getElementById('bonus-transition-overlay');
        
        if (!overlay) {
            resolve();
            return;
        }
        
        // Show overlay and start fade in
        overlay.style.display = 'block';
        overlay.classList.add('fade-in');
        
        // Wait for fade in to complete, then fade out
        setTimeout(() => {
            overlay.classList.remove('fade-in');
            overlay.classList.add('fade-out');
            
            // Wait for fade out to complete, then hide
            setTimeout(() => {
                overlay.style.display = 'none';
                overlay.classList.remove('fade-out');
                resolve();
            }, 600); // Match CSS transition duration
        }, 1200); // Hold the fade for 1.2 seconds
    });
}

// Utility function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Clear all winning highlights and animations (like example game)
function clearWinningHighlights() {
    debugLog('WINS', '🧹 Clearing all winning highlights and stopping animations');
    
    // Clear from both .symbol and .symbol-display elements
    document.querySelectorAll('.symbol, .symbol-display').forEach(symbol => {
        stopSymbolAnimation(symbol);
        
        // Force remove ALL possible winning classes
        symbol.className = symbol.className
            .replace(/\b(winning|winning-symbol|winning-animated|big-win|mega-win|playing)\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // FIXED: Only clear animation styles that won't affect multiplier overlays
        // Preserve transform, z-index, and positioning styles that multiplier overlays depend on
        symbol.style.cssText = symbol.style.cssText
            .replace(/(filter|box-shadow|border|animation|outline):[^;]*(;|$)/g, '');
        
        // Ensure base symbol class is present  
        if (!symbol.classList.contains('symbol') && !symbol.classList.contains('symbol-display')) {
            symbol.classList.add('symbol-display');
        }
        
        // Clear any stored animation data
        delete symbol.originalSymbol;
    });
    
    debugLog('WINS', '✅ All win highlights and styles cleared (multiplier-safe)');
}

// Helper function to render symbol as image (following example pattern)
function renderSymbolAsImage(element, symbolName, isSpinning = false, reel = -1, position = -1) {
    const imagePath = isSpinning ? SYMBOL_IMAGES_BLURRED[symbolName] : SYMBOL_IMAGES[symbolName];
    

    
    if (!isSpinning) {
        debugLog('SYMBOLS', `🖼️ Rendering symbol '${symbolName}' at ${reel >= 0 ? reel + '-' + position : 'unknown'}: ${imagePath ? 'Image' : 'Text fallback'}`);
    }
    
    if (imagePath) {
        // Clear text content and set background image
        element.textContent = '';
        element.style.backgroundImage = `url('${imagePath}')`;
        element.style.backgroundSize = 'contain';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'center';
        element.classList.add('symbol-image');
        
        // Add spinning visual effects
        if (isSpinning) {
            element.style.transform = 'translateY(-2px)'; // Slight vertical movement during spin
            element.style.opacity = '0.9'; // Slightly transparent during spin
        } else {
            element.style.transform = '';
            element.style.opacity = '1';
        }
    } else {
        // Fallback to text if no image found
        console.log(`No image found for symbol: ${symbolName}, using fallback text`); // Always log missing assets
        element.textContent = symbolName;
        element.style.backgroundImage = '';
        element.classList.remove('symbol-image');
        element.style.transform = '';
        element.style.opacity = '1';
    }
    

}

function displayBoard(boardData) {
    // 🎯 GAMETYPE-AWARE SYMBOL DISPLAY - Core fix for BR0/FR0 reel handling
    
    // Log board state for testing comparison
    if (boardData && boardData.length > 0) {
        console.log('🎲 BOARD:');
        for (let col = 0; col < boardData.length; col++) {
            for (let row = 0; row < boardData[col].length; row++) {
                const symbol = boardData[col][row];
                if (symbol && symbol.name) {
                    console.log(`[${col},${row}]: ${symbol.name}`);
                }
            }
        }
    }
    
    if (!boardData || boardData.length !== 5) return;
    
    // Get current game type for proper reel interpretation
    const gameType = gameState.currentGameType || 'basegame';
    const reelType = gameType === 'freegame' ? 'FR0' : 'BR0';
    
    // Find or create symbol container
    let symbolContainer = document.querySelector('.symbol-container');
    if (!symbolContainer) {
        symbolContainer = document.createElement('div');
        symbolContainer.className = 'symbol-container';
        symbolContainer.style.position = 'absolute';
        symbolContainer.style.top = '0';
        symbolContainer.style.left = '0';
        symbolContainer.style.width = '100%';
        symbolContainer.style.height = '100%';
        symbolContainer.style.zIndex = '10';
        document.querySelector('.slot-machine').appendChild(symbolContainer);
    }
    
    // Clear existing symbols and their child multipliers
    const existingMultipliers = symbolContainer.querySelectorAll('.multiplier-overlay');
    console.log(`[MULTIPLIER] 📦 Clearing symbol container - found ${existingMultipliers.length} multipliers to remove`);
    
    // Also clear any multipliers that might be outside the container
    const allMultipliers = document.querySelectorAll('.multiplier-overlay');
    console.log(`[MULTIPLIER] 🌍 Found ${allMultipliers.length} total multipliers on page before clearing`);
    
    symbolContainer.innerHTML = '';
    
    // Clean up any orphaned multipliers that weren't inside symbol container
    const remainingMultipliers = document.querySelectorAll('.multiplier-overlay');
    if (remainingMultipliers.length > 0) {
        console.log(`[MULTIPLIER] 🧹 Cleaning up ${remainingMultipliers.length} orphaned multipliers`);
        remainingMultipliers.forEach(mult => mult.remove());
    }
    
    // Store board for win verification WITH gameType context
    gameState.displayedBoard = {
        board: boardData,
        gameType: gameType,
        reelType: reelType
    };
    
    // Create symbol displays centered over each reel background
    for (let reel = 0; reel < 5; reel++) {
        const reelData = boardData[reel];
        if (!reelData || reelData.length !== 3) continue;
        
        for (let row = 0; row < 3; row++) {
            const symbolData = reelData[row];
            let symbolName = symbolData.name || symbolData; // Handle both object and string formats
            
            // Rendering symbol
            
            if (SYMBOL_IMAGES[symbolName]) {
                const symbolElement = document.createElement('div');
                symbolElement.className = 'symbol-display symbol'; // Add 'symbol' class for multiplier detection
                symbolElement.setAttribute('data-pos', `${reel}-${row}`);
                symbolElement.setAttribute('data-reel', reel);
                symbolElement.setAttribute('data-row', row);
                symbolElement.style.position = 'absolute';
                symbolElement.style.width = '10vw';  // Bigger symbols
                symbolElement.style.height = '16vh'; // Bigger symbols
                symbolElement.style.zIndex = '10';
                
                // Mobile vs Desktop positioning - match CSS media query
                const isMobile = window.innerWidth <= 500 && window.innerHeight >= 560;
                let symbolLeft, symbolTop;
                
                if (isMobile) {
                    // Mobile: Use static grid positions - MATCH CSS EXACTLY
                    const mobilePositions = {
                        0: { left: 9.5, positions: [8, 21, 34] },    // Reel 0 - moved 0.5vw more right, match CSS 9.5vw, lower positions
                        1: { left: 26.5, positions: [8, 21, 34] },   // Reel 1 - moved 1.5vw right, match CSS 26.5vw, lower positions
                        2: { left: 42, positions: [8, 21, 34] },     // Reel 2 - anchor position, match CSS 42vw, lower positions
                        3: { left: 59, positions: [8, 21, 34] },     // Reel 3 - 2vw gap layout, match CSS 59vw, lower positions
                        4: { left: 75.75, positions: [8, 21, 34] }   // Reel 4 - moved 0.25vw left, match CSS 75.75vw, lower positions
                    };
                    
                    symbolLeft = mobilePositions[reel].left;
                    symbolTop = mobilePositions[reel].positions[row];
                    
                    // Adjust symbol size for mobile - match CSS exactly
                    symbolElement.style.width = '15vw';
                    symbolElement.style.height = '12vw';
                } else {
                    // Desktop: Use frame-based positioning
                    const frameImages = document.querySelectorAll('.frame-image');
                    const reelFrameIndex = reel + 1; // Reel 0 -> Frame index 1, etc.
                    const reelFrame = frameImages[reelFrameIndex];
                    
                    if (reelFrame) {
                        const rect = reelFrame.getBoundingClientRect();
                        const reelCenterX = rect.left + (rect.width / 2);
                        const reelCenterY = rect.top + (rect.height / 2);
                        
                        // Convert to viewport units for responsive design
                        const symbolWidth = 10; // 10vw - bigger symbols
                        const symbolHeight = 16; // 16vh - bigger symbols
                        
                        // Horizontal: Center symbol on reel center  
                        symbolLeft = (reelCenterX / window.innerWidth * 100) - (symbolWidth / 2);
                        
                        // Vertical: Keep middle row centered, increase spacing for top/bottom rows
                        const reelCenterVH = (reelCenterY / window.innerHeight * 100);
                        const rowSpacing = 20; // Push top/bottom rows further out
                        
                        // Position relative to reel center: top (-20vh), middle (0vh), bottom (+20vh)
                        const rowOffset = (row - 1) * rowSpacing; // row 0 = -20, row 1 = 0, row 2 = +20
                        symbolTop = reelCenterVH - (symbolHeight / 2) + rowOffset;
                    } else {
                        // Fallback if frame not found
                        symbolLeft = 20 + (reel * 13);
                        symbolTop = 25 + (row * 17);
                    }
                }
                
                symbolElement.style.left = `${symbolLeft}vw`;
                symbolElement.style.top = `${symbolTop}vh`;
                
                // Set symbol image using render function
                renderSymbolAsImage(symbolElement, symbolName, false, reel, row);
                
                // FIXED: Recreate multipliers from board data (like symbols)
                if (symbolData && typeof symbolData === 'object') {

                    addMathMultiplierOverlay(symbolElement, symbolData, reel, row);
                }
                
                symbolContainer.appendChild(symbolElement);
            }
        }
    }
    
    // REMOVED: Orphaned multiplier cleanup was deleting newly created multipliers
    // The innerHTML = '' at the start already cleared the old multipliers properly
}

// Direct math multiplier detection - show exactly what the math engine provides
function addMathMultiplierOverlay(symbolElement, symbolData, reel, row) {
    // Don't add if already has multiplier overlay
    if (symbolElement.querySelector('.multiplier-overlay')) {

        return;
    }
    
    // ALWAYS log what we're checking for debugging

    
    let multiplierValue = null;
    let symbolName = null;
    
    // Check if the symbol data directly contains a multiplier from math engine
    if (symbolData && typeof symbolData === 'object') {
        symbolName = symbolData.name || symbolData.symbol || 'unknown';
        
        // CRITICAL: Check if this symbol should have a multiplier in bonus
        const isBonus = bonusGameState.isInBonusMode;
        const isWild = symbolName === 'W' || symbolName === 'wild';
        
        if (isBonus && isWild) {

        }
        
        // Direct multiplier property (as seen in math data)
        if (symbolData.multiplier && symbolData.multiplier > 1) {
            multiplierValue = symbolData.multiplier;
            console.log(`[MULTIPLIER] 🎯 Math engine multiplier found at ${reel}-${row}: ${multiplierValue}x on ${symbolName}`);
        }
        // Alternative property names
        else if (symbolData.mult && symbolData.mult > 1) {
            multiplierValue = symbolData.mult;
            console.log(`[MULTIPLIER] 🎯 Math engine mult found at ${reel}-${row}: ${multiplierValue}x on ${symbolName}`);
        }
        else {
            // No multiplier found
        }
    } else {

    }
    
    // Display the multiplier if found
    if (multiplierValue && multiplierValue > 1) {
        console.log(`[MULTIPLIER] ✨ CREATING MULTIPLIER OVERLAY: ${multiplierValue}x at ${reel}-${row} for ${symbolName}`);
        
        // Create and display the multiplier overlay
        const multiplierText = document.createElement('div');
        multiplierText.className = 'multiplier-overlay';
        multiplierText.textContent = `${multiplierValue}x`;
        symbolElement.appendChild(multiplierText);
        
        console.log(`[MULTIPLIER] 🎨 DOM element created and appended to ${reel}-${row}`);
    } else {

    }
}

// Math multiplier system now shows what the math engine provides directly

// Show multipliers from math data when symbols are revealed (no need for win-based detection)
function showMathMultipliers() {
    console.log(`[MULTIPLIER] 🔍 Checking for math engine multipliers on all symbols`);
    
    // Get all symbol elements currently displayed
    const symbolElements = document.querySelectorAll('.symbol');
    
    symbolElements.forEach(symbolEl => {
        const reel = parseInt(symbolEl.dataset.reel);
        const row = parseInt(symbolEl.dataset.row);
        
        if (!isNaN(reel) && !isNaN(row)) {
            // Get symbol data from current board
            if (gameState.displayedBoard && gameState.displayedBoard.board && 
                gameState.displayedBoard.board[reel] && gameState.displayedBoard.board[reel][row]) {
                const symbolData = gameState.displayedBoard.board[reel][row];
                addMathMultiplierOverlay(symbolEl, symbolData, reel, row);
            }
        }
    });
}

// Clear all multiplier overlays (only called at true spin start)
function clearMultiplierOverlays(immediate = true) {
    // Check DOM status before clearing
    if (domMonitor) {
        domMonitor.getCurrentStatus();
    }
    
    if (immediate) {
        const multiplierOverlays = document.querySelectorAll('.multiplier-overlay');
        const timestamp = Date.now();
        console.log(`[DOM VISUAL] 🧹 IMMEDIATE CLEAR STARTED: ${multiplierOverlays.length} overlays - Time: ${new Date(timestamp).toLocaleTimeString()}.${timestamp % 1000}`);
        
        multiplierOverlays.forEach((overlay, index) => {
            const value = overlay.textContent;
            const position = domMonitor ? domMonitor.getElementPosition(overlay) : 'unknown';
            console.log(`[DOM VISUAL] 🗑️ Removing overlay ${index + 1}: ${value} at ${position}`);
            
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });
        console.log(`[MULTIPLIER] 🧹 IMMEDIATE: Cleared ${multiplierOverlays.length} multiplier overlays`);
    } else {
        // Delayed clearing for non-wins (0.5s delay to let players see multipliers)
        const currentCount = document.querySelectorAll('.multiplier-overlay').length;
        const scheduleTime = Date.now();
        console.log(`[DOM VISUAL] ⏰ DELAYED CLEAR SCHEDULED: ${currentCount} overlays - Schedule Time: ${new Date(scheduleTime).toLocaleTimeString()}.${scheduleTime % 1000}`);
        
        setTimeout(() => {
            const multiplierOverlays = document.querySelectorAll('.multiplier-overlay');
            const timestamp = Date.now();
            console.log(`[DOM VISUAL] 🧹 DELAYED CLEAR EXECUTING: ${multiplierOverlays.length} overlays - Time: ${new Date(timestamp).toLocaleTimeString()}.${timestamp % 1000}`);
            
            multiplierOverlays.forEach((overlay, index) => {
                const value = overlay.textContent;
                const position = domMonitor ? domMonitor.getElementPosition(overlay) : 'unknown';
                console.log(`[DOM VISUAL] 🗑️ Removing overlay ${index + 1}: ${value} at ${position}`);
                
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            });
            console.log(`[MULTIPLIER] 🧹 DELAYED: Cleared ${multiplierOverlays.length} multiplier overlays`);
        }, 500); // 0.5 second delay
    }
}

// Game Mechanics (Following Example Pattern)

function startReelSpinning() {
    debugLog('TIMING', '🎲 REEL SPINNING STARTED', { timestamp: Date.now() });
    debugLog('GENERAL', '🎰 Starting reel spinning animation');
    
    // Clear any previous win highlights when starting NEW spin (user wants this timing)
    debugLog('WINS', '🔄 NEW SPIN - Clearing previous win highlights');
    clearWinningHighlights();
    
    // Multipliers will be cleared by displayBoard() when new board is shown
    // No need for bonus-specific clearing here
    
    // Create reel strips for each column and start spinning
    for (let col = 0; col < 5; col++) {
        // Create virtual reel strip for this column
        createReelStrip(col);
        
        // Start spinning animation with staggered start
        setTimeout(() => {
            startReelColumnSpinning(col);
        }, col * 100); // Stagger each reel by 100ms
    }
}

function createReelStrip(columnIndex) {
    const symbols = ['L1', 'L2', 'L3', 'L4', 'L5', 'H1', 'H2', 'H3', 'H4', 'H5', 'W', 'S'];
    
    // Create extended reel strip with random symbols for spinning effect
    const reelStrip = [];
    
    // Add symbols before the visible area (for spinning effect)
    for (let i = 0; i < 10; i++) {
        reelStrip.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    
    // Add the visible symbols (will be replaced with final result)
    for (let i = 0; i < 3; i++) { // 5x3 grid has 3 rows
        reelStrip.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    
    // Add symbols after for smooth transition
    for (let i = 0; i < 10; i++) {
        reelStrip.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    
    // Store reel strip data
    if (!window.reelStrips) window.reelStrips = {};
    window.reelStrips[columnIndex] = {
        strip: reelStrip,
        currentPosition: 10 // Start showing the middle section
    };
}

function startReelColumnSpinning(columnIndex) {
    const reelData = window.reelStrips[columnIndex];
    if (!reelData) return;
    
    let spinPosition = 0;
    const spinSpeed = 80; // Faster spinning to make blur effect more visible
    
    // Start the spinning animation
    const spinInterval = setInterval(() => {
        // Update visible symbols from the reel strip with blurred images
        for (let row = 0; row < 3; row++) {
            const symbolElement = document.querySelector(`[data-pos="${columnIndex}-${row}"]`);
            if (symbolElement) {
                const stripIndex = (spinPosition + row) % reelData.strip.length;
                const spinSymbol = reelData.strip[stripIndex];
                renderSymbolAsImage(symbolElement, spinSymbol, true, columnIndex, row); // Use blurred images during spinning
                symbolElement.classList.add('spinning');
            }
        }
        
        spinPosition = (spinPosition + 1) % reelData.strip.length;
    }, spinSpeed);
    
    // Store interval for cleanup
    if (!window.reelIntervals) window.reelIntervals = {};
    window.reelIntervals[columnIndex] = spinInterval;
}

async function stopReelSpinning(boardData = null) {
    debugLog('TIMING', '🛑 REEL SPINNING STOP STARTED', { timestamp: Date.now() });
    // Stopping reel animations
    
    return new Promise((resolve) => {
        let stoppedReels = 0;
        const totalReels = 5;
        
        // Check if animations were skipped - use immediate timing
        if (gameState.animationSkipped) {
            // Animation skipped - stopping all reels immediately
            
            // Stop all reels immediately without delays
            for (let col = 0; col < totalReels; col++) {
                stopReelColumn(col, boardData ? boardData[col] : null);
                stoppedReels++;
            }
            
            // Resolve immediately when skipped
            resolve();
            return;
        }
        
        // Normal timing - stop reels from left to right with anticipation-based timing
        const baseReelDelay = gameState.turboMode ? 200 : 400; // Match example game timing
        const anticipationMultiplier = gameState.turboMode ? 300 : 600; // Match example game anticipation timing
        
        // Check if we have any anticipation for logging
        const hasAnticipation = gameState.anticipation.some(level => level > 0);
        if (hasAnticipation) {
            debugLog('SYMBOLS', '🎯 Scatter anticipation detected - applying enhanced reel delays:', gameState.anticipation);
        }
        
        for (let col = 0; col < totalReels; col++) {
            const anticipationLevel = gameState.anticipation[col] || 0;
            const totalDelay = (col * baseReelDelay) + (anticipationLevel * anticipationMultiplier);
            
            if (anticipationLevel > 0) {
                debugLog('SYMBOLS', `⏰ Reel ${col} anticipation level ${anticipationLevel} - total delay: ${totalDelay}ms`);
            }
            
            setTimeout(() => {
                stopReelColumn(col, boardData ? boardData[col] : null);
                stoppedReels++;
                
                // Resolve when all reels have stopped
                if (stoppedReels === totalReels) {
                    debugLog('TIMING', '🏁 ALL REELS STOPPED', { timestamp: Date.now() });
                    const settleDelay = gameState.turboMode ? 300 : 500;
                    setTimeout(() => {
                        debugLog('TIMING', '✅ REEL SETTLING COMPLETE', { timestamp: Date.now() });
                        resolve();
                    }, settleDelay); // Wait for final reel to settle
                }
            }, totalDelay); // Anticipation-enhanced delay between each reel stop
        }
    });
}

function stopReelColumn(columnIndex, columnData = null) {
    // Stopping reel animation
    
    // Play reel finished sound effect
    simpleAudioManager.playReelFinished();
    
    // Clear spinning interval
    if (window.reelIntervals && window.reelIntervals[columnIndex]) {
        clearInterval(window.reelIntervals[columnIndex]);
        window.reelIntervals[columnIndex] = null;
    }
    
    // Set final symbols if board data provided
    for (let row = 0; row < 3; row++) {
        const symbolElement = document.querySelector(`[data-pos="${columnIndex}-${row}"]`);
        if (symbolElement) {
            symbolElement.classList.remove('spinning');
            
            // Clear any inline animations
            symbolElement.style.animation = '';
            symbolElement.style.transform = '';
            symbolElement.style.filter = '';
            
            // Set the final symbol if we have board data
            if (columnData && columnData[row]) {
                const symbolData = columnData[row];
                const symbolName = symbolData.name || symbolData;
                renderSymbolAsImage(symbolElement, symbolName, false, columnIndex, row); // Use sharp images for final result
                
                // ⭐ ADD MULTIPLIER IMMEDIATELY when this specific reel stops (perfect timing)
                console.log(`[MULTIPLIER TIMING] 🎯 Reel ${columnIndex} stopped - adding multiplier to wild as it lands`);
                addMathMultiplierOverlay(symbolElement, symbolData, columnIndex, row);
                
                // Add special classes for symbol types
                symbolElement.classList.remove('wild-symbol', 'scatter-symbol', 'high-symbol', 'low-symbol');
                
                if (symbolName === 'W') {
                    symbolElement.classList.add('wild-symbol');
                } else if (symbolName === 'S') {
                    symbolElement.classList.add('scatter-symbol');
                } else if (symbolName?.startsWith('H')) {
                    symbolElement.classList.add('high-symbol');
                } else if (symbolName?.startsWith('L')) {
                    symbolElement.classList.add('low-symbol');
                }
                
                // Add a quick settle effect
                symbolElement.style.transform = 'scale(1.05)';
                symbolElement.style.transition = 'transform 0.15s ease-out';
                
                // Reset to normal size
                setTimeout(() => {
                    symbolElement.style.transform = 'scale(1)';
                    setTimeout(() => {
                        symbolElement.style.transition = '';
                    }, 150);
                }, 100);
            }
        }
    }
}

// UI Control Functions

function updateSpinButton() {
    const spinButton = document.getElementById('spin-button');
    if (!spinButton) return;
    
    if (gameState.isSpinning || gameState.isAnimating) {
        // During autoplay, show "STOP AUTO" instead of "SPINNING..."
        if (gameState.autoPlay && gameState.autoPlay.active) {
            spinButton.disabled = false; // Allow clicking to stop autoplay
            // Keep the image-based button but update hover states
            spinButton.style.opacity = '1';
        } else {
            spinButton.disabled = true;
            spinButton.style.opacity = '0.7';
        }
    } else {
        spinButton.disabled = false;
        spinButton.style.opacity = '1';
    }
}

function showError(message) {
    console.error('❌ Error:', message);
}

// ==========================================
// Spacebar Action Handler
// ==========================================
function handleSpacebarAction() {
    // CRITICAL: Prevent multiple spins or interference with existing spins
    if (gameState.isSpinning || gameState.isAnimating) {
        // If already spinning/animating, could skip animations here
        // Ignoring spacebar during spin
        return;
    } else if (!gameState.sessionID) {
        console.warn('⚠️ Spacebar pressed but not authenticated');
        return;
    } else {
        // Play button sound for spin
        simpleAudioManager.playButtonClick();
        // Only start new spin if completely idle and authenticated
        // Spacebar spin triggered
        playRound('BASE');
    }
}

// Event Listeners

function setupEventListeners() {
    // Main spin button with comprehensive state checking
    const spinButton = document.getElementById('spin-button');
    // Setting up spin button
    
    if (!spinButton) {
        console.error('❌ CRITICAL: Spin button not found in DOM!');
        return;
    }
    
    spinButton.addEventListener('click', () => {
        // Route to replay logic if in replay mode
        if (gameState.isReplayMode) {
            if (!gameState.isSpinning) {
                console.log('🎬 Replay mode - calling replayRound()...');
                replayRound();
            }
            return;
        }
        
        // Normal mode logic
        // Check if autoplay is active and stop it
        if (gameState.autoPlay && gameState.autoPlay.active) {
            // Stopping autoplay via spin button
            stopAutoPlay();
            return;
        }
        
        // Check spin conditions
        if (!gameState.isSpinning && !gameState.isAnimating && gameState.sessionID) {
            // Starting spin
            playRound('BASE');
        } else {
            // Spin blocked - already spinning or not authenticated
        }
    });
    
    // Bet control buttons with Christmas sound effects
    const betUpButton = document.getElementById('bet-plus');
    const betDownButton = document.getElementById('bet-minus');
    const betDisplayButton = document.getElementById('total-bet-button');
    
    if (betUpButton) {
        betUpButton.addEventListener('click', () => {
            simpleAudioManager.playButtonClick();
            increaseBet();
        });
        // Bet up button ready
    }
    
    if (betDownButton) {
        betDownButton.addEventListener('click', () => {
            simpleAudioManager.playButtonClick();
            decreaseBet();
        });
        // Bet down button ready
    }
    
    // Bet selection modal event listeners with Christmas sounds
    if (betDisplayButton) {
        betDisplayButton.addEventListener('click', () => {
            simpleAudioManager.playButtonClick();
            showBetSelectionPopup();
        });
        console.log('✅ Bet button click handler added');
    }
    
    const closeBetModal = document.getElementById('close-bet-modal');
    if (closeBetModal) {
        closeBetModal.addEventListener('click', () => {
            simpleAudioManager.playButtonClick();
            hideBetSelectionPopup();
        });
        console.log('✅ Close bet modal handler added');
    }

    // Removed volume slider event listeners

    // ==========================================
    // Keyboard Event Listeners with Glitch Prevention
    // ==========================================
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' || event.key === ' ') {
            event.preventDefault();
            
            // Ignore repeated keydown events when spacebar is held down
            if (spacebarPressed) return;
            
            // Ignore spam tapping - enforce cooldown period
            if (spacebarCooldown) return;
            
            spacebarPressed = true;
            spacebarCooldown = true;
            
            // Reset cooldown after minimum interval (prevents spam tapping)
            const cooldownTime = gameState.turboMode ? 300 : 1000; // Match example game pattern
            setTimeout(() => {
                spacebarCooldown = false;
            }, cooldownTime);
            
            handleSpacebarAction();
        }
    });
    
    // Reset spacebar flag when key is released
    document.addEventListener('keyup', (event) => {
        if (event.code === 'Space' || event.key === ' ') {
            spacebarPressed = false;
        }
    });
}

// CSS Animation Classes and Spin Button Styling

// Add spinning animation styling to CSS
const style = document.createElement('style');
style.textContent = `
    .symbol-display.spinning {
        animation: symbolSpinning 0.08s linear infinite;
    }
    
    @keyframes symbolSpinning {
        0% { transform: translateY(-2px) scale(0.95); opacity: 0.9; }
        50% { transform: translateY(0px) scale(1.02); opacity: 0.95; }
        100% { transform: translateY(-2px) scale(0.95); opacity: 0.9; }
    }
    
    #spin-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
    
    #spin-button.spinning {
        opacity: 0.8;
        pointer-events: none;
    }
`;
document.head.appendChild(style);

// Display initial symbols when game loads
function displayInitialSymbols() {
    // Displaying initial symbols
    
    // Create a random initial board to show symbols
    const symbols = ['L1', 'L2', 'L3', 'L4', 'L5', 'H1', 'H2', 'H3', 'H4', 'H5', 'W', 'S'];
    const initialBoard = [];
    
    for (let reel = 0; reel < 5; reel++) {
        const reelSymbols = [];
        for (let row = 0; row < 3; row++) {
            reelSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
        }
        initialBoard.push(reelSymbols);
    }
    
    displayBoard(initialBoard);
}

// Game Initialization (Following Example Pattern)

async function initializeGame() {
    console.log('🎮 Starting Christmas Magic Lines...');
    
    // Initialize DOM monitoring system
    console.log('[DOM VISUAL] 🔍 Initializing multiplier DOM monitor...');
    domMonitor = new MultiplierDOMMonitor();
    console.log('[DOM VISUAL] ✅ DOM monitor ready');
    
    try {
        // Show loading background
        const loadingBg = document.getElementById('loading-background');
        loadingBg.style.display = 'flex';
        console.log('🔍 Loading background shown');
        
        // Start snow overlay during loading
        showSnowOverlay();
        
        // Check if game logo is available and setup enhanced breathing
        const gameLogo = document.getElementById('game-logo');
        console.log('🔍 Game logo container:', gameLogo);
        
        // Game logo keeps breathing animation (restored)
        const gameLogoImg = gameLogo.querySelector('.game-logo');
        console.log('🔍 Game logo IMG element:', gameLogoImg);
        
        if (gameLogoImg) {
            // Game logo will use CSS breathing animation
            console.log('✅ Game logo will use breathing animation from CSS');
        } else {
            console.error('❌ Could not find .game-logo image element');
        }
        
        // Start asset preloading in parallel
        console.log('📦 Starting asset preloading...');
        const assetPromise = preloadGameAssets();
        
        // Studio logo breathes for 5 seconds (enhanced timing)
        console.log('🏢 Studio logo breathing for 5 seconds...');
        await sleep(5000);
        
        // Fade out studio logo smoothly
        console.log('🎭 Fading out studio logo...');
        document.getElementById('studio-logo').style.animation = 'fadeOut 3s ease-in-out forwards';
        await sleep(3000); // Wait for full fade to complete
        
        // Show game logo
        console.log('🎯 Showing game logo...');
        document.getElementById('game-logo').style.display = 'flex';
        
        // Wait 2 seconds for game logo breathing animation
        console.log('🎭 Game logo breathing for 2 seconds...');
        await sleep(2000);
        
        // Show loader and start loading in parallel
        console.log('⏳ Starting loading sequence...');
        const loaderContainer = document.getElementById('loader-container');
        console.log('🔍 Loader container element:', loaderContainer);
        if (loaderContainer) {
            loaderContainer.classList.remove('hidden');
            console.log('✅ Christmas loading bar shown - loading in progress...');
        } else {
            console.error('❌ Loader container not found!');
        }
        
        // Load assets and authenticate in parallel
        console.log('🚀 Loading assets and authenticating in parallel...');
        const [assetsLoaded, authenticated] = await Promise.all([
            assetPromise,
            authenticateSession()
        ]);
        
        // Add delay so users can see the loader working
        await sleep(1000);
        
        if (authenticated) {
            // Hide loading screen and show game
            loadingBg.style.transition = 'opacity 1s ease-out';
            loadingBg.style.opacity = '0';
            
            const gameContainer = document.getElementById('game-container');
            gameContainer.style.display = 'flex';
            gameContainer.style.opacity = '1';
            
            // Setup UI
            setupEventListeners();
            updateBalanceDisplay();
            updateBetDisplay();
            updateWinDisplay();
            updateSpinButton();
            
            // Display initial symbols on game load
            displayInitialSymbols();
            
            // Initialize simple audio system
            simpleAudioManager.init();
            
            // Play simple intro sequence
            setTimeout(() => {
                simpleAudioManager.playIntro();
            }, 500);
            

            
            // Remove loading screen and initialize game
            setTimeout(() => {
                loadingBg.style.display = 'none';
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Error during game initialization:', error);
    }
}

// Inject CSS for win animations
function injectWinAnimationCSS() {
    if (!document.getElementById('win-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'win-animation-styles';
        style.textContent = winAnimationCSS;
        document.head.appendChild(style);
    }
}

// Responsive UI Layout - Switches between mobile and desktop structures
function setupResponsiveUI() {
    const unifiedUI = document.querySelector('.unified-horizontal-ui');
    if (!unifiedUI) return;
    
    // Detect current screen size (match CSS media query)
    const isMobile = window.innerWidth <= 500 && window.innerHeight >= 560;
    
    // Get all UI elements (preserve references to maintain event listeners)
    const balanceContainer = document.querySelector('.balance-container');
    const betControlsGroup = document.querySelector('.bet-controls-group');
    const actionButtonsGroup = document.querySelector('.action-buttons-group');
    const bonusContainer = document.querySelector('.bonus-buy-container');
    const winContainer = document.querySelector('.last-win-container');
    const infoButton = document.querySelector('.info-button-container');
    const soundButton = document.querySelector('.sound-button-container');
    
    // Clear and rebuild structure based on screen size
    unifiedUI.innerHTML = '';
    
    if (isMobile) {
        // Mobile: 4-row vertical layout
        unifiedUI.className = 'unified-horizontal-ui mobile-ui';
        
        // Row 1: Balance and Bonus
        const row1 = document.createElement('div');
        row1.className = 'mobile-ui-row mobile-row-1';
        const balanceSection = document.createElement('div');
        balanceSection.className = 'mobile-balance-section';
        if (balanceContainer) balanceSection.appendChild(balanceContainer);
        const bonusSection = document.createElement('div');
        bonusSection.className = 'mobile-bonus-section';
        if (bonusContainer) bonusSection.appendChild(bonusContainer);
        row1.appendChild(balanceSection);
        row1.appendChild(bonusSection);
        
        // Row 2: Bet Controls
        const row2 = document.createElement('div');
        row2.className = 'mobile-ui-row mobile-row-2';
        if (betControlsGroup) row2.appendChild(betControlsGroup);
        
        // Row 3: Win, Info, Sound
        const row3 = document.createElement('div');
        row3.className = 'mobile-ui-row mobile-row-3';
        const winSection = document.createElement('div');
        winSection.className = 'mobile-win-section';
        if (winContainer) winSection.appendChild(winContainer);
        const infoSoundSection = document.createElement('div');
        infoSoundSection.className = 'mobile-info-sound';
        if (infoButton) infoSoundSection.appendChild(infoButton);
        if (soundButton) infoSoundSection.appendChild(soundButton);
        row3.appendChild(winSection);
        row3.appendChild(infoSoundSection);
        
        // Row 4: Action Buttons (Auto, Spin, Turbo)
        const row4 = document.createElement('div');
        row4.className = 'mobile-ui-row mobile-row-4';
        if (actionButtonsGroup) row4.appendChild(actionButtonsGroup);
        
        // Add all rows to unified UI
        unifiedUI.appendChild(row1);
        unifiedUI.appendChild(row2);
        unifiedUI.appendChild(row3);
        unifiedUI.appendChild(row4);
        
    } else {
        // Desktop: Original horizontal layout
        unifiedUI.className = 'unified-horizontal-ui';
        
        // Restore original desktop structure
        if (balanceContainer) unifiedUI.appendChild(balanceContainer);
        if (betControlsGroup) unifiedUI.appendChild(betControlsGroup);
        if (actionButtonsGroup) unifiedUI.appendChild(actionButtonsGroup);
        if (bonusContainer) unifiedUI.appendChild(bonusContainer);
        if (winContainer) unifiedUI.appendChild(winContainer);
        if (infoButton) unifiedUI.appendChild(infoButton);
        if (soundButton) unifiedUI.appendChild(soundButton);
    }
}

// Start the game when DOM is loaded (Following Example Pattern)
document.addEventListener('DOMContentLoaded', async function() {
    // Setup responsive UI first
    setupResponsiveUI();
    
    // Inject win animation CSS
    injectWinAnimationCSS();
    
    try {
        await initializeGame();
        // Initialize AutoPlay and Turbo functionality
        initializeAutoPlayTurbo();
        // Game initialization complete
    } catch (error) {
        console.error('💥 GAME INITIALIZATION FAILED:', {
            message: error.message,
            stack: error.stack
        });
    }
});

/**
 * Initialize AutoPlay and Turbo functionality
 */
function initializeAutoPlayTurbo() {
    const autoplayButton = document.getElementById('autoplay-button');
    const turboButton = document.getElementById('turbo-button');
    const autoplayPopup = document.getElementById('autoplay-popup');
    const closePopupButton = document.getElementById('close-autoplay-popup');
    const autoplayOptions = document.querySelectorAll('.autoplay-option');
    
    // AutoPlay button click - show popup or stop
    autoplayButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (gameState.autoPlay.active) {
            stopAutoPlay();
        } else {
            autoplayPopup.style.display = 'flex';
        }
    });
    
    // Turbo button click - toggle turbo mode
    turboButton.addEventListener('click', (e) => {
        e.preventDefault();
        toggleTurboMode();
    });
    
    // Close popup
    closePopupButton.addEventListener('click', () => {
        autoplayPopup.style.display = 'none';
    });
    
    // Click outside popup to close
    autoplayPopup.addEventListener('click', (e) => {
        if (e.target === autoplayPopup) {
            autoplayPopup.style.display = 'none';
        }
    });
    
    // AutoPlay option selection
    autoplayOptions.forEach(option => {
        option.addEventListener('click', () => {
            const spins = option.dataset.spins;
            startAutoPlay(spins);
            autoplayPopup.style.display = 'none';
        });
    });

    // Custom checkbox toggle functionality
    const customCheckbox = document.getElementById('stop-on-bonus');
    if (customCheckbox) {
        customCheckbox.addEventListener('click', () => {
            const isChecked = customCheckbox.dataset.checked === 'true';
            const newState = !isChecked;
            customCheckbox.dataset.checked = newState.toString();
            
            const onImage = customCheckbox.querySelector('.checkbox-on');
            const offImage = customCheckbox.querySelector('.checkbox-off');
            
            if (newState) {
                onImage.style.display = 'block';
                offImage.style.display = 'none';
            } else {
                onImage.style.display = 'none';
                offImage.style.display = 'block';
            }
        });
    }

    // Update button states
    updateAutoPlayButton();
    updateTurboButton();
    
    // Initialize bonus buy button
    initializeBonusBuyButton();
}

/**
 * Initialize bonus buy button with event listeners
 */
function initializeBonusBuyButton() {
    const bonusBuyButton = document.getElementById('bonus-buy-button');
    if (!bonusBuyButton) return;
    
    // Main click event
    bonusBuyButton.addEventListener('click', showBonusBuyPopup);
    
    // Hover effects for button image
    const buttonImage = bonusBuyButton.querySelector('.button-image');
    if (buttonImage) {
        bonusBuyButton.addEventListener('mouseenter', function() {
            buttonImage.src = './assets/GUI Elements/PNG GUI Elements/Green Long Button Hover.png';
        });
        bonusBuyButton.addEventListener('mouseleave', function() {
            buttonImage.src = './assets/GUI Elements/PNG GUI Elements/Green Long Button Normal.png';
        });
    }
    
    // Close bonus buy panel
    const closeBonusBuy = document.getElementById('close-bonus-buy');
    if (closeBonusBuy) {
        closeBonusBuy.addEventListener('click', hideBonusBuyPopup);
    }
    
    // Bonus bet controls in popup (reuse main bet controls)
    const bonusBetUp = document.getElementById('bonus-bet-up');
    const bonusBetDown = document.getElementById('bonus-bet-down');
    if (bonusBetUp) bonusBetUp.addEventListener('click', increaseBet);
    if (bonusBetDown) bonusBetDown.addEventListener('click', decreaseBet);
    
    // Bonus option selection
    document.querySelectorAll('.bonus-option').forEach(option => {
        option.addEventListener('click', () => {
            const mode = option.dataset.mode;
            purchaseBonus(mode);
        });
    });
    
    // Bonus purchase buttons
    document.querySelectorAll('.bonus-purchase-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const option = btn.closest('.bonus-option');
            const mode = option ? option.dataset.mode : 'BONUS';
            purchaseBonus(mode);
        });
    });
}

/**
 * Start AutoPlay with specified number of spins
 */
function startAutoPlay(spins) {
    const stopOnBonusCheckbox = document.getElementById('stop-on-bonus');
    
    if (spins === 'infinite') {
        gameState.autoPlay.infinite = true;
        gameState.autoPlay.spinsRemaining = Infinity;
        gameState.autoPlay.totalSpins = Infinity;
    } else {
        gameState.autoPlay.infinite = false;
        gameState.autoPlay.spinsRemaining = parseInt(spins);
        gameState.autoPlay.totalSpins = parseInt(spins);
    }
    
    gameState.autoPlay.active = true;
    gameState.autoPlay.stopOnBonus = stopOnBonusCheckbox ? (stopOnBonusCheckbox.dataset.checked === 'true') : true;
    updateAutoPlayButton();
    
    if (MASTER_DEBUG) {
        console.log(`[AUTOPLAY] Started with ${spins} spins`);
    }
    
    // Start first auto spin if not currently spinning
    if (!gameState.isSpinning) {
        setTimeout(() => {
            if (gameState.autoPlay.active && !gameState.isSpinning) {
                playRound('BASE');
            }
        }, 1000);
    }
}

/**
 * Stop AutoPlay
 */
function stopAutoPlay() {
    gameState.autoPlay.active = false;
    gameState.autoPlay.spinsRemaining = 0;
    gameState.autoPlay.totalSpins = 0;
    gameState.autoPlay.infinite = false;
    updateAutoPlayButton();
    
    if (MASTER_DEBUG) {
        console.log('[AUTOPLAY] Stopped');
    }
}

/**
 * Toggle Turbo Mode
 */
function toggleTurboMode() {
    gameState.turboMode = !gameState.turboMode;
    updateTurboButton();
    
    if (MASTER_DEBUG) {
        console.log(`[TURBO] ${gameState.turboMode ? 'Enabled' : 'Disabled'}`);
    }
}

/**
 * Update AutoPlay button appearance
 */
function updateAutoPlayButton() {
    const autoplayButton = document.getElementById('autoplay-button');
    const buttonText = autoplayButton.querySelector('.button-text');
    
    if (gameState.autoPlay.active) {
        autoplayButton.classList.add('active');
        if (gameState.autoPlay.infinite) {
            buttonText.textContent = 'AUTO (∞)';
        } else {
            buttonText.textContent = `AUTO (${gameState.autoPlay.spinsRemaining})`;
        }
    } else {
        autoplayButton.classList.remove('active');
        buttonText.textContent = 'AUTO';
    }
}

/**
 * Update Turbo button appearance
 */
function updateTurboButton() {
    const turboButton = document.getElementById('turbo-button');
    
    if (gameState.turboMode) {
        turboButton.classList.add('active');
    } else {
        turboButton.classList.remove('active');
    }
}

/**
 * Handle AutoPlay continuation after a spin completes
 */
function handleAutoPlayContinuation() {
    if (!gameState.autoPlay.active) return;
    
    // Decrease spins remaining (unless infinite)
    if (!gameState.autoPlay.infinite) {
        gameState.autoPlay.spinsRemaining--;
        
        // Check if AutoPlay should stop
        if (gameState.autoPlay.spinsRemaining <= 0) {
            stopAutoPlay();
            return;
        }
    }
    
    // Check if we have sufficient balance for next spin
    if (gameState.balance.amount < gameState.currentBet) {
        stopAutoPlay();
        if (MASTER_DEBUG) {
            console.log('[AUTOPLAY] Stopped due to insufficient balance');
        }
        return;
    }
    
    // Update button display
    updateAutoPlayButton();
    
    // Schedule next spin
    const delay = gameState.turboMode ? 800 : 1500; // Shorter delay in turbo mode
    setTimeout(() => {
        if (gameState.autoPlay.active && !gameState.isSpinning && gameState.sessionID) {
            // Double-check balance before spinning
            if (gameState.balance.amount >= gameState.currentBet) {
                playRound('BASE');
            } else {
                stopAutoPlay();
                if (MASTER_DEBUG) {
                    console.log('[AUTOPLAY] Stopped due to insufficient balance at spin time');
                }
            }
        }
    }, delay);
    
    if (MASTER_DEBUG) {
        const remaining = gameState.autoPlay.infinite ? '∞' : gameState.autoPlay.spinsRemaining;
        console.log(`[AUTOPLAY] Continuing... ${remaining} spins remaining`);
    }
}

// ==========================================
// INFO and SOUND Button Functionality
// ==========================================

// Game Info Popup Functions
function showGameInfoPopup() {
    console.log('🚀 showGameInfoPopup() called');
    const gameInfoPopup = document.getElementById('game-info-popup');
    if (gameInfoPopup) {
        console.log('✅ Showing game info popup...');
        gameInfoPopup.style.display = 'flex';
        
        // Ensure symbols tab is active by default
        switchInfoTab('symbols');
        
        console.log('📖 Game info popup opened with comprehensive information');
    }
}

function hideGameInfoPopup() {
    console.log('🚀 hideGameInfoPopup() called');
    const gameInfoPopup = document.getElementById('game-info-popup');
    if (gameInfoPopup) {
        console.log('✅ Found popup element, hiding...');
        gameInfoPopup.style.display = 'none';
        console.log('📖 Game info popup closed');
    } else {
        console.error('❌ Could not find game-info-popup element');
    }
}

function switchInfoTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.info-tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.info-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedContent = document.getElementById(`${tabName}-tab`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
    
    // Add active class to selected tab
    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase().includes(tabName) || 
            (tabName === 'paylines' && tab.textContent.includes('Win Lines'))) {
            tab.classList.add('active');
        }
    });
    
    console.log(`📖 Switched to ${tabName} tab`);
}

// ==========================================
// Christmas Audio Management System
// ==========================================
const simpleAudioManager = {
    backgroundMusic: null,
    sfxEnabled: true,
    musicEnabled: true,
    sfxVolume: 1.0, // Global SFX volume (0-1) - matches HTML slider default
    
    // Simple initialization - no complex loading or listeners
    init() {
        console.log('🎵 Initializing simple audio system...');
        
        // Load background music
        this.backgroundMusic = new Audio('./assets/base game background music.mp3');
        this.backgroundMusic.loop = true;
        
        // Apply current music volume slider setting
        const musicSlider = document.getElementById('music-volume');
        const sliderValue = musicSlider ? musicSlider.value : 30;
        this.backgroundMusic.volume = sliderValue / 100 * 0.8;
        
        console.log('✅ Simple audio system ready');
    },
    
    // Simple sound playing - no complex management
    playSound(filename, baseVolume = 0.5) {
        if (!this.sfxEnabled) return;
        
        try {
            const audio = new Audio(filename);
            // Apply global SFX volume to base volume
            audio.volume = baseVolume * this.sfxVolume;
            audio.play().catch(() => {});
        } catch (e) {
            // Silently fail if sound can't play
        }
    },
    
    // Simple background music control
    startBackgroundMusic() {
        if (!this.musicEnabled || !this.backgroundMusic) return;
        
        this.backgroundMusic.currentTime = 0;
        this.backgroundMusic.play().catch(() => {});
        console.log('🎵 Background music started');
    },
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    },
    
    // Switch to a different background music track
    switchBackgroundMusic(filename) {
        if (!this.musicEnabled) return;
        
        console.log(`🎵 Switching background music to: ${filename}`);
        
        // Stop current music
        this.stopBackgroundMusic();
        
        // Load new track
        this.backgroundMusic = new Audio(filename);
        this.backgroundMusic.loop = true;
        
        // Apply current music volume slider setting
        const musicSlider = document.getElementById('music-volume');
        const sliderValue = musicSlider ? musicSlider.value : 30;
        this.backgroundMusic.volume = sliderValue / 100 * 0.8;
        
        // Start new track
        this.startBackgroundMusic();
    },
    
    // Simple sound effects (no complex management)
    playButtonClick() {
        this.playSound('./assets/jingle bells sfx.mp3', 0.3);
    },
    
    playMoneyIn() {
        this.playSound('./assets/moneys in sfx.MP3', 1.0);
    },
    
    playReelFinished() {
        this.playSound('./assets/reel finished.mp3', 0.7);
    },
    
    // Play random big win sound effect (for big win popups)
    playRandomBigWinSFX() {
        const randomIndex = Math.floor(Math.random() * 12) + 1; // 1-12
        const sfxPath = `./assets/sfx/win sfx${randomIndex}.MP3`;
        console.log(`🎵 Playing random big win SFX: win sfx${randomIndex}.MP3`);
        this.playSound(sfxPath, 1.0);
    },
    
    // Simple intro sequence
    async playIntro() {
        this.playMoneyIn();
        
        // Start background music after a short delay
        setTimeout(() => {
            this.startBackgroundMusic();
        }, 2000);
    },
    
    // Set SFX volume (0-100)
    setSfxVolume(percentage) {
        this.sfxVolume = percentage / 100;
        console.log(`🔊 SFX volume set to ${percentage}% (${this.sfxVolume})`);
    },
    
    // Simple audio toggle
    toggle() {
        this.musicEnabled = !this.musicEnabled;
        this.sfxEnabled = !this.sfxEnabled;
        
        if (!this.musicEnabled) {
            this.stopBackgroundMusic();
        } else {
            this.startBackgroundMusic();
        }
        
        return this.musicEnabled;
    }
};

// Simple function wrappers for existing volume controls
function updateMusicVolume(value) {
    if (simpleAudioManager.backgroundMusic) {
        simpleAudioManager.backgroundMusic.volume = value / 100 * 0.5;
    }
    document.getElementById('music-volume-display').textContent = value + '%';
}

function updateSfxVolume(value) {
    // Update global SFX volume in audio manager
    simpleAudioManager.setSfxVolume(value);
    document.getElementById('sfx-volume-display').textContent = value + '%';
}

function toggleSoundIcon() {
    const soundIcon = document.getElementById('sound-icon');
    const isEnabled = simpleAudioManager.toggle();
    
    if (!isEnabled) {
        soundIcon.src = './assets/GUI Elements/PNG Icons/Icon music off.png';
        document.getElementById('music-volume').value = 0;
        updateMusicVolume(0);
    } else {
        soundIcon.src = './assets/GUI Elements/PNG Icons/Icon music on.png';
        document.getElementById('music-volume').value = 30;
        updateMusicVolume(30);
    }
    console.log(`🎵 Simple audio toggled: ${isEnabled ? 'ON' : 'OFF'}`);
}

// Initialize event listeners for new buttons
document.addEventListener('DOMContentLoaded', function() {
    // INFO button with Christmas sound
    const infoButton = document.getElementById('info-button');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            simpleAudioManager.playButtonClick();
            showGameInfoPopup();
        });
        console.log('✅ INFO button event listener added');
    }
    
    // SOUND button with Christmas sound
    const soundButton = document.getElementById('sound-button');
    if (soundButton) {
        soundButton.addEventListener('click', () => {
            simpleAudioManager.playButtonClick();
            toggleVolumePopup();
        });
        console.log('✅ SOUND button event listener added');
    }
    
    // Volume sliders
    const musicSlider = document.getElementById('music-volume');
    const sfxSlider = document.getElementById('sfx-volume');
    
    if (musicSlider) {
        musicSlider.addEventListener('input', (e) => updateMusicVolume(e.target.value));
        console.log('✅ Music slider event listener added');
    }
    if (sfxSlider) {
        sfxSlider.addEventListener('input', (e) => updateSfxVolume(e.target.value));
        // Initialize SFX volume display
        updateSfxVolume(sfxSlider.value);
        console.log('✅ SFX slider event listener added and initialized');
    }
    
    // Close volume popup when clicking outside
    document.addEventListener('click', (e) => {
        const volumePopup = document.getElementById('volume-popup');
        const soundButton = document.getElementById('sound-button');
        if (volumePopup && !volumePopup.contains(e.target) && !soundButton.contains(e.target)) {
            volumePopup.classList.add('hidden');
        }
    });
    
    console.log('✅ INFO and SOUND button initialization complete');
    
    // Add event delegation for data-action attributes (security improvement)
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        
        switch(action) {
            case 'hide-game-info':
                hideGameInfoPopup();
                break;
            case 'hide-bonus-buy':
                hideBonusBuyPopup();
                break;
            case 'hide-bonus-confirmation':
                hideBonusBuyConfirmation();
                break;
            case 'confirm-bonus-purchase':
                confirmBonusPurchase();
                break;
        }
    });
    
    // Add event delegation for tab switching
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('info-tab') && e.target.hasAttribute('data-tab')) {
            const tabName = e.target.getAttribute('data-tab');
            switchInfoTab(tabName);
        }
    });
    
    // Handle bonus buy panel backdrop clicks
    const bonusBuyPanel = document.getElementById('bonus-buy-panel');
    if (bonusBuyPanel) {
        bonusBuyPanel.addEventListener('click', function(e) {
            if (e.target === bonusBuyPanel && bonusBuyPanel.getAttribute('data-close-on-backdrop') === 'true') {
                hideBonusBuyPopup();
            }
        });
    }
});

// Make functions globally available
window.showGameInfoPopup = showGameInfoPopup;
window.hideGameInfoPopup = hideGameInfoPopup;
window.switchInfoTab = switchInfoTab;

// ==========================================
// Responsive Layout Switching
// ==========================================

/**
 * Repositions all existing symbols when layout changes
 * Fixes the mobile/desktop layout switching issue
 */
function handleResponsiveResize(reason = 'unknown') {
    if (MASTER_DEBUG) {
        console.log(`🔄 [RESPONSIVE] Layout check triggered by: ${reason}`);
    }
    
    const symbols = document.querySelectorAll('.symbol-display');
    
    if (MASTER_DEBUG) {
        console.log(`🔄 [RESPONSIVE] Found ${symbols.length} symbols to reposition`);
    }
    
    symbols.forEach((symbol, index) => {
        const dataPos = symbol.getAttribute('data-pos');
        if (!dataPos) {
            if (MASTER_DEBUG) {
                console.log(`⚠️ [RESPONSIVE] Symbol ${index} missing data-pos attribute`);
            }
            return;
        }
        
        const [reel, row] = dataPos.split('-').map(Number);
        
        // Re-detect mobile vs desktop
        const isMobile = window.innerWidth <= 500 && window.innerHeight >= 560;
        
        if (MASTER_DEBUG && index === 0) {
            console.log(`📱 [RESPONSIVE] Screen: ${window.innerWidth}x${window.innerHeight}, Mobile: ${isMobile}`);
        }
        
        if (isMobile) {
            // Apply mobile positioning
            const mobilePositions = {
                0: { left: 9.5, positions: [8, 21, 34] },
                1: { left: 26.5, positions: [8, 21, 34] },
                2: { left: 42, positions: [8, 21, 34] },
                3: { left: 59, positions: [8, 21, 34] },
                4: { left: 75.75, positions: [8, 21, 34] }
            };
            
            const newLeft = `${mobilePositions[reel].left}vw`;
            const newTop = `${mobilePositions[reel].positions[row]}vh`;
            
            symbol.style.left = newLeft;
            symbol.style.top = newTop;
            symbol.style.width = '15vw';
            symbol.style.height = '12vw';
            
            if (MASTER_DEBUG && index < 3) {
                console.log(`📱 [RESPONSIVE] Mobile: Symbol ${dataPos} -> ${newLeft}, ${newTop}`);
            }
        } else {
            // Apply desktop positioning (frame-based)
            const frameImages = document.querySelectorAll('.frame-image');
            const reelFrameIndex = reel + 1;
            const reelFrame = frameImages[reelFrameIndex];
            
            if (reelFrame) {
                const rect = reelFrame.getBoundingClientRect();
                const reelCenterX = rect.left + (rect.width / 2);
                const reelCenterY = rect.top + (rect.height / 2);
                
                const symbolWidth = 10; // 10vw
                const symbolHeight = 16; // 16vh
                
                const symbolLeft = (reelCenterX / window.innerWidth * 100) - (symbolWidth / 2);
                const reelCenterVH = (reelCenterY / window.innerHeight * 100);
                const rowSpacing = 20;
                const rowOffset = (row - 1) * rowSpacing;
                const symbolTop = reelCenterVH - (symbolHeight / 2) + rowOffset;
                
                symbol.style.left = `${symbolLeft}vw`;
                symbol.style.top = `${symbolTop}vh`;
                symbol.style.width = '10vw';
                symbol.style.height = '16vh';
                
                if (MASTER_DEBUG && index < 3) {
                    console.log(`🖥️ [RESPONSIVE] Desktop: Symbol ${dataPos} -> ${symbolLeft.toFixed(1)}vw, ${symbolTop.toFixed(1)}vh`);
                }
            } else {
                if (MASTER_DEBUG) {
                    console.log(`❌ [RESPONSIVE] No frame found for reel ${reel} (frameIndex: ${reelFrameIndex})`);
                }
            }
        }
    });
    

}

// Timer-based layout checker - checks every 500ms for layout changes
let currentLayout = null;
let layoutCheckInterval;

function startLayoutChecker() {
    if (MASTER_DEBUG) {
        console.log('🕒 [RESPONSIVE] Starting layout checker (500ms interval)');
    }
    
    layoutCheckInterval = setInterval(() => {
        const isMobile = window.innerWidth <= 500 && window.innerHeight >= 560;
        const newLayout = isMobile ? 'mobile' : 'desktop';
        
        if (newLayout !== currentLayout) {
            if (MASTER_DEBUG) {
                console.log(`🔄 [RESPONSIVE] Layout changed: ${currentLayout || 'unknown'} -> ${newLayout}`);
            }
            currentLayout = newLayout;
            
            // Rebuild UI structure for new layout
            setupResponsiveUI();
            
            handleResponsiveResize('layout-change');
        }
    }, 500);
}

// Also keep resize listeners as backup
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => handleResponsiveResize('resize-event'), 100);
});

window.addEventListener('orientationchange', () => {
    setTimeout(() => handleResponsiveResize('orientation-change'), 200);
});

// Replay Mode Functions
function updateReplayBetInfo() {
    const betInfoDiv = document.getElementById('replay-bet-info');
    if (!betInfoDiv || !gameState.replayParams) return;
    
    const mode = gameState.replayParams.mode || 'BASE';
    const baseAmount = gameState.replayParams.amount / 1000000; // Convert from micro-cents
    const currency = gameState.replayParams.currency || 'USD';
    
    if (mode.toUpperCase() === 'BASE') {
        // BASE mode: Show only bet amount
        betInfoDiv.innerHTML = `
            <div style="background: rgba(0,0,0,0.8); padding: 1.5vmin 2vmin; border: 2px solid #ffd700; border-radius: 1vmin; color: white; text-align: left; font-size: 2.5vmin; line-height: 1.2; width: fit-content; white-space: nowrap;">
                <div style="color: #ffd700; font-weight: bold; margin: 0.3vmin 0;">BET AMOUNT: ${baseAmount.toFixed(2)} ${currency}</div>
            </div>
        `;
    } else {
        // BONUS mode: Show bet amount and real cost
        const costMultiplier = gameState.replayData ? gameState.replayData.costMultiplier || 1 : 1;
        const realCost = baseAmount * costMultiplier;
        
        betInfoDiv.innerHTML = `
            <div style="background: rgba(0,0,0,0.8); padding: 1.5vmin 2vmin; border: 2px solid #ffd700; border-radius: 1vmin; color: white; text-align: left; font-size: 2.5vmin; line-height: 1.2; width: fit-content; white-space: nowrap;">
                <div style="color: #ffd700; font-weight: bold; margin: 0.3vmin 0;">BET AMOUNT: ${baseAmount.toFixed(2)} ${currency}</div>
                <div style="color: #ffd700; font-weight: bold; margin: 0.3vmin 0;">REAL COST: ${realCost.toFixed(2)} ${currency}</div>
            </div>
        `;
    }
    
    // Position in top-right corner
    betInfoDiv.style.display = 'block';
    betInfoDiv.style.position = 'absolute';
    betInfoDiv.style.top = '4vh';
    betInfoDiv.style.right = '1vw';
    betInfoDiv.style.zIndex = '1000';
    betInfoDiv.style.width = 'auto';
    betInfoDiv.style.maxWidth = '25vw';
}

function setupPlayAgainButton() {
    const playAgainBtn = document.getElementById('play-again-btn');
    if (!playAgainBtn) return;
    
    // Add click handler to reload the current replay URL
    playAgainBtn.addEventListener('click', function() {
        console.log('🎬 Play Again button clicked - restarting replay');
        window.location.reload();
    });
}

// Start the layout checker when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLayoutChecker);
} else {
    startLayoutChecker();
}





