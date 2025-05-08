/**
 * AudioManager class
 * 
 * Handles microphone access and audio processing for Sentire
 * Designed to work with the state management system and provide audio
 * triggers for themes to respond to.
 */
class AudioManager {
    constructor(stateManager = null) {
        // Store reference to the state manager
        this.stateManager = stateManager;
        
        // Audio settings with defaults
        this.isInitialized = false;
        this.isListening = false;
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.volumeData = new Uint8Array(0);
        this.mediaStream = null;      // Store reference to the media stream
        
        // Volume detection properties
        this.currentVolume = 0;       // Current volume level (0-100)
        this.smoothedVolume = 0;      // Smoothed volume for visualization
        this.volumeThreshold = 50;    // Default threshold for event triggering (0-100)
        this.sensitivity = 1.5;       // Volume sensitivity multiplier
        this.smoothingFactor = 0.2;   // Lower = more smoothing (0-1)
        
        // Debug properties
        this.debugMode = true;        // Whether to show debug view
        this.volumeHistory = [];      // Store recent volume history for visualization
        this.maxHistoryLength = 100;  // Number of history points to retain
        
        // Event handling
        this.eventCallbacks = {};     // Event callbacks by event type
        this.lastTriggerTime = 0;     // To prevent too frequent triggers
        this.triggerCooldown = 300;   // Minimum ms between triggers
        
        // Register with state manager if provided
        if (this.stateManager) {
            // Subscribe to relevant state changes
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'audio');
            
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'appState');
            
            // If debug mode is enabled in state, set our debug mode
            if (this.stateManager.state?.debug !== undefined) {
                this.debugMode = this.stateManager.state.debug;
            }
            
            // Initialize default state if it doesn't exist
            if (!this.stateManager.state.audioConfig) {
                this.stateManager.updateState({
                    audioConfig: {
                        enabled: false,             // Start with audio disabled
                        volumeThreshold: 50,        // Default threshold (0-100)
                        sensitivity: 1.5,           // Default sensitivity multiplier
                        showVisualizer: true,       // Show audio visualization
                        triggerCooldown: 300        // Minimum ms between triggers
                    }
                }, 'AudioManager.constructor');
            }
            
            // Log initialization if debug is enabled
            if (this.stateManager.state.debug) {
                console.log('AudioManager: Initialized with state manager');
            }
        }
    }
    
    /**
     * Initialize the AudioManager with audio context and analyzer
     * @returns {Promise<boolean>} True if initialization was successful
     */
    async init() {
        // Only create AudioContext when specifically requested
        // This avoids triggering the permission prompt on page load
        try {
            if (!this.audioContext) {
                // Create audio context with cross-browser compatibility
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
                
                // Create analyzer node
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 1024;
                this.analyser.smoothingTimeConstant = 0.8;
                
                // Create buffer for volume data
                const bufferLength = this.analyser.frequencyBinCount;
                this.volumeData = new Uint8Array(bufferLength);
                
                // Apply state configuration if available
                if (this.stateManager?.state.audioConfig) {
                    this.applyStateConfig();
                }
                
                this.isInitialized = true;
                
                // Log success if debug mode is enabled
                if (this.debugMode) {
                    console.log('AudioManager: Audio context and analyzer initialized');
                }
            }
            
            return true;
        } catch (error) {
            console.error('AudioManager: Failed to initialize audio context', error);
            return false;
        }
    }
    
    /**
     * Apply configuration from the state manager
     */
    applyStateConfig() {
        if (!this.stateManager) return;
        
        const config = this.stateManager.state.audioConfig;
        if (!config) return;
        
        // Apply configuration values
        this.volumeThreshold = config.volumeThreshold || 50;
        this.sensitivity = config.sensitivity || 1.5;
        this.triggerCooldown = config.triggerCooldown || 300;
        
        // Don't automatically start listening based on saved state
        // This ensures we only listen when the user explicitly clicks enable
        
        // Log if debug mode is enabled
        if (this.debugMode) {
            console.log('AudioManager: Applied state configuration', config);
        }
    }
    
    /**
     * Start listening to microphone input
     * @returns {Promise<boolean>} True if successfully started listening
     */
    async startListening() {
        // Initialize audio context if not already done
        if (!this.isInitialized) {
            const initialized = await this.init();
            if (!initialized) return false;
        }
        
        try {
            if (this.debugMode) {
                console.log('AudioManager: Requesting microphone access...');
            }
            
            // Request microphone access if not already granted
            if (!this.mediaStream) {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: false
                    }
                });
            }
            
            // Log microphone track details if in debug mode
            if (this.debugMode) {
                const audioTracks = this.mediaStream.getAudioTracks();
                console.log(`AudioManager: Got ${audioTracks.length} audio tracks`);
                audioTracks.forEach((track, i) => {
                    console.log(`AudioManager: Track ${i}: ${track.label}, enabled: ${track.enabled}`);
                    console.log(`AudioManager: Track settings:`, track.getSettings());
                });
            }
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            // Connect microphone to analyzer
            this.microphone.connect(this.analyser);
            
            // Resume audio context if it's suspended (needed for Chrome and Safari)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                if (this.debugMode) {
                    console.log('AudioManager: Audio context resumed');
                }
            }
            
            // Log analyser node details
            if (this.debugMode) {
                console.log(`AudioManager: Analyser node configured with:
                - FFT size: ${this.analyser.fftSize}
                - Frequency bin count: ${this.analyser.frequencyBinCount}
                - Min decibels: ${this.analyser.minDecibels}
                - Max decibels: ${this.analyser.maxDecibels}
                - Smoothing time constant: ${this.analyser.smoothingTimeConstant}`);
            }
            
            // Start volume detection loop
            this.isListening = true;
            this.updateVolumeData();
            
            // Update state if state manager is provided
            if (this.stateManager) {
                this.stateManager.updateState({
                    audioConfig: {
                        ...this.stateManager.state.audioConfig,
                        enabled: true
                    }
                }, 'AudioManager.startListening');
            }
            
            // Log success if debug mode is enabled
            if (this.debugMode) {
                console.log('AudioManager: Started listening to microphone');
            }
            
            return true;
        } catch (error) {
            console.error('AudioManager: Failed to access microphone', error);
            
            // Show error message
            const errorMessage = error.name === 'NotAllowedError' 
                ? 'Microphone access denied. Please allow microphone access in your browser settings.'
                : 'Error accessing microphone. Please make sure you have a working microphone connected.';
            
            alert(errorMessage);
            
            return false;
        }
    }
    
    /**
     * Stop listening to microphone input
     */
    stopListening() {
        if (!this.isListening) return;
        
        // Disconnect microphone if exists
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        
        // Note: We intentionally don't stop the mediaStream tracks
        // This prevents the browser from repeatedly asking for permission
        // The stream will remain active for future use
        
        this.isListening = false;
        
        // Update state if state manager is provided
        if (this.stateManager) {
            this.stateManager.updateState({
                audioConfig: {
                    ...this.stateManager.state.audioConfig,
                    enabled: false
                }
            }, 'AudioManager.stopListening');
        }
        
        // Log if debug mode is enabled
        if (this.debugMode) {
            console.log('AudioManager: Stopped listening');
        }
    }
    
    /**
     * Continuously update volume data from the analyzer
     */
    updateVolumeData() {
        if (!this.isListening) return;
        
        // Check if audio context is running
        if (this.audioContext.state !== 'running') {
            this.audioContext.resume().then(() => {
                if (this.debugMode) {
                    console.log('AudioManager: Audio context resumed in updateVolumeData');
                }
            });
        }
        
        // Get volume data from analyzer
        this.analyser.getByteFrequencyData(this.volumeData);
        
        // Debug: Log data properties to check if we're getting actual audio data
        const now = Date.now();
        if (this.debugMode && (!this._lastDebugTime || now - this._lastDebugTime > 2000)) {
            this._lastDebugTime = now;
            const min = Math.min(...this.volumeData);
            const max = Math.max(...this.volumeData);
            const avg = this.volumeData.reduce((sum, val) => sum + val, 0) / this.volumeData.length;
            
            // Only log if there's any non-zero value or every 10 seconds regardless
            if (max > 0 || !this._lastFullDebugTime || now - this._lastFullDebugTime > 10000) {
                this._lastFullDebugTime = now;
                console.log(`AudioManager Debug: Volume data stats - min: ${min}, max: ${max}, avg: ${avg.toFixed(2)}`);
                
                if (max === 0) {
                    console.warn(`AudioManager: No audio signal detected. Check if your microphone is working and properly connected.`);
                    console.log(`AudioManager: AudioContext state: ${this.audioContext.state}`);
                    console.log(`AudioManager: Microphone connection active: ${this.microphone !== null}`);
                }
                
                // Print a sample of the frequency data (first 8 values)
                const sampleData = Array.from(this.volumeData.slice(0, 8));
                console.log(`AudioManager: Sample frequency data: [${sampleData.join(', ')}]`);
            }
        }
        
        // Calculate average volume across all frequency bins
        let sum = 0;
        for (let i = 0; i < this.volumeData.length; i++) {
            sum += this.volumeData[i];
        }
        const rawVolume = sum / this.volumeData.length;
        
        // Apply sensitivity multiplier and convert to 0-100 scale
        this.currentVolume = Math.min(100, rawVolume * this.sensitivity * (100/255));
        
        // Apply smoothing for visualization
        this.smoothedVolume = (this.smoothedVolume * (1 - this.smoothingFactor)) + 
                              (this.currentVolume * this.smoothingFactor);
        
        // Add to history for visualization
        this.addToHistory(this.smoothedVolume);
        
        // Check for threshold crossing and trigger events
        this.checkTriggers();
        
        // Continue updating if still listening
        if (this.isListening) {
            requestAnimationFrame(() => this.updateVolumeData());
        }
    }
    
    /**
     * Add a volume point to the history array
     * @param {number} volume The volume level to add
     */
    addToHistory(volume) {
        this.volumeHistory.push(volume);
        
        // Trim history to max length
        if (this.volumeHistory.length > this.maxHistoryLength) {
            this.volumeHistory.shift();
        }
    }
    
    /**
     * Check if volume crosses threshold and trigger events
     */
    checkTriggers() {
        // Only check if listening and if cooldown period has passed
        const now = Date.now();
        if (!this.isListening || now - this.lastTriggerTime < this.triggerCooldown) {
            return;
        }
        
        // Check if current volume exceeds threshold
        if (this.currentVolume >= this.volumeThreshold) {
            // Enhanced debug info
            const debugInfo = {
                timestamp: now,
                volume: this.currentVolume,
                threshold: this.volumeThreshold,
                timeSinceLastTrigger: now - this.lastTriggerTime,
                audioContextState: this.audioContext ? this.audioContext.state : 'none',
                peakVolumes: [...this.volumeData].sort((a, b) => b - a).slice(0, 5),
                activeEventListeners: Object.keys(this.eventCallbacks).reduce((acc, key) => {
                    acc[key] = this.eventCallbacks[key].length;
                    return acc;
                }, {})
            };
            
            // Trigger volume event
            this.triggerEvent('volumeThreshold', {
                volume: this.currentVolume,
                threshold: this.volumeThreshold,
                timestamp: now
            });
            
            // Update last trigger time
            this.lastTriggerTime = now;
            
            // Log if debug mode is enabled
            if (this.debugMode) {
                console.log(`AudioManager: Volume threshold crossed! Volume: ${this.currentVolume.toFixed(1)}`, debugInfo);
            }
        } else if (this.debugMode && this.currentVolume > this.volumeThreshold * 0.8 && now % 1000 < 50) {
            // Log near-threshold events occasionally (when volume is at least 80% of threshold)
            // We mod with 1000 and check < 50 to only log approximately once per second
            console.log(`AudioManager: Volume near threshold - Current: ${this.currentVolume.toFixed(1)}, Threshold: ${this.volumeThreshold}`);
        }
    }
    
    /**
     * Register a callback for an audio event
     * @param {string} eventType The event type to listen for (e.g., 'volumeThreshold')
     * @param {Function} callback The function to call when the event occurs
     */
    on(eventType, callback) {
        if (!this.eventCallbacks[eventType]) {
            this.eventCallbacks[eventType] = [];
        }
        
        this.eventCallbacks[eventType].push(callback);
        
        // Enhanced debug logging
        const callbackInfo = callback.name || 'anonymous';
        const callbackSource = callback.toString().slice(0, 100) + '...';
        
        // Log if debug mode is enabled
        if (this.debugMode) {
            console.log(`AudioManager: Registered callback for '${eventType}' event`, {
                callbackName: callbackInfo,
                totalListeners: this.eventCallbacks[eventType].length,
                callbackPreview: callbackSource,
                registeredAt: new Date().toISOString()
            });
        }
    }
    
    /**
     * Remove a callback for an audio event
     * @param {string} eventType The event type to remove the callback from
     * @param {Function} callback The callback function to remove
     */
    off(eventType, callback) {
        if (!this.eventCallbacks[eventType]) return;
        
        this.eventCallbacks[eventType] = this.eventCallbacks[eventType]
            .filter(cb => cb !== callback);
            
        // Log if debug mode is enabled
        if (this.debugMode) {
            console.log(`AudioManager: Removed callback for '${eventType}' event`);
        }
    }
    
    /**
     * Trigger an event and call all registered callbacks
     * @param {string} eventType The event type to trigger
     * @param {Object} data Data to pass to the callbacks
     */
    triggerEvent(eventType, data) {
        if (!this.eventCallbacks[eventType]) return;
        
        // Track which callbacks were successful
        const results = [];
        
        // Call all callbacks with the event data
        this.eventCallbacks[eventType].forEach((callback, index) => {
            try {
                const startTime = performance.now();
                callback(data);
                const executionTime = performance.now() - startTime;
                
                results.push({
                    index,
                    success: true,
                    executionTime: executionTime.toFixed(2) + 'ms',
                    callbackName: callback.name || 'anonymous'
                });
            } catch (error) {
                console.error(`AudioManager: Error in '${eventType}' event callback`, error);
                
                results.push({
                    index,
                    success: false,
                    error: error.message,
                    callbackName: callback.name || 'anonymous'
                });
            }
        });
        
        // Log detailed event information if debug mode is enabled
        if (this.debugMode) {
            console.log(`AudioManager: Triggered '${eventType}' event with ${this.eventCallbacks[eventType].length} listeners`, {
                eventData: data,
                results,
                triggeredAt: new Date().toISOString()
            });
        }
    }
    
    /**
     * Set the volume threshold for triggering events
     * @param {number} threshold The threshold value (0-100)
     */
    setVolumeThreshold(threshold) {
        this.volumeThreshold = Math.max(0, Math.min(100, threshold));
        
        // Update state if state manager is provided
        if (this.stateManager) {
            this.stateManager.updateState({
                audioConfig: {
                    ...this.stateManager.state.audioConfig,
                    volumeThreshold: this.volumeThreshold
                }
            }, 'AudioManager.setVolumeThreshold');
        }
    }
    
    /**
     * Set the sensitivity multiplier
     * @param {number} sensitivity The sensitivity multiplier
     */
    setSensitivity(sensitivity) {
        this.sensitivity = Math.max(0.1, sensitivity);
        
        // Update state if state manager is provided
        if (this.stateManager) {
            this.stateManager.updateState({
                audioConfig: {
                    ...this.stateManager.state.audioConfig,
                    sensitivity: this.sensitivity
                }
            }, 'AudioManager.setSensitivity');
        }
    }
    
    /**
     * Set the trigger cooldown period
     * @param {number} cooldown The cooldown period in milliseconds
     */
    setTriggerCooldown(cooldown) {
        this.triggerCooldown = Math.max(0, cooldown);
        
        // Update state if state manager is provided
        if (this.stateManager) {
            this.stateManager.updateState({
                audioConfig: {
                    ...this.stateManager.state.audioConfig,
                    triggerCooldown: this.triggerCooldown
                }
            }, 'AudioManager.setTriggerCooldown');
        }
    }
    
    /**
     * Draw debug visualization on a p5.js canvas
     * @param {p5} canvas The p5.js canvas instance
     * @param {number} x X position of the visualization
     * @param {number} y Y position of the visualization
     * @param {number} width Width of the visualization
     * @param {number} height Height of the visualization
     */
    drawDebugVisualizer(canvas, x, y, width, height) {
        if (!canvas || !this.isInitialized) return;
        
        // Draw background
        canvas.push();
        canvas.fill(0, 0, 0, 180);
        canvas.stroke(100);
        canvas.strokeWeight(1);
        canvas.rect(x, y, width, height);
        
        // Draw volume history graph
        canvas.noFill();
        canvas.stroke(255);
        canvas.strokeWeight(2);
        canvas.beginShape();
        
        const historyStep = width / (this.maxHistoryLength - 1);
        const historyData = [...this.volumeHistory]; // Copy to prevent modification while drawing
        
        for (let i = 0; i < historyData.length; i++) {
            const xPos = x + i * historyStep;
            const yPos = y + height - (historyData[i] / 100 * height);
            canvas.vertex(xPos, yPos);
        }
        
        canvas.endShape();
        
        // Draw threshold line
        const thresholdY = y + height - (this.volumeThreshold / 100 * height);
        canvas.stroke(255, 0, 0);
        canvas.strokeWeight(1);
        canvas.line(x, thresholdY, x + width, thresholdY);
        
        // Draw current volume indicator
        const volumeHeight = (this.smoothedVolume / 100) * height;
        canvas.noStroke();
        canvas.fill(0, 255, 0, 200);
        canvas.rect(x + width + 5, y + height - volumeHeight, 20, volumeHeight);
        
        // Draw labels
        canvas.fill(255);
        canvas.noStroke();
        canvas.textSize(12);
        canvas.textAlign(canvas.LEFT, canvas.TOP);
        canvas.text('Audio Input', x + 5, y + 5);
        canvas.text(`Volume: ${this.smoothedVolume.toFixed(1)}`, x + 5, y + 20);
        canvas.text(`Threshold: ${this.volumeThreshold}`, x + 5, y + 35);
        canvas.text(`Sensitivity: ${this.sensitivity.toFixed(1)}`, x + 5, y + 50);
        
        // Draw status indicator
        const statusColor = this.isListening ? color(0, 255, 0) : color(255, 0, 0);
        const statusText = this.isListening ? 'Listening' : 'Not Listening';
        canvas.fill(statusColor);
        canvas.ellipse(x + width - 10, y + 10, 10, 10);
        canvas.fill(255);
        canvas.textAlign(canvas.RIGHT, canvas.TOP);
        canvas.text(statusText, x + width - 20, y + 5);
        
        canvas.pop();
    }
    
    /**
     * Observer method called when state changes
     * @param {Object} newState - New application state
     * @param {Object} oldState - Previous application state
     */
    onStateUpdate(newState, oldState) {
        // Check if audio config has changed
        const configChanged = 
            !oldState.audioConfig ||
            JSON.stringify(newState.audioConfig) !== 
            JSON.stringify(oldState.audioConfig);
            
        // If debug mode changed, update our debug flag
        if (newState.debug !== oldState.debug) {
            this.debugMode = newState.debug;
        }
        
        // If audio config changed, apply the new configuration
        // but don't automatically start listening from state changes
        if (configChanged) {
            // Apply configuration values only
            if (newState.audioConfig) {
                this.volumeThreshold = newState.audioConfig.volumeThreshold || 50;
                this.sensitivity = newState.audioConfig.sensitivity || 1.5;
                this.triggerCooldown = newState.audioConfig.triggerCooldown || 300;
            }
            
            if (this.debugMode) {
                console.log('AudioManager: Updated from state change');
            }
        }
    }
    
    /**
     * Clean up resources when the application closes
     * Should be called when the app is closing or on page unload
     */
    cleanup() {
        // Stop listening if active
        if (this.isListening) {
            this.stopListening();
        }
        
        // Properly close the media stream if it exists
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Close audio context if it exists
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        if (this.debugMode) {
            console.log('AudioManager: Resources cleaned up');
        }
    }
}

// Make AudioManager available globally
window.AudioManager = AudioManager;