/**
 * SidebarAudioPanel class
 * 
 * Integrates audio controls into the main sidebar for all themes
 * Provides controls for microphone, threshold, and sensitivity settings
 * that are accessible regardless of which theme is active
 */
class SidebarAudioPanel {
    constructor(stateManager = null, audioManager = null) {
        this.stateManager = stateManager;
        this.audioManager = audioManager;
        
        // References to DOM elements
        this.elements = {
            microphoneToggle: document.getElementById('microphone-toggle'),
            thresholdSlider: document.getElementById('audio-threshold'),
            thresholdValue: document.getElementById('audio-threshold-value'),
            sensitivitySlider: document.getElementById('audio-sensitivity'),
            sensitivityValue: document.getElementById('audio-sensitivity-value'),
            visualizer: document.getElementById('audio-visualizer')
        };
        
        // Initialize the panel if managers are available
        if (this.stateManager && this.audioManager) {
            this.initializePanel();
        } else {
            console.warn('SidebarAudioPanel: Missing stateManager or audioManager');
        }
    }
    
    /**
     * Set the audio manager instance
     * @param {AudioManager} audioManager The audio manager instance
     */
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
        
        // Initialize if both managers are now available
        if (this.stateManager && this.audioManager) {
            this.initializePanel();
        }
    }
    
    /**
     * Set the state manager instance
     * @param {StateManager} stateManager The state manager instance
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
        
        // Initialize if both managers are now available
        if (this.stateManager && this.audioManager) {
            this.initializePanel();
        }
    }
    
    /**
     * Initialize the sidebar audio panel
     * Sets up the controls and starts visualization
     */
    initializePanel() {
        // Initialize values based on audio manager state
        this.updateControlValues();
        
        // Set up event listeners for controls
        this.setupEventListeners();
        
        // Start the visualization
        this.startVisualization();
        
        // Subscribe to state changes
        if (this.stateManager) {
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'audio');
        }
        
        if (this.audioManager.debugMode) {
            console.log('SidebarAudioPanel: Panel initialized');
        }
    }
    
    /**
     * Set up event listeners for audio controls
     */
    setupEventListeners() {
        // Microphone toggle button
        if (this.elements.microphoneToggle) {
            this.elements.microphoneToggle.addEventListener('click', async () => {
                if (this.audioManager.isListening) {
                    this.audioManager.stopListening();
                    this.updateMicrophoneToggle(false);
                } else {
                    const success = await this.audioManager.startListening();
                    this.updateMicrophoneToggle(success);
                }
            });
        }
        
        // Threshold slider
        if (this.elements.thresholdSlider) {
            this.elements.thresholdSlider.addEventListener('input', () => {
                const threshold = parseInt(this.elements.thresholdSlider.value);
                this.audioManager.setVolumeThreshold(threshold);
                
                if (this.elements.thresholdValue) {
                    this.elements.thresholdValue.textContent = threshold;
                }
            });
        }
        
        // Sensitivity slider
        if (this.elements.sensitivitySlider) {
            this.elements.sensitivitySlider.addEventListener('input', () => {
                const sensitivity = parseFloat(this.elements.sensitivitySlider.value);
                this.audioManager.setSensitivity(sensitivity);
                
                if (this.elements.sensitivityValue) {
                    this.elements.sensitivityValue.textContent = sensitivity.toFixed(1);
                }
            });
        }
    }
    
    /**
     * Update control values based on audio manager state
     */
    updateControlValues() {
        // Update microphone toggle
        this.updateMicrophoneToggle(this.audioManager.isListening);
        
        // Update threshold slider and value
        if (this.elements.thresholdSlider) {
            this.elements.thresholdSlider.value = this.audioManager.volumeThreshold;
        }
        
        if (this.elements.thresholdValue) {
            this.elements.thresholdValue.textContent = this.audioManager.volumeThreshold;
        }
        
        // Update sensitivity slider and value
        if (this.elements.sensitivitySlider) {
            this.elements.sensitivitySlider.value = this.audioManager.sensitivity;
        }
        
        if (this.elements.sensitivityValue) {
            this.elements.sensitivityValue.textContent = this.audioManager.sensitivity.toFixed(1);
        }
    }
    
    /**
     * Update microphone toggle button state
     * @param {boolean} isListening Whether the microphone is active
     */
    updateMicrophoneToggle(isListening) {
        if (!this.elements.microphoneToggle) return;
        
        if (isListening) {
            this.elements.microphoneToggle.textContent = 'Disable Microphone';
            this.elements.microphoneToggle.classList.add('active');
        } else {
            this.elements.microphoneToggle.textContent = 'Enable Microphone';
            this.elements.microphoneToggle.classList.remove('active');
        }
    }
    
    /**
     * Start the audio visualization
     */
    startVisualization() {
        if (!this.elements.visualizer || !this.audioManager) return;
        
        // Get canvas context
        const canvas = this.elements.visualizer;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.error('SidebarAudioPanel: Could not get canvas context');
            return;
        }
        
        // Animation loop for visualizer
        const updateVisualizer = () => {
            const width = canvas.width;
            const height = canvas.height;
            
            // Clear canvas
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, width, height);
            
            // Draw volume history graph if audio manager is initialized
            if (this.audioManager.isInitialized) {
                // Draw volume history as a line
                ctx.strokeStyle = '#4a90e2';
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                const historyData = [...this.audioManager.volumeHistory];
                const historyStep = width / (this.audioManager.maxHistoryLength - 1);
                
                for (let i = 0; i < historyData.length; i++) {
                    const x = i * historyStep;
                    const y = height - (historyData[i] / 100 * height);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                
                ctx.stroke();
                
                // Fill area under the line
                ctx.lineTo(width, height);
                ctx.lineTo(0, height);
                ctx.closePath();
                ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
                ctx.fill();
                
                // Draw threshold line
                const thresholdY = height - (this.audioManager.volumeThreshold / 100 * height);
                ctx.strokeStyle = '#f44336';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, thresholdY);
                ctx.lineTo(width, thresholdY);
                ctx.stroke();
                
                // Draw current (raw) volume indicator on the right side
                const rawVolumeHeight = (this.audioManager.currentVolume / 100) * height;
                ctx.fillStyle = this.audioManager.currentVolume >= this.audioManager.volumeThreshold 
                    ? 'rgba(244, 67, 54, 0.7)' 
                    : 'rgba(255, 152, 0, 0.7)';
                ctx.fillRect(width - 28, height - rawVolumeHeight, 12, rawVolumeHeight);
                
                // Draw smoothed volume indicator (used for visualization)
                const volumeHeight = (this.audioManager.smoothedVolume / 100) * height;
                ctx.fillStyle = this.audioManager.smoothedVolume >= this.audioManager.volumeThreshold 
                    ? 'rgba(244, 67, 54, 0.7)' 
                    : 'rgba(76, 175, 80, 0.7)';
                ctx.fillRect(width - 15, height - volumeHeight, 12, volumeHeight);
                
                // Add volume values
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'right';
                
                // Display raw volume (what triggers events)
                ctx.fillText(
                    `R: ${this.audioManager.currentVolume.toFixed(1)}`, 
                    width - 20, 
                    height - 20
                );
                
                // Display smoothed volume (what's visualized)
                ctx.fillText(
                    `S: ${this.audioManager.smoothedVolume.toFixed(1)}`, 
                    width - 20, 
                    height - 5
                );
                
                // Add legend for the raw vs smoothed bars
                ctx.fillStyle = 'rgba(255, 152, 0, 0.7)';
                ctx.fillRect(5, 5, 12, 12);
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left';
                ctx.fillText('Raw (trigger)', 22, 15);
                
                ctx.fillStyle = 'rgba(76, 175, 80, 0.7)';
                ctx.fillRect(5, 22, 12, 12);
                ctx.fillStyle = '#fff';
                ctx.fillText('Smoothed (display)', 22, 32);
            } else {
                // Show message if audio isn't initialized
                ctx.fillStyle = '#888';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Audio not initialized', width / 2, height / 2);
            }
            
            // Request next frame
            requestAnimationFrame(updateVisualizer);
        };
        
        // Start the animation loop
        updateVisualizer();
    }
    
    /**
     * Observer method called when relevant state changes
     * @param {Object} newState The new state
     * @param {Object} oldState The previous state
     */
    onStateUpdate(newState, oldState) {
        // Check if audio config has changed
        if (newState.audioConfig && oldState.audioConfig) {
            const configChanged = JSON.stringify(newState.audioConfig) !== JSON.stringify(oldState.audioConfig);
            
            if (configChanged) {
                this.updateControlValues();
            }
        }
    }
}

// Make SidebarAudioPanel available globally
window.SidebarAudioPanel = SidebarAudioPanel;