/**
 * UIController - Connects UI elements to the state manager
 * 
 * This class is responsible for:
 * 1. Setting up event listeners for UI controls
 * 2. Updating UI elements when state changes
 * 3. Sending UI events to the state manager
 */
class UIController {
    constructor(stateManager) {
        this.stateManager = stateManager;
        
        // Store references to UI elements
        this.elements = {
            // Theme selector
            themeSelect: document.getElementById('theme-select'),
            
            // Buttons
            startBtn: document.getElementById('start-btn'),
            stopBtn: document.getElementById('stop-btn'),
            fullscreenBtn: document.getElementById('fullscreen-btn'),
            
            // Containers
            themeControlsContainers: document.querySelectorAll('.theme-controls'),
            canvasContainer: document.getElementById('canvas-container')
        };
        
        // Map for snowflake controls
        this.snowflakeControlMap = {
            'background-color': 'backgroundColor',
            'snowflake-color': 'snowflakeColor',
            'snowflake-count': 'count',
            'snowflake-size': 'size',
            'snowflake-speed': 'speed',
            'wobble-intensity': 'wobbleIntensity',
            'wind-strength': 'windStrength',
            'wind-direction': 'windDirection'
        };
        
        // Map for underwater controls
        this.underwaterControlMap = {
            'underwater-background-color': 'backgroundColor',
            'bubble-color': 'bubbleColor',
            'bubble-count': 'bubbleCount',
            'fish-count': 'fishCount',
            'bubble-size': 'bubbleSize',
            'fish-size': 'fishSize',
            'bubble-speed': 'bubbleSpeed',
            'fish-speed': 'fishSpeed',
            'underwater-wobble-intensity': 'wobbleIntensity',
            'current-strength': 'currentStrength',
            'current-direction': 'currentDirection'
        };
        
        // Special formatting for some controls
        this.valueFormatters = {
            'wind-direction': (value) => `${value}°`,
            'snowflake-speed': (value) => value.toFixed(1),
            'current-direction': (value) => `${value}°`,
            'bubble-speed': (value) => value.toFixed(1),
            'fish-speed': (value) => value.toFixed(1)
        };
        
        // Initialize UI based on current state
        this.initializeUI();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Subscribe to state changes
        this.stateManager.subscribe(this, 'global');
        
        if (this.stateManager.state.debug) {
            console.log('UIController: Initialized');
        }
    }
    
    /**
     * Initialize UI elements based on current state
     */
    initializeUI() {
        const state = this.stateManager.getState();
        
        // Set theme selector
        if (this.elements.themeSelect) {
            this.elements.themeSelect.value = state.currentTheme;
        }
        
        // Set button states
        if (this.elements.startBtn) {
            this.elements.startBtn.disabled = state.isRunning;
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.disabled = !state.isRunning;
        }
        
        // Show correct theme controls
        this.updateThemeControlsVisibility(state.currentTheme);
        
        // Set control values for current theme
        this.updateControlValues(state.currentTheme);
        
        if (state.debug) {
            console.log('UIController: UI initialized');
        }
    }
    
    /**
     * Set up event listeners for UI controls
     */
    setupEventListeners() {
        // Theme selector
        if (this.elements.themeSelect) {
            this.elements.themeSelect.addEventListener('change', (e) => {
                const newTheme = e.target.value;
                this.stateManager.updateState({ currentTheme: newTheme }, 'themeSelect');
            });
        }
        
        // Button controls
        if (this.elements.startBtn) {
            this.elements.startBtn.addEventListener('click', () => {
                this.stateManager.updateState({ isRunning: true }, 'startBtn');
            });
        }
        
        if (this.elements.stopBtn) {
            this.elements.stopBtn.addEventListener('click', () => {
                this.stateManager.updateState({ isRunning: false }, 'stopBtn');
            });
        }
        
        if (this.elements.fullscreenBtn) {
            this.elements.fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
        
        // Set up theme controls
        this.setupThemeControlListeners('snowflakes');
        this.setupThemeControlListeners('underwater');
        
        if (this.stateManager.state.debug) {
            console.log('UIController: Event listeners set up');
        }
    }
    
    /**
     * Set up listeners for all controls in a theme panel
     * @param {String} themeName - Name of theme
     */
    setupThemeControlListeners(themeName) {
        const container = document.querySelector(`.${themeName}-controls`);
        if (!container) return;
        
        // Select the appropriate control map based on theme name
        const controlMap = themeName === 'underwater' ? this.underwaterControlMap : this.snowflakeControlMap;
        
        // Color pickers
        const colorPickers = container.querySelectorAll('input[type="color"]');
        colorPickers.forEach(picker => {
            picker.addEventListener('input', (e) => {
                const controlId = e.target.id;
                const stateKey = controlMap[controlId];
                
                if (stateKey) {
                    this.stateManager.setThemeParam(stateKey, e.target.value, themeName);
                }
            });
        });
        
        // Sliders
        const sliders = container.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const controlId = e.target.id;
                const stateKey = controlMap[controlId];
                
                if (stateKey) {
                    // Update display value
                    const valueElement = document.getElementById(`${controlId}-value`);
                    if (valueElement) {
                        const formatter = this.valueFormatters[controlId];
                        valueElement.textContent = formatter 
                            ? formatter(parseFloat(e.target.value)) 
                            : e.target.value;
                    }
                    
                    // Update state
                    this.stateManager.setThemeParam(
                        stateKey, 
                        parseFloat(e.target.value),
                        themeName
                    );
                }
            });
        });
        
        if (this.stateManager.state.debug) {
            console.log(`UIController: Set up listeners for ${themeName} controls`);
        }
    }
    
    /**
     * Show the correct theme controls panel
     * @param {String} themeName - Theme name
     */
    updateThemeControlsVisibility(themeName) {
        this.elements.themeControlsContainers.forEach(container => {
            if (container.classList.contains(`${themeName}-controls`)) {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    }
    
    /**
     * Update all UI control values based on state
     * @param {String} themeName - Theme name
     */
    updateControlValues(themeName) {
        const config = this.stateManager.getStateSection(`themeConfigs.${themeName}`);
        if (!config) return;
        
        // Select the appropriate control map based on theme name
        const controlMap = themeName === 'underwater' ? this.underwaterControlMap : this.snowflakeControlMap;
        
        // We need to map state keys back to control IDs
        const reverseMap = {};
        Object.entries(controlMap).forEach(([controlId, stateKey]) => {
            reverseMap[stateKey] = controlId;
        });
        
        // Update each control
        Object.entries(config).forEach(([stateKey, value]) => {
            const controlId = reverseMap[stateKey];
            if (!controlId) return;
            
            const control = document.getElementById(controlId);
            if (control) {
                // Set the control value
                control.value = value;
                
                // Update value display for sliders
                const valueDisplay = document.getElementById(`${controlId}-value`);
                if (valueDisplay) {
                    const formatter = this.valueFormatters[controlId];
                    valueDisplay.textContent = formatter 
                        ? formatter(parseFloat(value)) 
                        : value;
                }
            }
        });
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            // Enter fullscreen
            const canvasContainer = this.elements.canvasContainer;
            if (canvasContainer.requestFullscreen) {
                canvasContainer.requestFullscreen();
            } else if (canvasContainer.webkitRequestFullscreen) {
                canvasContainer.webkitRequestFullscreen();
            } else if (canvasContainer.msRequestFullscreen) {
                canvasContainer.msRequestFullscreen();
            }
            
            this.stateManager.updateState({ isFullscreen: true }, 'fullscreenBtn');
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
            this.stateManager.updateState({ isFullscreen: false }, 'fullscreenBtn');
        }
    }
    
    /**
     * Observer update method called when state changes
     * @param {Object} newState - New application state
     * @param {Object} oldState - Previous application state
     */
    update(newState, oldState) {
        // Update theme controls visibility if theme changed
        if (oldState.currentTheme !== newState.currentTheme) {
            this.updateThemeControlsVisibility(newState.currentTheme);
            this.updateControlValues(newState.currentTheme);
        }
        
        // Update button states if running state changed
        if (oldState.isRunning !== newState.isRunning) {
            if (this.elements.startBtn) {
                this.elements.startBtn.disabled = newState.isRunning;
            }
            if (this.elements.stopBtn) {
                this.elements.stopBtn.disabled = !newState.isRunning;
            }
        }
        
        // If theme config was updated externally (not by UI), update UI
        const oldConfig = oldState.themeConfigs[newState.currentTheme];
        const newConfig = newState.themeConfigs[newState.currentTheme];
        
        if (oldConfig && newConfig && JSON.stringify(oldConfig) !== JSON.stringify(newConfig)) {
            this.updateControlValues(newState.currentTheme);
        }
    }
}