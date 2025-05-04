/**
 * Bubble class for underwater theme
 */
class Bubble {
    constructor(canvas, initialDistribution = false, sizeMultiplier = 1) {
        this.canvas = canvas;
        this.x = this.canvas.random(0, this.canvas.width);
        
        // For initial setup, distribute bubbles throughout the canvas
        if (initialDistribution) {
            this.y = this.canvas.random(0, this.canvas.height);
        } else {
            this.y = this.canvas.random(this.canvas.height, this.canvas.height + 50);
        }
        
        // Base size affected by the size multiplier parameter
        this.baseSize = this.canvas.random(5, 15);
        this.size = this.baseSize * sizeMultiplier;
        
        // Store base speed for later adjustments
        this.baseSpeed = this.canvas.map(this.baseSize, 5, 15, 2, 1);
        this.speedMultiplier = 1;
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        this.opacity = this.canvas.map(this.baseSize, 5, 15, 150, 200);
        
        // Wobble properties with base randomness
        this.baseWobbleAmount = this.canvas.random(0.3, 1.0);
        this.wobbleIntensity = 1.0; // Default multiplier
        this.wobble = this.canvas.random(0, this.canvas.TWO_PI); // Random starting phase
        this.baseWobbleSpeed = this.canvas.random(0.01, 0.05);
        this.wobbleSpeed = this.baseWobbleSpeed;
        
        // Current properties
        this.currentStrength = 0;
        this.currentDirection = 0; // Degrees (0 is right, 90 is up)
        
        // Default bubble color (white with blue tint)
        this.color = { r: 220, g: 240, b: 255 };
        this.strokeColor = { r: 150, g: 200, b: 255 };
        
        // Shine effect
        this.shineAngle = this.canvas.random(0, this.canvas.TWO_PI);
    }

    // Set the speed multiplier to adjust rising speed
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
    }

    // Set the size multiplier to adjust bubble size
    setSizeMultiplier(multiplier) {
        this.size = this.baseSize * multiplier;
    }
    
    // Set the wobble intensity multiplier
    setWobbleIntensity(intensity) {
        this.wobbleIntensity = intensity;
        this.wobbleSpeed = this.baseWobbleSpeed * (intensity * 2 + 0.3);
    }
    
    // Set current properties
    setCurrent(strength, direction) {
        this.currentStrength = strength;
        this.currentDirection = direction;
    }
    
    // Set the bubble color
    setColor(r, g, b) {
        this.color = { r, g, b };
        // Set stroke color slightly darker
        this.strokeColor = { 
            r: Math.max(r - 70, 0), 
            g: Math.max(g - 40, 0), 
            b: Math.max(b - 0, 0) 
        };
    }

    update() {
        // Base vertical movement - rising (negative y is up)
        this.y -= this.speed;
        
        // Apply wobble effect (side-to-side movement)
        const wobbleAmount = this.baseWobbleAmount * this.wobbleIntensity;
        this.x += this.canvas.sin(this.wobble) * wobbleAmount;
        this.wobble += this.wobbleSpeed;
        
        // Apply current effect
        if (this.currentStrength > 0) {
            // Convert current direction from degrees to radians
            const currentRad = this.canvas.radians(this.currentDirection);
            
            // Calculate current vector components - adjust for size (smaller bubbles affected more)
            const inverseSize = this.canvas.map(this.size, 5, 30, 1, 0.3);
            const currentForce = this.currentStrength * 0.1 * inverseSize;
            
            // Apply current force in x and y directions
            this.x += Math.cos(currentRad) * currentForce;
            this.y -= Math.sin(currentRad) * currentForce;
        }
        
        // Wrap around edges for x-coordinate
        if (this.x < -50) {
            this.x = this.canvas.width + 50;
        } else if (this.x > this.canvas.width + 50) {
            this.x = -50;
        }
        
        // Reset bubble when it reaches top
        if (this.y < -this.size) {
            this.resetPosition();
        }
    }

    draw() {
        this.canvas.push();
        this.canvas.translate(this.x, this.y);
        
        // Draw bubble
        this.canvas.strokeWeight(1);
        this.canvas.stroke(this.strokeColor.r, this.strokeColor.g, this.strokeColor.b, this.opacity);
        this.canvas.fill(this.color.r, this.color.g, this.color.b, this.opacity * 0.7);
        this.canvas.ellipse(0, 0, this.size);
        
        // Draw shine highlight
        this.canvas.noStroke();
        this.canvas.fill(255, 255, 255, this.opacity * 0.6);
        this.canvas.push();
        this.canvas.rotate(this.shineAngle);
        this.canvas.ellipse(this.size * 0.2, -this.size * 0.2, this.size * 0.3, this.size * 0.2);
        this.canvas.pop();
        
        this.canvas.pop();
    }

    resetPosition() {
        this.x = this.canvas.random(0, this.canvas.width);
        this.y = this.canvas.random(this.canvas.height, this.canvas.height + 50);
        this.shineAngle = this.canvas.random(0, this.canvas.TWO_PI);
    }
}

/**
 * Fish class for underwater theme
 */
class Fish {
    constructor(canvas, sizeMultiplier = 1) {
        this.canvas = canvas;
        
        // Random position on either side of the canvas
        this.side = this.canvas.random() > 0.5 ? 'left' : 'right';
        this.x = this.side === 'left' ? -50 : this.canvas.width + 50;
        this.y = this.canvas.random(50, this.canvas.height - 50);
        
        // Size properties
        this.baseSize = this.canvas.random(20, 40);
        this.size = this.baseSize * sizeMultiplier;
        
        // Movement properties
        this.baseSpeed = this.canvas.map(this.baseSize, 20, 40, 2, 1);
        this.speedMultiplier = 1;
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        // Direction (left fish move right, right fish move left)
        this.direction = this.side === 'left' ? 0 : 180;
        
        // Wobble properties for natural movement
        this.yWobble = 0;
        this.yWobbleSpeed = this.canvas.random(0.02, 0.05);
        this.yWobbleAmount = this.canvas.random(0.5, 2);
        
        // Fish colors
        this.generateRandomColors();
        
        // Tail wagging
        this.tailAngle = 0;
        this.tailSpeed = this.canvas.random(0.1, 0.2);
        this.tailAmplitude = this.canvas.random(20, 30);
    }
    
    generateRandomColors() {
        // Generate a random fish color scheme
        const colorSchemes = [
            { body: { r: 255, g: 100, b: 100 }, tail: { r: 255, g: 50, b: 50 } },    // Red
            { body: { r: 100, g: 150, b: 255 }, tail: { r: 70, g: 130, b: 230 } },    // Blue
            { body: { r: 255, g: 200, b: 70 }, tail: { r: 255, g: 170, b: 40 } },     // Gold
            { body: { r: 150, g: 220, b: 150 }, tail: { r: 120, g: 200, b: 120 } },   // Green
            { body: { r: 200, g: 150, b: 255 }, tail: { r: 180, g: 120, b: 240 } }    // Purple
        ];
        
        const scheme = colorSchemes[Math.floor(this.canvas.random(0, colorSchemes.length))];
        this.bodyColor = scheme.body;
        this.tailColor = scheme.tail;
    }
    
    // Set the speed multiplier to adjust swimming speed
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
    }
    
    // Set the size multiplier to adjust fish size
    setSizeMultiplier(multiplier) {
        this.size = this.baseSize * multiplier;
    }
    
    update() {
        // Move fish based on direction (left to right or right to left)
        if (this.side === 'left') {
            this.x += this.speed;
            if (this.x > this.canvas.width + 100) {
                this.side = 'right';
                this.x = this.canvas.width + 50;
                this.y = this.canvas.random(50, this.canvas.height - 50);
                this.generateRandomColors(); // New colors for variety
            }
        } else {
            this.x -= this.speed;
            if (this.x < -100) {
                this.side = 'left';
                this.x = -50;
                this.y = this.canvas.random(50, this.canvas.height - 50);
                this.generateRandomColors(); // New colors for variety
            }
        }
        
        // Apply vertical wobble for natural swimming motion
        this.y += Math.sin(this.yWobble) * this.yWobbleAmount;
        this.yWobble += this.yWobbleSpeed;
        
        // Update tail wagging
        this.tailAngle = Math.sin(Date.now() * this.tailSpeed * 0.01) * this.tailAmplitude;
    }
    
    draw() {
        this.canvas.push();
        this.canvas.translate(this.x, this.y);
        
        // Flip based on direction
        if (this.side === 'right') {
            this.canvas.scale(-1, 1);
        }
        
        // Draw fish body
        this.canvas.noStroke();
        this.canvas.fill(this.bodyColor.r, this.bodyColor.g, this.bodyColor.b);
        this.canvas.ellipse(0, 0, this.size * 1.5, this.size * 0.8);
        
        // Draw tail
        this.canvas.push();
        this.canvas.fill(this.tailColor.r, this.tailColor.g, this.tailColor.b);
        this.canvas.translate(-this.size * 0.7, 0);
        this.canvas.rotate(this.canvas.radians(this.tailAngle));
        this.canvas.triangle(0, 0, -this.size * 0.8, -this.size * 0.4, -this.size * 0.8, this.size * 0.4);
        this.canvas.pop();
        
        // Draw eye
        this.canvas.fill(255);
        this.canvas.ellipse(this.size * 0.5, -this.size * 0.1, this.size * 0.2, this.size * 0.2);
        this.canvas.fill(0);
        this.canvas.ellipse(this.size * 0.55, -this.size * 0.1, this.size * 0.1, this.size * 0.1);
        
        this.canvas.pop();
    }
}

/**
 * UnderwaterTheme class that extends the base Theme
 * Integrated with state management system
 */
class UnderwaterTheme extends Theme {
    constructor(stateManager = null) {
        super();
        this.stateManager = stateManager;
        this.bubbles = [];
        this.fishes = [];
        this.numBubbles = 100; // Default number of bubbles
        this.numFishes = 5;    // Default number of fish
        this.bubbleSizeMultiplier = 1; // Default size multiplier
        this.fishSizeMultiplier = 1;   // Default fish size multiplier
        this.bubbleSpeedMultiplier = 1; // Default speed multiplier
        this.fishSpeedMultiplier = 1;   // Default fish speed multiplier
        this.wobbleIntensity = 0.5; // Default wobble intensity
        this.currentStrength = 0; // Default current strength
        this.currentDirection = 0; // Default current direction (degrees)
        
        // Default colors
        this.bubbleColor = { r: 220, g: 240, b: 255 }; // Light blue
        this.backgroundColor = { r: 0, g: 50, b: 100 }; // Deep blue
        
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
                console.log('UnderwaterTheme: Initialized with state manager');
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
                console.log('UnderwaterTheme: Applied state configuration');
            }
        }
    }
    
    /**
     * Apply the current state configuration to the theme
     */
    applyStateConfig() {
        if (!this.stateManager) return;
        
        const config = this.stateManager.getStateSection('themeConfigs.underwater');
        if (!config) {
            // If no configuration exists for underwater theme, create default config
            if (this.stateManager.state.debug) {
                console.log('UnderwaterTheme: No configuration found, using defaults');
            }
            
            // Create default configuration
            this.stateManager.updateState({
                themeConfigs: {
                    underwater: {
                        backgroundColor: '#003264',
                        bubbleColor: '#DCEFFF',
                        bubbleCount: 100,
                        fishCount: 5,
                        bubbleSize: 10,   // 1-40 scale like snowflakes
                        fishSize: 10,     // 1-20 scale
                        bubbleSpeed: 1,   // 0.5-3 scale
                        fishSpeed: 1,     // 0.5-3 scale
                        wobbleIntensity: 5, // 0-10 scale
                        currentStrength: 0, // 0-10 scale
                        currentDirection: 0 // 0-360 degrees
                    }
                }
            }, 'UnderwaterTheme.constructor');
            
            return;
        }
        
        // Set background color
        this.setBackgroundColor(config.backgroundColor);
        
        // Set bubble color
        this.setBubbleColor(config.bubbleColor);
        
        // Set number of bubbles and fish
        this.setNumberOfBubbles(config.bubbleCount);
        this.setNumberOfFish(config.fishCount);
        
        // Set size multipliers - convert from UI range to theme range
        const bubbleSizeMultiplier = config.bubbleSize / 10;
        const fishSizeMultiplier = config.fishSize / 10;
        this.setBubbleSizeMultiplier(bubbleSizeMultiplier);
        this.setFishSizeMultiplier(fishSizeMultiplier);
        
        // Set speed multipliers
        this.setBubbleSpeedMultiplier(config.bubbleSpeed);
        this.setFishSpeedMultiplier(config.fishSpeed);
        
        // Set wobble intensity - convert from 0-10 range to 0-1 range
        const wobbleIntensity = config.wobbleIntensity / 10;
        this.setWobbleIntensity(wobbleIntensity);
        
        // Set current properties
        this.setCurrent(config.currentStrength, config.currentDirection);
        
        // Set running state
        if (this.stateManager.state.isRunning) {
            this.start();
        } else {
            this.stop();
        }
    }

    // Setter methods
    setNumberOfBubbles(num) {
        const previouslyRunning = this.isRunning;
        
        // Stop animation temporarily if running
        if (previouslyRunning) {
            this.isRunning = false;
        }
        
        this.numBubbles = num;
        this.updateBubbles();
        
        // Resume animation if it was running before
        if (previouslyRunning) {
            this.isRunning = true;
        }
    }
    
    setNumberOfFish(num) {
        const previouslyRunning = this.isRunning;
        
        // Stop animation temporarily if running
        if (previouslyRunning) {
            this.isRunning = false;
        }
        
        this.numFishes = num;
        this.updateFishes();
        
        // Resume animation if it was running before
        if (previouslyRunning) {
            this.isRunning = true;
        }
    }

    setBubbleSizeMultiplier(multiplier) {
        this.bubbleSizeMultiplier = multiplier;
        // Update existing bubbles
        for (let bubble of this.bubbles) {
            bubble.setSizeMultiplier(this.bubbleSizeMultiplier);
        }
    }
    
    setFishSizeMultiplier(multiplier) {
        this.fishSizeMultiplier = multiplier;
        // Update existing fish
        for (let fish of this.fishes) {
            fish.setSizeMultiplier(this.fishSizeMultiplier);
        }
    }

    setBubbleSpeedMultiplier(multiplier) {
        this.bubbleSpeedMultiplier = multiplier;
        // Update existing bubbles
        for (let bubble of this.bubbles) {
            bubble.setSpeedMultiplier(this.bubbleSpeedMultiplier);
        }
    }
    
    setFishSpeedMultiplier(multiplier) {
        this.fishSpeedMultiplier = multiplier;
        // Update existing fish
        for (let fish of this.fishes) {
            fish.setSpeedMultiplier(this.fishSpeedMultiplier);
        }
    }
    
    setWobbleIntensity(intensity) {
        this.wobbleIntensity = intensity;
        // Update existing bubbles
        for (let bubble of this.bubbles) {
            bubble.setWobbleIntensity(intensity);
        }
    }
    
    setCurrent(strength, direction) {
        this.currentStrength = strength;
        this.currentDirection = direction;
        // Update existing bubbles
        for (let bubble of this.bubbles) {
            bubble.setCurrent(strength, direction);
        }
    }
    
    setBubbleColor(hexColor) {
        // Convert hex color to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        this.bubbleColor = { r, g, b };
        
        // Update existing bubbles
        for (let bubble of this.bubbles) {
            bubble.setColor(r, g, b);
        }
    }
    
    setBackgroundColor(hexColor) {
        // Convert hex color to RGB
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        
        this.backgroundColor = { r, g, b };
    }

    updateBubbles() {
        // Adjust number of bubbles
        if (this.bubbles.length < this.numBubbles) {
            // Add more bubbles
            const numToAdd = this.numBubbles - this.bubbles.length;
            for (let i = 0; i < numToAdd; i++) {
                const bubble = new Bubble(this.canvas, true, this.bubbleSizeMultiplier);
                bubble.setSpeedMultiplier(this.bubbleSpeedMultiplier);
                bubble.setColor(this.bubbleColor.r, this.bubbleColor.g, this.bubbleColor.b);
                bubble.setWobbleIntensity(this.wobbleIntensity);
                bubble.setCurrent(this.currentStrength, this.currentDirection);
                this.bubbles.push(bubble);
            }
        } else if (this.bubbles.length > this.numBubbles) {
            // Remove excess bubbles
            this.bubbles = this.bubbles.slice(0, this.numBubbles);
        }
    }
    
    updateFishes() {
        // Adjust number of fish
        if (this.fishes.length < this.numFishes) {
            // Add more fish
            const numToAdd = this.numFishes - this.fishes.length;
            for (let i = 0; i < numToAdd; i++) {
                const fish = new Fish(this.canvas, this.fishSizeMultiplier);
                fish.setSpeedMultiplier(this.fishSpeedMultiplier);
                this.fishes.push(fish);
            }
        } else if (this.fishes.length > this.numFishes) {
            // Remove excess fish
            this.fishes = this.fishes.slice(0, this.numFishes);
        }
    }

    setup() {
        // Create bubbles with initial distribution throughout canvas
        this.bubbles = [];
        for (let i = 0; i < this.numBubbles; i++) {
            const bubble = new Bubble(this.canvas, true, this.bubbleSizeMultiplier);
            bubble.setSpeedMultiplier(this.bubbleSpeedMultiplier);
            bubble.setColor(this.bubbleColor.r, this.bubbleColor.g, this.bubbleColor.b);
            bubble.setWobbleIntensity(this.wobbleIntensity);
            bubble.setCurrent(this.currentStrength, this.currentDirection);
            this.bubbles.push(bubble);
        }
        
        // Create fish
        this.fishes = [];
        for (let i = 0; i < this.numFishes; i++) {
            const fish = new Fish(this.canvas, this.fishSizeMultiplier);
            fish.setSpeedMultiplier(this.fishSpeedMultiplier);
            this.fishes.push(fish);
        }
    }

    update() {
        if (!this.isRunning) return;
        
        // Update all bubbles
        for (let bubble of this.bubbles) {
            bubble.update();
        }
        
        // Update all fish
        for (let fish of this.fishes) {
            fish.update();
        }
    }

    draw() {
        if (!this.canvas || !this.isRunning) return;

        // Clear background with custom color
        this.canvas.background(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
        
        // Draw subtle underwater gradient
        this.drawUnderwaterGradient();
        
        // Draw all fish
        for (let fish of this.fishes) {
            fish.draw();
        }
        
        // Draw all bubbles (on top of fish)
        for (let bubble of this.bubbles) {
            bubble.draw();
        }
    }
    
    drawUnderwaterGradient() {
        // Create a subtle gradient effect from bottom to top
        const numLayers = 20;
        const layerHeight = this.canvas.height / numLayers;
        
        for (let i = 0; i < numLayers; i++) {
            const y = i * layerHeight;
            const alpha = this.canvas.map(i, 0, numLayers, 100, 0);
            
            this.canvas.noStroke();
            this.canvas.fill(0, 0, 30, alpha);
            this.canvas.rect(0, y, this.canvas.width, layerHeight);
        }
        
        // Add some subtle light rays from top
        this.drawLightRays();
    }
    
    drawLightRays() {
        // Draw subtle light rays
        const numRays = 5;
        const rayWidth = this.canvas.width / (numRays - 1);
        
        this.canvas.push();
        this.canvas.blendMode(this.canvas.ADD);
        
        for (let i = 0; i < numRays; i++) {
            const x = i * rayWidth;
            const rayStrength = this.canvas.random(20, 40);
            
            this.canvas.noStroke();
            this.canvas.fill(200, 220, 255, rayStrength);
            this.canvas.triangle(
                x, 0,
                x - 100, this.canvas.height,
                x + 100, this.canvas.height
            );
        }
        
        this.canvas.pop();
    }

    cleanup() {
        // Clean up resources
        this.bubbles = [];
        this.fishes = [];
    }
    
    /**
     * Observer method called when state changes - renamed to avoid collision with animation update
     * @param {Object} newState - New application state
     * @param {Object} oldState - Previous application state
     */
    onStateUpdate(newState, oldState) {
        // Only process if we're the current theme
        if (newState.currentTheme !== 'underwater') return;
        
        // Check if theme-related state has changed
        const configChanged = 
            !oldState.themeConfigs.underwater ||
            JSON.stringify(newState.themeConfigs.underwater) !== 
            JSON.stringify(oldState.themeConfigs.underwater);
        const runningChanged = newState.isRunning !== oldState.isRunning;
        
        // If any relevant state has changed, update the theme
        if (configChanged || runningChanged) {
            this.applyStateConfig();
            
            if (newState.debug) {
                console.log('UnderwaterTheme: Updated from state change');
            }
        }
    }
}