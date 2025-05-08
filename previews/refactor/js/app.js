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

/**
 * Creates a visual console for mobile debugging
 */
function createVisualConsole() {
    // Only create the console if it doesn't already exist
    if (document.getElementById('mobile-debug-console')) {
        return;
    }
    
    // Create container
    const consoleDiv = document.createElement('div');
    consoleDiv.id = 'mobile-debug-console';
    consoleDiv.style.position = 'fixed';
    consoleDiv.style.bottom = '0';
    consoleDiv.style.left = '0';
    consoleDiv.style.width = '100%';
    consoleDiv.style.maxHeight = '40vh';
    consoleDiv.style.overflowY = 'auto';
    consoleDiv.style.backgroundColor = 'rgba(0,0,0,0.85)';
    consoleDiv.style.color = 'white';
    consoleDiv.style.fontFamily = 'monospace';
    consoleDiv.style.fontSize = '10px';
    consoleDiv.style.padding = '5px';
    consoleDiv.style.zIndex = '10000';
    consoleDiv.style.display = 'none'; // Initially hidden
    consoleDiv.style.borderTop = '1px solid #444';
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'mobile-debug-toggle';
    toggleButton.textContent = 'Show Debug Log';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '0';
    toggleButton.style.right = '0';
    toggleButton.style.zIndex = '10001';
    toggleButton.style.fontSize = '12px';
    toggleButton.style.padding = '6px 10px';
    toggleButton.style.backgroundColor = '#2a5ca8';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderTopLeftRadius = '4px';
    
    // Toggle console visibility
    toggleButton.addEventListener('click', () => {
        if (consoleDiv.style.display === 'none') {
            consoleDiv.style.display = 'block';
            toggleButton.textContent = 'Hide Debug Log';
        } else {
            consoleDiv.style.display = 'none';
            toggleButton.textContent = 'Show Debug Log';
        }
    });
    
    // Add touch event for mobile
    toggleButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (consoleDiv.style.display === 'none') {
            consoleDiv.style.display = 'block';
            toggleButton.textContent = 'Hide Debug Log';
        } else {
            consoleDiv.style.display = 'none';
            toggleButton.textContent = 'Show Debug Log';
        }
    }, { passive: false });
    
    document.body.appendChild(consoleDiv);
    document.body.appendChild(toggleButton);
    
    // Create clear button and filter controls in a toolbar
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.borderBottom = '1px solid #444';
    toolbar.style.padding = '5px';
    toolbar.style.backgroundColor = '#222';
    
    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.style.marginRight = '5px';
    clearButton.style.fontSize = '10px';
    clearButton.style.padding = '2px 6px';
    clearButton.style.backgroundColor = '#444';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '2px';
    
    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = 'Filter logs...';
    filterInput.style.flex = '1';
    filterInput.style.padding = '2px 5px';
    filterInput.style.fontSize = '10px';
    filterInput.style.backgroundColor = '#333';
    filterInput.style.color = 'white';
    filterInput.style.border = 'none';
    filterInput.style.borderRadius = '2px';
    
    // Add buttons for common filters
    const createFilterButton = (text, filter) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.marginLeft = '3px';
        button.style.fontSize = '10px';
        button.style.padding = '2px 5px';
        button.style.backgroundColor = '#444';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '2px';
        button.addEventListener('click', () => {
            filterInput.value = filter;
            // Trigger input event to apply filter
            filterInput.dispatchEvent(new Event('input'));
        });
        return button;
    };
    
    const audioButton = createFilterButton('Audio', 'Audio');
    const snowflakeButton = createFilterButton('Snowflake', 'Snowflake');
    
    toolbar.appendChild(clearButton);
    toolbar.appendChild(filterInput);
    toolbar.appendChild(audioButton);
    toolbar.appendChild(snowflakeButton);
    
    consoleDiv.appendChild(toolbar);
    
    // Create log container
    const logContainer = document.createElement('div');
    logContainer.id = 'mobile-debug-logs';
    logContainer.style.paddingTop = '5px';
    consoleDiv.appendChild(logContainer);
    
    // Clear button logic
    clearButton.addEventListener('click', () => {
        while (logContainer.firstChild) {
            logContainer.removeChild(logContainer.firstChild);
        }
    });
    
    // Filter logic
    filterInput.addEventListener('input', () => {
        const filter = filterInput.value.toLowerCase();
        Array.from(logContainer.children).forEach(logLine => {
            if (filter === '' || logLine.textContent.toLowerCase().includes(filter)) {
                logLine.style.display = 'block';
            } else {
                logLine.style.display = 'none';
            }
        });
    });
    
    // Limit log entries to keep performance reasonable
    const MAX_LOG_ENTRIES = 200;
    
    // Override console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function() {
        const args = Array.from(arguments);
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
        
        addLogEntry('log', message);
        
        // Call the original method
        originalLog.apply(console, arguments);
    };
    
    console.error = function() {
        const args = Array.from(arguments);
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
        
        addLogEntry('error', message);
        
        originalError.apply(console, arguments);
    };
    
    console.warn = function() {
        const args = Array.from(arguments);
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
        
        addLogEntry('warn', message);
        
        originalWarn.apply(console, arguments);
    };
    
    function addLogEntry(type, message) {
        const logLine = document.createElement('div');
        logLine.style.fontSize = '10px';
        logLine.style.marginBottom = '2px';
        logLine.style.wordBreak = 'break-word';
        logLine.style.fontFamily = 'monospace';
        
        const timestamp = new Date().toISOString().substr(11, 8);
        
        // Apply different colors based on log type
        switch (type) {
            case 'error':
                logLine.style.color = '#ff5555';
                break;
            case 'warn':
                logLine.style.color = '#ffaa55';
                break;
            default:
                logLine.style.color = '#bbbbbb';
        }
        
        logLine.textContent = `${timestamp} [${type.toUpperCase()}] ${message}`;
        
        // Add to the top of the log container (newest first)
        logContainer.insertBefore(logLine, logContainer.firstChild);
        
        // Limit the number of log entries to maintain performance
        if (logContainer.children.length > MAX_LOG_ENTRIES) {
            logContainer.removeChild(logContainer.lastChild);
        }
        
        // Check if the filter should hide this entry
        const filter = filterInput.value.toLowerCase();
        if (filter !== '' && !logLine.textContent.toLowerCase().includes(filter)) {
            logLine.style.display = 'none';
        }
    }
    
    // Log that the visual console is ready
    console.log('Mobile visual console initialized');
}

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
    
    // Initialize the mobile visual console
    setTimeout(createVisualConsole, 500);
});