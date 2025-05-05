/**
 * StateManager - Core state management system for Sentire Music Therapy App
 * 
 * This class provides centralized state management using an observer pattern.
 * It handles all application state, manages transitions between states,
 * and notifies observers of state changes.
 */
class StateManager {
    constructor(debug = false) {
        // Core application state
        this.state = {
            // App info
            appName: 'Sentire',
            version: '1.0.0',
            debug: debug,
            
            // App state
            isRunning: false,
            isFullscreen: false,
            isTransitioning: false,
            
            // Current theme
            currentTheme: 'snowflakes',
            
            // Theme configurations - each theme has its own configuration object
            themeConfigs: {
                snowflakes: {
                    backgroundColor: '#000A28',
                    snowflakeColor: '#FFFFFF',
                    count: 200,
                    size: 10,
                    speed: 1,
                    wobbleIntensity: 5,
                    windStrength: 0,
                    windDirection: 0
                }
                // Additional themes will be added here
            },
            
            // Audio configuration
            audioConfig: {
                enabled: false,
                volumeThreshold: 50,
                sensitivity: 1.5,
                showVisualizer: true,
                triggerCooldown: 300
            }
        };
        
        // Keep a history of state changes for debugging
        this.stateHistory = [];
        
        // Store observers that will be notified of state changes
        this.observers = {
            // Global observers receive all state changes
            global: [],
            
            // Specific observers only receive relevant state changes
            appState: [],
            theme: [],
            themeConfigs: [],
            audio: [] // Add audio observer type
        };
        
        // Store last update timestamp
        this.lastUpdate = Date.now();
        
        // Debug logging
        if (debug) {
            console.log('StateManager: Initialized with debug mode enabled');
            console.log('StateManager: Initial state:', JSON.parse(JSON.stringify(this.state)));
        }
    }
    
    /**
     * Subscribe to state changes
     * @param {Object} observer - Object with update method
     * @param {String} type - Type of state changes to listen for (optional)
     */
    subscribe(observer, type = 'global') {
        if (!observer || typeof observer.update !== 'function') {
            throw new Error('Observer must have an update method');
        }
        
        if (!this.observers[type]) {
            throw new Error(`Unknown observer type: ${type}`);
        }
        
        this.observers[type].push(observer);
        
        if (this.state.debug) {
            console.log(`StateManager: Observer added to ${type} listeners`);
        }
        
        return {
            unsubscribe: () => this.unsubscribe(observer, type)
        };
    }
    
    /**
     * Unsubscribe from state changes
     * @param {Object} observer - Observer to remove
     * @param {String} type - Type of state changes
     */
    unsubscribe(observer, type = 'global') {
        if (!this.observers[type]) {
            return;
        }
        
        this.observers[type] = this.observers[type].filter(obs => obs !== observer);
        
        if (this.state.debug) {
            console.log(`StateManager: Observer removed from ${type} listeners`);
        }
    }
    
    /**
     * Update application state
     * @param {Object} changes - Object containing state changes
     * @param {String} source - Source of the update (for debugging)
     * @returns {Boolean} - Whether the state was updated
     */
    updateState(changes, source = 'unknown') {
        if (!changes || Object.keys(changes).length === 0) {
            if (this.state.debug) {
                console.warn('StateManager: No changes provided to updateState');
            }
            return false;
        }
        
        const timestamp = Date.now();
        const previousState = JSON.parse(JSON.stringify(this.state));
        
        // Track which observer types need to be notified
        const notifyTypes = new Set(['global']);
        
        // Process changes and update state
        let hasChanges = false;
        
        // Helper function to deep merge changes
        const processChanges = (target, changes, path = []) => {
            Object.keys(changes).forEach(key => {
                const currentPath = [...path, key];
                const pathString = currentPath.join('.');
                
                // Special handling for themeConfigs changes
                if (pathString.startsWith('themeConfigs')) {
                    notifyTypes.add('themeConfigs');
                    
                    // If changing current theme's config, also notify theme observers
                    const themeMatch = pathString.match(/^themeConfigs\.([^.]+)/);
                    if (themeMatch && themeMatch[1] === this.state.currentTheme) {
                        notifyTypes.add('theme');
                    }
                } 
                // Handle theme changes
                else if (key === 'currentTheme') {
                    notifyTypes.add('theme');
                } 
                // Handle app state changes
                else if (['isRunning', 'isFullscreen', 'isTransitioning'].includes(key)) {
                    notifyTypes.add('appState');
                }
                // Handle audio configuration changes
                else if (pathString.startsWith('audioConfig')) {
                    notifyTypes.add('audio');
                }
                
                if (typeof changes[key] === 'object' && changes[key] !== null && !Array.isArray(changes[key]) && 
                    typeof target[key] === 'object' && target[key] !== null) {
                    // Recursively process nested objects
                    if (!target[key]) target[key] = {};
                    processChanges(target[key], changes[key], currentPath);
                } else {
                    // Check if value is actually changing
                    if (target[key] !== changes[key]) {
                        target[key] = changes[key];
                        hasChanges = true;
                        
                        if (this.state.debug) {
                            console.log(`StateManager: State change - ${pathString} = `, changes[key]);
                        }
                    }
                }
            });
        };
        
        // Process all changes
        processChanges(this.state, changes);
        
        // If no actual changes were made, return
        if (!hasChanges) {
            if (this.state.debug) {
                console.log('StateManager: No actual state changes detected');
            }
            return false;
        }
        
        // Record the state change in history (limited to last 100 changes)
        if (this.state.debug) {
            this.stateHistory.push({
                timestamp,
                source,
                duration: timestamp - this.lastUpdate,
                changes: this._getChangedProperties(previousState, this.state),
                previousState,
                newState: JSON.parse(JSON.stringify(this.state))
            });
            
            // Keep history limited to last 100 entries
            if (this.stateHistory.length > 100) {
                this.stateHistory.shift();
            }
        }
        
        this.lastUpdate = timestamp;
        
        // Notify observers
        this._notifyObservers(Array.from(notifyTypes), previousState);
        
        return true;
    }
    
    /**
     * Get the current complete state
     * @returns {Object} - Current application state
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    
    /**
     * Get specific section of state
     * @param {String} path - Dot notation path to desired state 
     * @returns {any} - Requested portion of state or undefined
     */
    getStateSection(path) {
        if (!path) return undefined;
        
        const parts = path.split('.');
        let section = this.state;
        
        for (const part of parts) {
            if (section === undefined || section === null) return undefined;
            section = section[part];
        }
        
        // Return a clone to prevent direct mutations
        return typeof section === 'object' && section !== null 
            ? JSON.parse(JSON.stringify(section))
            : section;
    }
    
    /**
     * Get current theme configuration
     * @returns {Object} Configuration for current theme
     */
    getCurrentThemeConfig() {
        return JSON.parse(
            JSON.stringify(this.state.themeConfigs[this.state.currentTheme] || {})
        );
    }
    
    /**
     * Set specific theme parameter
     * @param {String} param - Parameter name
     * @param {any} value - Parameter value
     * @param {String} themeName - Optional theme name (defaults to current)
     */
    setThemeParam(param, value, themeName = null) {
        const theme = themeName || this.state.currentTheme;
        
        if (!this.state.themeConfigs[theme]) {
            if (this.state.debug) {
                console.error(`StateManager: Cannot set parameter for unknown theme: ${theme}`);
            }
            return false;
        }
        
        const changes = {
            themeConfigs: {
                [theme]: {
                    [param]: value
                }
            }
        };
        
        return this.updateState(changes, `setThemeParam(${param})`);
    }
    
    /**
     * Debug function to print state history
     * @param {Number} limit - Number of history entries to show
     */
    printStateHistory(limit = 10) {
        if (!this.state.debug) {
            console.warn('StateManager: Debug mode is disabled, enable it to track state history');
            return;
        }
        
        console.group('StateManager: State History (Most Recent First)');
        
        const historyToShow = this.stateHistory.slice(-limit).reverse();
        
        if (historyToShow.length === 0) {
            console.log('No state changes recorded yet');
        }
        
        historyToShow.forEach((entry, index) => {
            console.group(`${index + 1}. State change from ${entry.source} (${new Date(entry.timestamp).toLocaleTimeString()})`);
            console.log('Changed properties:', entry.changes);
            console.log(`Update took ${entry.duration}ms`);
            console.log('Previous state:', entry.previousState);
            console.log('New state:', entry.newState);
            console.groupEnd();
        });
        
        console.groupEnd();
    }
    
    /**
     * Enable or disable debug mode
     * @param {Boolean} enabled - Whether debug mode should be enabled
     */
    setDebugMode(enabled) {
        this.updateState({ debug: !!enabled }, 'setDebugMode');
        
        if (enabled) {
            console.log('StateManager: Debug mode enabled - state changes will be logged');
        } else {
            console.log('StateManager: Debug mode disabled - state changes will not be logged');
        }
    }
    
    /**
     * Compare two states and get a list of changed properties
     * @private
     * @param {Object} oldState - Previous state
     * @param {Object} newState - New state
     * @returns {Object} - Object with changed property paths
     */
    _getChangedProperties(oldState, newState, path = '') {
        const changes = {};
        
        // Check properties in new state
        for (const key in newState) {
            const currentPath = path ? `${path}.${key}` : key;
            
            // If property doesn't exist in old state or types don't match
            if (!(key in oldState) || typeof oldState[key] !== typeof newState[key]) {
                changes[currentPath] = {
                    from: oldState[key],
                    to: newState[key]
                };
            } 
            // If property is object (and not null), check nested properties
            else if (typeof newState[key] === 'object' && newState[key] !== null && !Array.isArray(newState[key])) {
                const nestedChanges = this._getChangedProperties(oldState[key], newState[key], currentPath);
                Object.assign(changes, nestedChanges);
            } 
            // For arrays, just check if they're different
            else if (Array.isArray(newState[key]) && JSON.stringify(oldState[key]) !== JSON.stringify(newState[key])) {
                changes[currentPath] = {
                    from: oldState[key],
                    to: newState[key]
                };
            }
            // For primitive values, do direct comparison
            else if (oldState[key] !== newState[key]) {
                changes[currentPath] = {
                    from: oldState[key],
                    to: newState[key]
                };
            }
        }
        
        // Check for properties in old state that were removed in new state
        for (const key in oldState) {
            const currentPath = path ? `${path}.${key}` : key;
            if (!(key in newState)) {
                changes[currentPath] = {
                    from: oldState[key],
                    to: undefined
                };
            }
        }
        
        return changes;
    }
    
    /**
     * Notify observers of state changes
     * @private
     * @param {Array} types - Types of observers to notify
     * @param {Object} previousState - Previous application state
     */
    _notifyObservers(types, previousState) {
        const startTime = Date.now();
        let notifiedCount = 0;
        
        types.forEach(type => {
            this.observers[type].forEach(observer => {
                try {
                    observer.update(this.state, previousState);
                    notifiedCount++;
                } catch (error) {
                    if (this.state.debug) {
                        console.error(`StateManager: Observer update error:`, error);
                    }
                }
            });
        });
        
        const duration = Date.now() - startTime;
        
        if (this.state.debug && notifiedCount > 0) {
            console.log(`StateManager: Notified ${notifiedCount} observers in ${duration}ms`);
        }
    }
}