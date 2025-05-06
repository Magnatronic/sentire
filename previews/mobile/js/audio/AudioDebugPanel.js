/**
 * AudioDebugPanel class
 * 
 * Creates a UI panel for debugging and controlling the audio detection system
 * Provides visual feedback and controls for audio parameters
 */
class AudioDebugPanel {
    constructor(stateManager = null, audioManager = null) {
        this.stateManager = stateManager;
        this.audioManager = audioManager;
        
        // Panel state
        this.visible = true;
        this.expanded = true;
        this.position = { x: 20, y: 20 };
        this.size = { width: 300, height: 200 };
        this.visualizerSize = { width: 280, height: 100 };
        this.dragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Create panel elements when state manager and audio manager are available
        if (this.stateManager && this.audioManager) {
            this.createPanel();
        } else {
            console.warn('AudioDebugPanel: Missing stateManager or audioManager');
        }
    }
    
    /**
     * Set the audio manager instance
     * @param {AudioManager} audioManager The audio manager instance
     */
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
        
        // Create or update panel if needed
        if (this.audioManager && !this.panelElement) {
            this.createPanel();
        }
    }
    
    /**
     * Set the state manager instance
     * @param {StateManager} stateManager The state manager instance
     */
    setStateManager(stateManager) {
        this.stateManager = stateManager;
        
        // Create or update panel if needed
        if (this.stateManager && this.audioManager && !this.panelElement) {
            this.createPanel();
        }
    }
    
    /**
     * Create the debug panel UI
     */
    createPanel() {
        // Create panel container
        this.panelElement = document.createElement('div');
        this.panelElement.className = 'audio-debug-panel';
        this.panelElement.style.position = 'absolute';
        this.panelElement.style.top = `${this.position.y}px`;
        this.panelElement.style.left = `${this.position.x}px`;
        this.panelElement.style.width = `${this.size.width}px`;
        this.panelElement.style.background = 'rgba(0, 0, 0, 0.8)';
        this.panelElement.style.color = 'white';
        this.panelElement.style.borderRadius = '5px';
        this.panelElement.style.padding = '10px';
        this.panelElement.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        this.panelElement.style.fontFamily = 'Arial, sans-serif';
        this.panelElement.style.zIndex = '1000';
        this.panelElement.style.boxSizing = 'border-box';
        this.panelElement.style.border = '1px solid #444';
        
        // Create header with title and controls
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '10px';
        header.style.cursor = 'move';
        
        // Make panel draggable via the header
        header.addEventListener('mousedown', (e) => {
            this.dragging = true;
            this.dragOffset.x = e.clientX - this.position.x;
            this.dragOffset.y = e.clientY - this.position.y;
            e.preventDefault();
        });
        
        // Add mouse move and up listeners to document
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Title
        const title = document.createElement('div');
        title.textContent = 'Audio Debug Panel';
        title.style.fontWeight = 'bold';
        
        // Controls container
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '5px';
        
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = this.expanded ? '&minus;' : '&plus;';
        toggleBtn.style.width = '24px';
        toggleBtn.style.height = '24px';
        toggleBtn.style.backgroundColor = '#555';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '3px';
        toggleBtn.style.color = 'white';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.justifyContent = 'center';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.title = this.expanded ? 'Collapse panel' : 'Expand panel';
        
        toggleBtn.addEventListener('click', () => {
            this.expanded = !this.expanded;
            this.updatePanel();
        });
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.width = '24px';
        closeBtn.style.height = '24px';
        closeBtn.style.backgroundColor = '#555';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '3px';
        closeBtn.style.color = 'white';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.alignItems = 'center';
        closeBtn.title = 'Close panel';
        
        closeBtn.addEventListener('click', () => {
            this.visible = false;
            this.panelElement.style.display = 'none';
        });
        
        // Add controls to header
        controls.appendChild(toggleBtn);
        controls.appendChild(closeBtn);
        header.appendChild(title);
        header.appendChild(controls);
        
        // Create content container
        this.contentElement = document.createElement('div');
        this.contentElement.style.display = this.expanded ? 'block' : 'none';
        
        // Create canvas for visualizer
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.visualizerSize.width;
        this.canvas.height = this.visualizerSize.height;
        this.canvas.style.backgroundColor = '#222';
        this.canvas.style.borderRadius = '3px';
        this.canvas.style.marginBottom = '10px';
        
        // Settings container
        const settingsContainer = document.createElement('div');
        settingsContainer.style.display = 'flex';
        settingsContainer.style.flexDirection = 'column';
        settingsContainer.style.gap = '10px';
        
        // Microphone toggle
        const micContainer = document.createElement('div');
        micContainer.style.display = 'flex';
        micContainer.style.alignItems = 'center';
        micContainer.style.gap = '10px';
        
        const micLabel = document.createElement('label');
        micLabel.textContent = 'Microphone:';
        micLabel.style.width = '100px';
        
        const micToggle = document.createElement('button');
        const isListening = this.audioManager.isListening;
        micToggle.textContent = isListening ? 'Disable' : 'Enable';
        micToggle.style.padding = '5px 10px';
        micToggle.style.backgroundColor = isListening ? '#f44' : '#4a4';
        micToggle.style.border = 'none';
        micToggle.style.borderRadius = '3px';
        micToggle.style.color = 'white';
        micToggle.style.cursor = 'pointer';
        
        micToggle.addEventListener('click', async () => {
            if (this.audioManager.isListening) {
                this.audioManager.stopListening();
                micToggle.textContent = 'Enable';
                micToggle.style.backgroundColor = '#4a4';
            } else {
                const success = await this.audioManager.startListening();
                micToggle.textContent = success ? 'Disable' : 'Enable';
                micToggle.style.backgroundColor = success ? '#f44' : '#4a4';
            }
        });
        
        micContainer.appendChild(micLabel);
        micContainer.appendChild(micToggle);
        
        // Volume threshold slider
        const thresholdContainer = document.createElement('div');
        thresholdContainer.style.display = 'flex';
        thresholdContainer.style.alignItems = 'center';
        thresholdContainer.style.gap = '10px';
        
        const thresholdLabel = document.createElement('label');
        thresholdLabel.textContent = 'Threshold:';
        thresholdLabel.style.width = '100px';
        
        const thresholdValue = document.createElement('span');
        thresholdValue.textContent = this.audioManager.volumeThreshold;
        thresholdValue.style.width = '30px';
        thresholdValue.style.textAlign = 'right';
        
        const thresholdSlider = document.createElement('input');
        thresholdSlider.type = 'range';
        thresholdSlider.min = '0';
        thresholdSlider.max = '100';
        thresholdSlider.value = this.audioManager.volumeThreshold;
        thresholdSlider.style.flex = '1';
        
        thresholdSlider.addEventListener('input', () => {
            const threshold = parseInt(thresholdSlider.value);
            this.audioManager.setVolumeThreshold(threshold);
            thresholdValue.textContent = threshold;
        });
        
        thresholdContainer.appendChild(thresholdLabel);
        thresholdContainer.appendChild(thresholdSlider);
        thresholdContainer.appendChild(thresholdValue);
        
        // Sensitivity slider
        const sensitivityContainer = document.createElement('div');
        sensitivityContainer.style.display = 'flex';
        sensitivityContainer.style.alignItems = 'center';
        sensitivityContainer.style.gap = '10px';
        
        const sensitivityLabel = document.createElement('label');
        sensitivityLabel.textContent = 'Sensitivity:';
        sensitivityLabel.style.width = '100px';
        
        const sensitivityValue = document.createElement('span');
        sensitivityValue.textContent = this.audioManager.sensitivity.toFixed(1);
        sensitivityValue.style.width = '30px';
        sensitivityValue.style.textAlign = 'right';
        
        const sensitivitySlider = document.createElement('input');
        sensitivitySlider.type = 'range';
        sensitivitySlider.min = '0.1';
        sensitivitySlider.max = '5';
        sensitivitySlider.step = '0.1';
        sensitivitySlider.value = this.audioManager.sensitivity;
        sensitivitySlider.style.flex = '1';
        
        sensitivitySlider.addEventListener('input', () => {
            const sensitivity = parseFloat(sensitivitySlider.value);
            this.audioManager.setSensitivity(sensitivity);
            sensitivityValue.textContent = sensitivity.toFixed(1);
        });
        
        sensitivityContainer.appendChild(sensitivityLabel);
        sensitivityContainer.appendChild(sensitivitySlider);
        sensitivityContainer.appendChild(sensitivityValue);
        
        // Cooldown slider
        const cooldownContainer = document.createElement('div');
        cooldownContainer.style.display = 'flex';
        cooldownContainer.style.alignItems = 'center';
        cooldownContainer.style.gap = '10px';
        
        const cooldownLabel = document.createElement('label');
        cooldownLabel.textContent = 'Cooldown (ms):';
        cooldownLabel.style.width = '100px';
        
        const cooldownValue = document.createElement('span');
        cooldownValue.textContent = this.audioManager.triggerCooldown;
        cooldownValue.style.width = '30px';
        cooldownValue.style.textAlign = 'right';
        
        const cooldownSlider = document.createElement('input');
        cooldownSlider.type = 'range';
        cooldownSlider.min = '0';
        cooldownSlider.max = '1000';
        cooldownSlider.step = '50';
        cooldownSlider.value = this.audioManager.triggerCooldown;
        cooldownSlider.style.flex = '1';
        
        cooldownSlider.addEventListener('input', () => {
            const cooldown = parseInt(cooldownSlider.value);
            this.audioManager.setTriggerCooldown(cooldown);
            cooldownValue.textContent = cooldown;
        });
        
        cooldownContainer.appendChild(cooldownLabel);
        cooldownContainer.appendChild(cooldownSlider);
        cooldownContainer.appendChild(cooldownValue);
        
        // Add all settings to the container
        settingsContainer.appendChild(micContainer);
        settingsContainer.appendChild(thresholdContainer);
        settingsContainer.appendChild(sensitivityContainer);
        settingsContainer.appendChild(cooldownContainer);
        
        // Add all elements to content
        this.contentElement.appendChild(this.canvas);
        this.contentElement.appendChild(settingsContainer);
        
        // Add all elements to panel
        this.panelElement.appendChild(header);
        this.panelElement.appendChild(this.contentElement);
        
        // Add panel to document
        document.body.appendChild(this.panelElement);
        
        // Start visualization loop
        this.updateVisualization();
    }
    
    /**
     * Handle mouse move event for dragging the panel
     * @param {MouseEvent} e The mouse event
     */
    onMouseMove(e) {
        if (!this.dragging) return;
        
        // Calculate new position
        this.position.x = e.clientX - this.dragOffset.x;
        this.position.y = e.clientY - this.dragOffset.y;
        
        // Keep panel within window bounds
        const maxX = window.innerWidth - this.panelElement.offsetWidth;
        const maxY = window.innerHeight - this.panelElement.offsetHeight;
        
        this.position.x = Math.max(0, Math.min(this.position.x, maxX));
        this.position.y = Math.max(0, Math.min(this.position.y, maxY));
        
        // Update panel position
        this.panelElement.style.left = `${this.position.x}px`;
        this.panelElement.style.top = `${this.position.y}px`;
    }
    
    /**
     * Handle mouse up event for dragging the panel
     */
    onMouseUp() {
        this.dragging = false;
    }
    
    /**
     * Update the panel based on its expanded state
     */
    updatePanel() {
        if (!this.panelElement) return;
        
        // Update toggle button
        const toggleBtn = this.panelElement.querySelector('button');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.expanded ? '&minus;' : '&plus;';
            toggleBtn.title = this.expanded ? 'Collapse panel' : 'Expand panel';
        }
        
        // Show/hide content
        if (this.contentElement) {
            this.contentElement.style.display = this.expanded ? 'block' : 'none';
        }
    }
    
    /**
     * Update the visualization canvas
     */
    updateVisualization() {
        if (!this.canvas || !this.audioManager) return;
        
        // Get canvas context
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error('AudioDebugPanel: Could not get canvas context');
            return;
        }

        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);
        
        // Only draw if audio manager is initialized
        if (this.audioManager.isInitialized) {
            // Draw raw frequency data for debugging
            if (this.audioManager.volumeData && this.audioManager.volumeData.length > 0) {
                ctx.strokeStyle = '#888';
                ctx.lineWidth = 1;
                ctx.beginPath();
                
                const barWidth = width / Math.min(64, this.audioManager.volumeData.length);
                
                for (let i = 0; i < Math.min(64, this.audioManager.volumeData.length); i++) {
                    const value = this.audioManager.volumeData[i] / 255;
                    const barHeight = value * height * 0.5;
                    ctx.rect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
                }
                
                ctx.stroke();
            }
            
            // Draw volume history graph
            ctx.strokeStyle = '#fff';
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
            
            // Draw threshold line
            const thresholdY = height - (this.audioManager.volumeThreshold / 100 * height);
            ctx.strokeStyle = '#f00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, thresholdY);
            ctx.lineTo(width, thresholdY);
            ctx.stroke();
            
            // Draw current volume level
            const volumeHeight = (this.audioManager.smoothedVolume / 100) * height;
            ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
            ctx.fillRect(width - 20, height - volumeHeight, 15, volumeHeight);
            
            // Add label for current volume
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(
                this.audioManager.smoothedVolume.toFixed(1), 
                width - 25, 
                height - volumeHeight - 5
            );
            
            // Draw audio context state
            ctx.fillStyle = '#fff';
            ctx.font = '9px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(
                `Context: ${this.audioManager.audioContext ? this.audioManager.audioContext.state : 'none'}`, 
                5, 
                height - 5
            );
        } else {
            // Draw message if not initialized
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Audio detection not initialized', width / 2, height / 2);
        }
        
        // Request next frame
        requestAnimationFrame(() => this.updateVisualization());
    }
    
    /**
     * Show the debug panel
     */
    show() {
        if (!this.panelElement) return;
        
        this.visible = true;
        this.panelElement.style.display = 'block';
    }
    
    /**
     * Hide the debug panel
     */
    hide() {
        if (!this.panelElement) return;
        
        this.visible = false;
        this.panelElement.style.display = 'none';
    }
    
    /**
     * Toggle the visibility of the debug panel
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
}

// Make AudioDebugPanel available globally
window.AudioDebugPanel = AudioDebugPanel;