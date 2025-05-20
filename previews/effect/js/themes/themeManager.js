/**
 * ThemeManager class that works with the state management system
 */
class ThemeManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.themes = {};
        this.currentTheme = null;
        
        // Subscribe to theme changes from state using onStateUpdate instead of update
        this.stateManager.subscribe({
            update: this.onStateUpdate.bind(this)
        }, 'theme');
        
        this.stateManager.subscribe({
            update: this.onStateUpdate.bind(this) 
        }, 'appState');
        
        if (this.stateManager.state.debug) {
            console.log('ThemeManager: Initialized with state manager');
        }
    }

    /**
     * Register a theme with the theme manager
     * @param {string} id - Unique identifier for the theme
     * @param {Theme} theme - An instance of a Theme-derived class
     */
    registerTheme(id, theme) {
        this.themes[id] = theme;
        
        // If this is the current theme according to state, activate it
        if (id === this.stateManager.state.currentTheme && !this.currentTheme) {
            this.switchTheme(id);
        }
        
        if (this.stateManager.state.debug) {
            console.log(`ThemeManager: Registered theme "${id}"`);
        }
    }

    /**
     * Get a theme by its ID
     * @param {string} id - Theme identifier
     * @returns {Theme} The requested theme or null
     */
    getTheme(id) {
        return this.themes[id] || null;
    }

    /**
     * Initialize all themes with a p5.js canvas
     * @param {p5} canvas - The p5.js instance
     */
    initThemes(canvas) {
        for (const id in this.themes) {
            this.themes[id].init(canvas);
        }
        
        // Apply current state to theme
        this.applyState();
        
        if (this.stateManager.state.debug) {
            console.log('ThemeManager: All themes initialized with canvas');
        }
    }

    /**
     * Switch to a different theme
     * @param {string} id - The ID of the theme to switch to
     * @returns {boolean} True if switch was successful
     */
    switchTheme(id) {
        // Check if theme exists
        const newTheme = this.getTheme(id);
        if (!newTheme) {
            console.error(`ThemeManager: Theme with id "${id}" does not exist.`);
            return false;
        }

        // Stop and cleanup current theme if there is one
        if (this.currentTheme) {
            this.currentTheme.stop();
            this.currentTheme.cleanup();
        }

        // Set new theme as current
        this.currentTheme = newTheme;
        
        if (this.stateManager.state.debug) {
            console.log(`ThemeManager: Switched to theme "${id}"`);
        }
        
        return true;
    }

    /**
     * Apply the current state to the active theme
     */
    applyState() {
        const state = this.stateManager.getState();
        
        // Switch theme if needed
        if (this.currentTheme !== this.themes[state.currentTheme]) {
            this.switchTheme(state.currentTheme);
        }
        
        // Start or stop theme based on running state
        if (state.isRunning) {
            this.startCurrentTheme();
        } else {
            this.stopCurrentTheme();
        }
    }

    /**
     * Start the current theme's animation
     */
    startCurrentTheme() {
        if (this.currentTheme) {
            this.currentTheme.start();
            
            if (this.stateManager.state.debug) {
                console.log('ThemeManager: Started current theme');
            }
            
            return true;
        }
        return false;
    }

    /**
     * Stop the current theme's animation
     */
    stopCurrentTheme() {
        if (this.currentTheme) {
            this.currentTheme.stop();
            
            if (this.stateManager.state.debug) {
                console.log('ThemeManager: Stopped current theme');
            }
            
            return true;
        }
        return false;
    }
    
    /**
     * Observer method called when state changes - renamed to avoid collision
     * @param {Object} newState - New application state
     * @param {Object} oldState - Previous application state
     */
    onStateUpdate(newState, oldState) {
        // Check if theme-related state has changed
        const themeChanged = newState.currentTheme !== oldState.currentTheme;
        const runningChanged = newState.isRunning !== oldState.isRunning;
        
        // If any relevant state has changed, apply state
        if (themeChanged || runningChanged) {
            this.applyState();
        }
    }

    /**
     * Activate a theme - properly handling theme transitions
     * @param {string} id - The ID of the theme to activate
     * @param {boolean} preserveRunning - Whether to preserve the running state when switching
     * @returns {boolean} True if activation was successful
     */
    activateTheme(id, preserveRunning = true) {
        // Get current running state
        const wasRunning = this.stateManager.state.isRunning;
        
        // Switch to the new theme
        if (!this.switchTheme(id)) {
            return false;
        }
        
        // Force the theme to run setup again to reinitialize any resources
        if (this.currentTheme && this.currentTheme.canvas) {
            this.currentTheme.setup();
            
            if (this.stateManager.state.debug) {
                console.log(`ThemeManager: Re-initialized theme "${id}" after switching`);
            }
        }
        
        // Update the state with new theme
        this.stateManager.updateState({ currentTheme: id }, 'ThemeManager.activateTheme');
        
        // If the animation was running and we want to preserve that state, start the new theme
        if (preserveRunning && wasRunning) {
            this.startCurrentTheme();
        }
        
        return true;
    }
}