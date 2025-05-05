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
        
        // Apply state configuration if available
        if (this.stateManager) {
            this.applyStateConfig();
            
            if (this.stateManager.state.debug) {
                console.log('SnowflakesTheme: Applied state configuration');
            }
        }
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
        
        // Set running state
        if (this.stateManager.state.isRunning) {
            this.start();
        } else {
            this.stop();
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
    }

    draw() {
        if (!this.isRunning) return;

        // Clear background with custom color
        this.canvas.background(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
        
        // Draw all snowflakes
        for (let snowflake of this.snowflakes) {
            snowflake.draw();
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
}