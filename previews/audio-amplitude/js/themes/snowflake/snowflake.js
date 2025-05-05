/**
 * A single Snowflake object
 */
class Snowflake {
    constructor(canvas, initialDistribution = false, sizeMultiplier = 1) {
        this.canvas = canvas;
        this.x = this.canvas.random(0, this.canvas.width);
        // For initial setup, distribute snowflakes throughout the entire canvas height
        // This prevents the wave effect by having snowflakes at various heights
        if (initialDistribution) {
            this.y = this.canvas.random(-100, this.canvas.height);
        } else {
            this.y = this.canvas.random(-100, -10);
        }
        
        // Base size affected by the size multiplier parameter
        this.baseSize = this.canvas.random(3, 10);
        this.size = this.baseSize * sizeMultiplier;
        
        // Store base speed for later adjustments
        this.baseSpeed = this.canvas.map(this.baseSize, 3, 10, 1, 3);
        this.speedMultiplier = 1;
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        this.opacity = this.canvas.map(this.baseSize, 3, 10, 150, 255);
        
        // Wobble properties with base randomness - increased range for more visible effect
        this.baseWobbleAmount = this.canvas.random(0.8, 2.0); // Increased from (0.3, 1.0)
        this.wobbleIntensity = 1.0; // Default multiplier
        this.wobble = this.canvas.random(0, this.canvas.TWO_PI); // Random starting phase
        this.baseWobbleSpeed = this.canvas.random(0.01, 0.05);
        this.wobbleSpeed = this.baseWobbleSpeed;
        
        // Wind properties
        this.windStrength = 0;
        this.windDirection = 0; // Degrees (0 is right, 90 is down)
        
        // Default snowflake color (white)
        this.color = { r: 255, g: 255, b: 255 };
        
        // Rotation for rendering
        this.rotation = this.canvas.random(0, this.canvas.TWO_PI);
        this.rotationSpeed = this.canvas.random(-0.02, 0.02);
    }

    // Set the speed multiplier to adjust falling speed
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
    }

    // Set the size multiplier to adjust snowflake size
    setSizeMultiplier(multiplier) {
        this.size = this.baseSize * multiplier;
    }
    
    // Set the wobble intensity multiplier
    setWobbleIntensity(intensity) {
        this.wobbleIntensity = intensity;
        // Make wobble speed more responsive to intensity changes
        // At intensity=0, speed is 30% of base speed
        // At intensity=1, speed is 250% of base speed
        this.wobbleSpeed = this.baseWobbleSpeed * (intensity * 2.2 + 0.3);
    }
    
    // Set wind properties
    setWind(strength, direction) {
        this.windStrength = strength;
        this.windDirection = direction;
    }
    
    // Set the snowflake color
    setColor(r, g, b) {
        this.color = { r, g, b };
    }

    update() {
        // Base vertical movement - falling
        this.y += this.speed;
        
        // Apply wobble effect (side-to-side movement) - enhanced by increasing multiplier
        const wobbleAmount = this.baseWobbleAmount * this.wobbleIntensity * 2.0; // Added *2.0 multiplier
        this.x += this.canvas.sin(this.wobble) * wobbleAmount;
        this.wobble += this.wobbleSpeed;
        
        // Apply wind effect
        if (this.windStrength > 0) {
            // Convert wind direction from degrees to radians
            const windRad = this.canvas.radians(this.windDirection);
            
            // Calculate wind vector components - adjust for size (smaller flakes affected more)
            const inverseSize = this.canvas.map(this.size, 3, 40, 1, 0.3);
            // Increased the wind multiplier from 0.05 to 0.2 for more noticeable effect
            const windForce = this.windStrength * 0.2 * inverseSize;
            
            // Apply wind force in x and y directions
            this.x += Math.cos(windRad) * windForce;
            this.y += Math.sin(windRad) * windForce;
        }
        
        // Rotate the snowflake
        this.rotation += this.rotationSpeed;
        
        // Wrap around edges for x-coordinate
        if (this.x < -50) {
            this.x = this.canvas.width + 50;
        } else if (this.x > this.canvas.width + 50) {
            this.x = -50;
        }
        
        // Reset snowflake when it reaches bottom
        if (this.y > this.canvas.height + this.size) {
            this.resetPosition();
        }
    }

    draw() {
        this.canvas.push();
        this.canvas.noStroke();
        this.canvas.fill(this.color.r, this.color.g, this.color.b, this.opacity);
        this.canvas.translate(this.x, this.y);
        this.canvas.rotate(this.rotation); // Add overall rotation to snowflake

        // Draw a simple snowflake shape
        for (let i = 0; i < 6; i++) {
            this.canvas.push();
            this.canvas.rotate(this.canvas.PI * 2 * i / 6);
            this.canvas.ellipse(0, 0, this.size * 0.2, this.size);
            this.canvas.pop();
        }
        
        // Draw center circle
        this.canvas.ellipse(0, 0, this.size * 0.5);
        
        this.canvas.pop();
    }

    resetPosition() {
        this.x = this.canvas.random(0, this.canvas.width);
        // When resetting, always place snowflakes at various heights above the canvas
        // This ensures a more continuous flow rather than all at the same height
        this.y = this.canvas.random(-150, -10); // Increased range for more variation
    }
}

/**
 * Explosion effect class for snowflake theme
 */
class SnowflakeExplosion {
    constructor(canvas, x, y, color, size = 1, particleCount = 25) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.particleCount = particleCount;
        this.particles = [];
        this.lifespan = 100; // How long the explosion lasts
        this.age = 0;
        this.active = true;
        
        // Create particles
        this.createParticles();

        // Debug info
        this._debugInfo = {
            createdAt: Date.now(),
            position: { x, y },
            color: { ...color },
            size,
            particleCount,
            particlesCreated: this.particles.length
        };
    }
    
    createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const angle = this.canvas.random(0, this.canvas.TWO_PI);
            const speed = this.canvas.random(1, 5) * this.size;
            const particleSize = this.canvas.random(3, 10) * this.size;
            const lifespan = this.canvas.random(20, this.lifespan);
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: particleSize,
                alpha: 255,
                lifespan: lifespan,
                sparkle: this.canvas.random() > 0.7, // Some particles will sparkle
                rotation: this.canvas.random(0, this.canvas.TWO_PI),
                rotationSpeed: this.canvas.random(-0.1, 0.1)
            });
        }
    }
    
    update() {
        if (!this.active) return;
        
        // Age the explosion
        this.age++;
        if (this.age >= this.lifespan) {
            this.active = false;
            return;
        }
        
        // Update all particles
        for (let p of this.particles) {
            // Move particle
            p.x += p.vx;
            p.y += p.vy;
            
            // Apply some drag
            p.vx *= 0.97;
            p.vy *= 0.97;
            
            // Add slight gravity
            p.vy += 0.05;
            
            // Update rotation
            p.rotation += p.rotationSpeed;
            
            // Fade out based on particle's lifespan
            p.alpha = this.canvas.map(p.lifespan - (this.age * 0.8), 0, p.lifespan, 0, 255);
            
            // Make particle sparkle if it's a sparkling one
            if (p.sparkle) {
                p.alpha *= 0.7 + 0.3 * Math.sin(this.age * 0.3 + p.rotation);
            }
        }

        // Add extra debug info about lifetime
        if (this.age === 1 || this.age === Math.floor(this.lifespan / 2) || this.age === this.lifespan - 1) {
            this._debugInfo.age = this.age;
            this._debugInfo.remainingParticles = this.particles.filter(p => p.alpha > 0).length;
            this._debugInfo.lifespanProgress = `${Math.round((this.age / this.lifespan) * 100)}%`;
            
            if (window.sentireApp && window.sentireApp.stateManager && 
                window.sentireApp.stateManager.state.debug) {
                console.log(`SnowflakeExplosion: Progress update`, this._debugInfo);
            }
        }
    }
    
    draw() {
        if (!this.active) return;
        
        // Draw all particles
        this.canvas.push();
        this.canvas.noStroke();
        
        for (let p of this.particles) {
            if (p.alpha <= 0) continue;
            
            this.canvas.push();
            this.canvas.translate(p.x, p.y);
            this.canvas.rotate(p.rotation);
            
            // Set fill color with alpha
            this.canvas.fill(this.color.r, this.color.g, this.color.b, p.alpha);
            
            // Draw snowflake particle
            if (p.sparkle && this.age % 3 === 0) {
                // For sparkling particles, draw a bright star sometimes
                this.canvas.fill(255, 255, 255, p.alpha);
                this.canvas.ellipse(0, 0, p.size * 1.2);
            } else {
                // Draw a simple snowflake shape
                for (let i = 0; i < 3; i++) {
                    this.canvas.push();
                    this.canvas.rotate(this.canvas.PI * i / 3);
                    this.canvas.ellipse(0, 0, p.size * 0.2, p.size);
                    this.canvas.pop();
                }
                
                // Draw center circle
                this.canvas.ellipse(0, 0, p.size * 0.5);
            }
            
            this.canvas.pop();
        }
        
        this.canvas.pop();
    }
    
    isFinished() {
        return !this.active;
    }
}

/**
 * Snowflakes Theme class that extends the base Theme
 * Integrated with state management system
 */
class SnowflakesTheme extends Theme {
    constructor(stateManager = null) {
        super();
        this.stateManager = stateManager;
        this.snowflakes = [];
        this.numSnowflakes = 200; // Default number of snowflakes
        this.sizeMultiplier = 1; // Default size multiplier
        this.speedMultiplier = 1; // Default speed multiplier
        this.wobbleIntensity = 0.5; // Default wobble intensity
        this.windStrength = 0; // Default wind strength
        this.windDirection = 0; // Default wind direction (degrees)
        
        // Default colors
        this.snowflakeColor = { r: 255, g: 255, b: 255 }; // White
        this.backgroundColor = { r: 0, g: 10, b: 40 }; // Dark blue
        
        // Audio-reactive effects
        this.explosions = []; // Array to store active explosions
        this.explosionConfig = {
            enabled: true,              // Whether explosions are enabled
            particleCount: 25,          // Number of particles per explosion
            sizeMultiplier: 1.0,        // Size multiplier for explosions
            colorMatchSnowflakes: true, // Whether to match snowflake color
            maxExplosions: 5,           // Maximum simultaneous explosions
            triggerThreshold: 70        // Volume threshold to trigger (0-100)
        };
        
        // Audio manager reference will be set when available
        this.audioManager = null;
        
        // Subscribe to state changes if state manager is provided
        if (this.stateManager) {
            // Use onStateUpdate instead of update to avoid method name collision
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'theme');
            
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'appState');
            
            if (this.stateManager.state.debug) {
                console.log('SnowflakesTheme: Initialized with state manager');
            }
        }
    }
    
    /**
     * Initialize the theme with a p5.js canvas
     * @param {p5} canvas - The p5.js instance
     */
    init(canvas) {
        // Call the parent init method
        super.init(canvas);
        
        // Connect to audio manager if available
        if (window.sentireApp && window.sentireApp.audioManager) {
            this.connectToAudioManager(window.sentireApp.audioManager);
        }
        
        // Apply state configuration if available
        if (this.stateManager) {
            this.applyStateConfig();
            
            if (this.stateManager.state.debug) {
                console.log('SnowflakesTheme: Applied state configuration');
            }
        }
    }
    
    /**
     * Connect to the audio manager and set up event listeners
     * @param {AudioManager} audioManager - The audio manager instance
     */
    connectToAudioManager(audioManager) {
        this.audioManager = audioManager;
        
        // Register for volume threshold events
        this.audioManager.on('volumeThreshold', this.handleVolumeThreshold.bind(this));
        
        if (this.stateManager && this.stateManager.state.debug) {
            console.log('SnowflakesTheme: Connected to audio manager');
        }
    }
    
    /**
     * Handle volume threshold events from the audio manager
     * @param {Object} data - Event data from the audio manager
     */
    handleVolumeThreshold(data) {
        // Only respond if this theme is active and explosions are enabled
        if (!this.isRunning || !this.audioReactiveConfig.enabled) return;
        
        // Debug what's happening with this event
        if (this.stateManager && this.stateManager.state.debug) {
            console.log(`SnowflakesTheme: Audio trigger received with volume ${data.volume.toFixed(1)}`, {
                isRunning: this.isRunning,
                explosionsEnabled: this.audioReactiveConfig.enabled,
                themeActive: this.stateManager ? (this.stateManager.state.currentTheme === 'snowflakes') : true,
                audioData: data,
                currentNumEffects: this.explosions.length
            });
        }

        // Check if this theme is active in the state manager
        if (this.stateManager && this.stateManager.state.currentTheme !== 'snowflakes') {
            return;
        }
        
        // Only trigger if the volume exceeds our specific threshold
        if (data.volume < this.audioReactiveConfig.triggerThreshold) {
            if (this.stateManager && this.stateManager.state.debug) {
                console.log(`SnowflakesTheme: Volume ${data.volume.toFixed(1)} below threshold ${this.audioReactiveConfig.triggerThreshold}`);
            }
            return;
        }
        
        // Limit the number of simultaneous explosions
        if (this.explosions.length >= this.audioReactiveConfig.maxEffects) {
            if (this.stateManager && this.stateManager.state.debug) {
                console.log(`SnowflakesTheme: Max effects limit reached (${this.explosions.length}/${this.audioReactiveConfig.maxEffects})`);
            }
            return;
        }
        
        // Create a snowflake explosion at a random position
        this.createRandomExplosion(data.volume);
        
        if (this.stateManager && this.stateManager.state.debug) {
            console.log(`SnowflakesTheme: Created explosion from audio trigger (volume: ${data.volume.toFixed(1)})`);
        }
    }
    
    /**
     * Create a random explosion based on audio volume
     * @param {number} volume - The audio volume that triggered the explosion
     */
    createRandomExplosion(volume) {
        // Generate a random position for the explosion
        const x = this.canvas.random(this.canvas.width * 0.1, this.canvas.width * 0.9);
        const y = this.canvas.random(this.canvas.height * 0.1, this.canvas.height * 0.9);
        
        // Calculate explosion size based on volume and config
        const volumeRatio = volume / 100; // 0-1 range
        const baseSize = this.explosionConfig.sizeMultiplier;
        const sizeMultiplier = baseSize * (0.7 + volumeRatio * 0.6); // Size varies with volume
        
        // Use snowflake color or generate a custom color
        let color;
        if (this.explosionConfig.colorMatchSnowflakes) {
            color = this.snowflakeColor;
        } else {
            // Generate a pastel color based on volume
            const hue = (this.canvas.frameCount * 2 + volume * 2) % 360;
            const saturation = 80;
            const brightness = 95;
            
            // Convert HSB to RGB
            const rgb = this.hsbToRgb(hue, saturation, brightness);
            color = { r: rgb[0], g: rgb[1], b: rgb[2] };
        }
        
        // Calculate particle count based on volume
        const particleCount = Math.floor(this.explosionConfig.particleCount * (0.8 + volumeRatio * 0.5));
        
        // Create the explosion
        const explosion = new SnowflakeExplosion(
            this.canvas,
            x,
            y,
            color,
            sizeMultiplier,
            particleCount
        );
        
        // Add to explosions array
        this.explosions.push(explosion);
    }
    
    /**
     * Convert HSB color to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} b - Brightness (0-100)
     * @returns {Array} RGB values as [r, g, b]
     */
    hsbToRgb(h, s, b) {
        s /= 100;
        b /= 100;
        
        const k = (n) => (n + h / 60) % 6;
        const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
        
        return [
            Math.round(255 * f(5)),
            Math.round(255 * f(3)),
            Math.round(255 * f(1))
        ];
    }

    /**
     * Apply the current state configuration to the theme
     */
    applyStateConfig() {
        if (!this.stateManager) return;
        
        const config = this.stateManager.getStateSection('themeConfigs.snowflakes');
        if (!config) return;
        
        // Set background color
        this.setBackgroundColor(config.backgroundColor);
        
        // Set snowflake color
        this.setSnowflakeColor(config.snowflakeColor);
        
        // Set number of snowflakes
        this.setNumberOfSnowflakes(config.count);
        
        // Set size multiplier - convert from our 1-40 range to 0.1-4 range
        const sizeMultiplier = config.size / 10;
        this.setSizeMultiplier(sizeMultiplier);
        
        // Set speed multiplier
        this.setSpeedMultiplier(config.speed);
        
        // Set wobble intensity - convert from our 0-10 range to 0-1 range
        const wobbleIntensity = config.wobbleIntensity / 10;
        this.setWobbleIntensity(wobbleIntensity);
        
        // Set wind properties
        this.setWind(config.windStrength, config.windDirection);
        
        // Set up audio reactive configuration
        this.setupAudioReactiveConfig();
        
        // Set running state
        if (this.stateManager.state.isRunning) {
            this.start();
        } else {
            this.stop();
        }
    }

    /**
     * Set up audio-reactive configuration
     */
    setupAudioReactiveConfig() {
        // Create audio reactive config if it doesn't exist
        if (!this.audioReactiveConfig) {
            this.audioReactiveConfig = {
                enabled: true,           // Whether audio-reactive effects are enabled
                triggerThreshold: 35,    // Volume threshold to trigger effects (lower than default)
                maxEffects: 8,           // Maximum number of simultaneous effects
                particleCount: 25,       // Particles per explosion
                sizeMultiplier: 1.0      // Size multiplier for effects
            };
        }
        
        // Apply explosion config to audio reactive config for compatibility
        this.audioReactiveConfig.particleCount = this.explosionConfig.particleCount;
        this.audioReactiveConfig.sizeMultiplier = this.explosionConfig.sizeMultiplier;
        this.audioReactiveConfig.maxEffects = this.explosionConfig.maxExplosions;
        this.audioReactiveConfig.enabled = this.explosionConfig.enabled;
        
        // Use a lower trigger threshold than in the explosion config
        // This makes it more responsive
        this.audioReactiveConfig.triggerThreshold = 35;
        
        if (this.stateManager && this.stateManager.state.debug) {
            console.log('SnowflakesTheme: Audio reactive config initialized', this.audioReactiveConfig);
        }
    }

    // Setter methods for controller values
    setNumberOfSnowflakes(num) {
        const previouslyRunning = this.isRunning;
        
        // Stop animation temporarily if running
        if (previouslyRunning) {
            this.isRunning = false;
        }
        
        this.numSnowflakes = num;
        this.updateSnowflakes();
        
        // Resume animation if it was running before
        if (previouslyRunning) {
            this.isRunning = true;
        }
    }

    setSizeMultiplier(multiplier) {
        this.sizeMultiplier = multiplier;
        // Update existing snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.setSizeMultiplier(this.sizeMultiplier);
        }
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        // Update existing snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.setSpeedMultiplier(this.speedMultiplier);
        }
    }
    
    setWobbleIntensity(intensity) {
        this.wobbleIntensity = intensity;
        // Update existing snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.setWobbleIntensity(intensity);
        }
    }
    
    setWind(strength, direction) {
        this.windStrength = strength;
        this.windDirection = direction;
        // Update existing snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.setWind(strength, direction);
        }
    }
    
    setSnowflakeColor(hexColor) {
        // Convert hex color to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        this.snowflakeColor = { r, g, b };
        
        // Update existing snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.setColor(r, g, b);
        }
    }
    
    setBackgroundColor(hexColor) {
        // Convert hex color to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        this.backgroundColor = { r, g, b };
    }

    updateSnowflakes() {
        // Adjust number of snowflakes
        if (this.snowflakes.length < this.numSnowflakes) {
            // Add more snowflakes
            const numToAdd = this.numSnowflakes - this.snowflakes.length;
            for (let i = 0; i < numToAdd; i++) {
                const snowflake = new Snowflake(this.canvas, true, this.sizeMultiplier);
                snowflake.setSpeedMultiplier(this.speedMultiplier);
                snowflake.setColor(this.snowflakeColor.r, this.snowflakeColor.g, this.snowflakeColor.b);
                snowflake.setWobbleIntensity(this.wobbleIntensity);
                snowflake.setWind(this.windStrength, this.windDirection);
                this.snowflakes.push(snowflake);
            }
        } else if (this.snowflakes.length > this.numSnowflakes) {
            // Remove excess snowflakes
            this.snowflakes = this.snowflakes.slice(0, this.numSnowflakes);
        }
    }

    setup() {
        // Create snowflakes with initial distribution throughout canvas
        this.snowflakes = [];
        for (let i = 0; i < this.numSnowflakes; i++) {
            const snowflake = new Snowflake(this.canvas, true, this.sizeMultiplier);
            snowflake.setSpeedMultiplier(this.speedMultiplier);
            snowflake.setColor(this.snowflakeColor.r, this.snowflakeColor.g, this.snowflakeColor.b);
            snowflake.setWobbleIntensity(this.wobbleIntensity);
            snowflake.setWind(this.windStrength, this.windDirection);
            this.snowflakes.push(snowflake);
        }
    }

    update() {
        if (!this.isRunning) return;
        
        // Update all snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.update();
        }
        
        // Update all explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            
            // Remove finished explosions
            if (this.explosions[i].isFinished()) {
                this.explosions.splice(i, 1);
            }
        }
    }

    draw() {
        if (!this.isRunning) return;

        // Clear background with custom color
        this.canvas.background(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
        
        // Draw all snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.draw();
        }
        
        // Draw all explosions
        for (let explosion of this.explosions) {
            explosion.draw();
        }
    }

    cleanup() {
        // Clear the snowflakes array
        this.snowflakes = [];
        
        if (this.stateManager && this.stateManager.state.debug) {
            console.log('SnowflakesTheme: Cleaned up resources');
        }
    }
    
    /**
     * Observer method called when state changes - renamed to avoid collision with animation update
     * @param {Object} newState - New application state
     * @param {Object} oldState - Previous application state
     */
    onStateUpdate(newState, oldState) {
        // Only process if we're the current theme
        if (newState.currentTheme !== 'snowflakes') return;
        
        // Check if theme-related state has changed
        const configChanged = 
            JSON.stringify(newState.themeConfigs.snowflakes) !== 
            JSON.stringify(oldState.themeConfigs.snowflakes);
        const runningChanged = newState.isRunning !== oldState.isRunning;
        
        // If any relevant state has changed, update the theme
        if (configChanged || runningChanged) {
            this.applyStateConfig();
            
            if (newState.debug) {
                console.log('SnowflakesTheme: Updated from state change');
            }
        }
    }
    
    /**
     * Set explosion configuration
     * @param {Object} config - Configuration object with explosion settings
     */
    setExplosionConfig(config) {
        // Merge with existing config, keeping defaults for any missing properties
        this.explosionConfig = {
            ...this.explosionConfig,
            ...config
        };
        
        if (this.stateManager && this.stateManager.state.debug) {
            console.log('SnowflakesTheme: Updated explosion config', this.explosionConfig);
        }
    }
    
    /**
     * Manually trigger an explosion at a specific position (for testing)
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} size - Explosion size multiplier
     */
    triggerExplosion(x, y, size = 1) {
        if (!this.isRunning || !this.explosionConfig.enabled) return;
        
        const explosion = new SnowflakeExplosion(
            this.canvas,
            x, 
            y,
            this.snowflakeColor,
            size,
            this.explosionConfig.particleCount
        );
        
        this.explosions.push(explosion);
    }
}