/**
 * Main application entry point
 * This file initializes the application when the document loads
 */

// Feature flag to control debug panel visibility
// Set to false before merging to main branch
const ENABLE_DEBUG_PANEL = true;

// Feature flag to control audio debug panel visibility
// Set to false before merging to main branch
const ENABLE_AUDIO_DEBUG_PANEL = true;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Music Therapy Sensory App initialized');
    
    // Initialize the state management system
    const stateManager = new StateManager(true); // true enables debug mode initially
    const stateStorage = new StateStorage(stateManager);
    const presetManager = new PresetManager(stateManager, stateStorage);
    
    // Load saved state if available
    const stateLoaded = stateStorage.loadState();
    if (stateLoaded) {
        console.log('Previous state loaded from localStorage');
    } else {
        // If no state was loaded, set animation to start by default
        stateManager.updateState({ isRunning: true }, 'app.js:init');
    }
    
    // Initialize UI controller
    const uiController = new UIController(stateManager);
    
    // Initialize theme manager with direct access to state manager
    const themeManager = new ThemeManager(stateManager);
    
    // Register snowflakes theme (now directly integrated with state management)
    themeManager.registerTheme('snowflakes', new SnowflakesTheme(stateManager));
    
    // Register underwater theme
    themeManager.registerTheme('underwater', new UnderwaterTheme(stateManager));
    
    // Initialize Debug Panel but keep it hidden (only if enabled by feature flag)
    let debugPanel;
    if (ENABLE_DEBUG_PANEL) {
        debugPanel = new DebugPanel(stateManager);
        debugPanel.init();
    }
    
    // Initialize Audio Manager for sound detection
    const audioManager = new AudioManager(stateManager);
    
    // Do not automatically initialize the audio system
    // This prevents the microphone permission popup from appearing on page load
    // Instead, wait for the user to click "Enable" in the Audio Debug Panel
    
    // Make key components available globally for debugging and for sketch.js
    window.sentireApp = {
        stateManager,
        stateStorage,
        presetManager,
        uiController,
        themeManager,
        audioManager
    };
    
    // Add debugPanel to the global object only if enabled
    if (ENABLE_DEBUG_PANEL) {
        window.sentireApp.debugPanel = debugPanel;
    }
    
    // Initialize Audio Debug Panel if enabled by feature flag
    let audioDebugPanel;
    if (ENABLE_AUDIO_DEBUG_PANEL) {
        audioDebugPanel = new AudioDebugPanel(stateManager, audioManager);
        // Add audioDebugPanel to the global object
        window.sentireApp.audioDebugPanel = audioDebugPanel;
    }
    
    // Auto-save state when user leaves the page
    window.addEventListener('beforeunload', () => {
        stateStorage.saveState();
        
        // Clean up audio resources
        if (audioManager) {
            audioManager.cleanup();
        }
    });
    
    console.log('State management system initialized');
    
    // Ensure the animation starts by explicitly calling to start the current theme
    // This is needed in case the p5.js sketch runs before our state system is fully initialized
    setTimeout(() => {
        if (stateManager.state.isRunning && themeManager.currentTheme) {
            themeManager.startCurrentTheme();
            console.log('Animation manually started based on state.isRunning = true');
        }
    }, 500);
});