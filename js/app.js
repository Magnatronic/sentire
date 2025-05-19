/**
 * Main application entry point
 * This file initializes the application when the document loads
 */

// Debug panel and debug log have been removed

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
      // Initialize the Sidebar Audio Panel for all themes
    const sidebarAudioPanel = new SidebarAudioPanel(stateManager, audioManager);
    window.sentireApp.sidebarAudioPanel = sidebarAudioPanel;
    
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