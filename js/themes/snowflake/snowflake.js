/**
 * Color utility functions for the Snowflakes Theme
 */
// Color conversion utilities
const ColorUtils = {
    /**
     * Convert hex color string to RGB object
     * @param {string} hexColor - Hex color string (e.g. "#FFFFFF")
     * @returns {Object} RGB object with r, g, b properties
     */
    hexToRgb(hexColor) {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);
        return { r, g, b };
    },
    
    /**
     * Convert RGB to HSL color space
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {Array} HSL values as [h, s, l]
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h = Math.round(h * 60);
        }
        
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        
        return [h, s, l];
    },
    
    /**
     * Convert HSL to RGB color space
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {Array} RGB values as [r, g, b]
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },
    
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
};

/**
 * Constants for the Snowflakes theme
 */
const CONSTANTS = {
    // Snowflake physics
    BASE_SIZE_MIN: 3,
    BASE_SIZE_MAX: 10,
    WOBBLE_AMOUNT_MIN: 0.8,
    WOBBLE_AMOUNT_MAX: 2.0,
    WOBBLE_SPEED_MIN: 0.01,
    WOBBLE_SPEED_MAX: 0.05,
    ROTATION_SPEED_MIN: -0.02,
    ROTATION_SPEED_MAX: 0.02,
    
    // Explosion effects
    EXPLOSION_SIZE_MULTIPLIER: 1.5,
    EXPLOSION_PARTICLE_MULTIPLIER: 1.5,
    EXPLOSION_LIFESPAN: 150,
    CENTRAL_GLOW_INITIAL_ALPHA: 230,
    CENTRAL_GLOW_DECAY: 0.97,
    BURST_RAY_COUNT: 12,
    BURST_RAY_LENGTH_MIN: 5,  // Multiplied by size
    BURST_RAY_LENGTH_MAX: 10, // Multiplied by size
    BURST_RAY_GROWTH: 1.06,
    BURST_RAY_WIDTH_DECAY: 0.95,
    BURST_LIFESPAN_RATIO: 0.3,
    
    // Particle physics
    PARTICLE_SPEED_MIN: 1,
    PARTICLE_SPEED_MAX: 7,
    PARTICLE_SIZE_MIN: 3,
    PARTICLE_SIZE_MAX: 15,
    PARTICLE_LIFESPAN_MIN_RATIO: 0.5,
    PARTICLE_LIFESPAN_MAX_RATIO: 1.2,
    PARTICLE_DRAG_DUST: 0.96,
    PARTICLE_DRAG_DEFAULT: 0.98,
    PARTICLE_GRAVITY_CRYSTAL: 0.03,
    PARTICLE_GRAVITY_DEFAULT: 0.07,
    PARTICLE_BOUNCE_DAMPEN: 0.6,
    PARTICLE_BOUNCE_FRICTION: 0.8,
    PARTICLE_SIZE_DECAY: 0.8,
    
    // Audio reaction
    VOLUME_BASE_SIZE_FACTOR: 0.7,
    VOLUME_ADDITIONAL_SIZE_FACTOR: 0.6,
    VOLUME_BASE_PARTICLE_FACTOR: 0.8,
    VOLUME_ADDITIONAL_PARTICLE_FACTOR: 0.5,
    POSITION_PADDING_RATIO: 0.1,
    
    // Drawing constants
    TRAIL_ALPHA_RATIO: 0.7,
    SPARKLE_INTENSITY_MIN: 0.3,
    SPARKLE_INTENSITY_MAX: 0.7,
    SPARKLE_FREQUENCY: 0.3,
    WHITE_PARTICLE_CHANCE: 0.15,
    TRAIL_PARTICLE_CHANCE: 0.7
};

/**
 * A single Snowflake object
 */
class Snowflake {
    constructor(canvas, initialDistribution = false, sizeMultiplier = 1) {
        this.canvas = canvas;
        this.x = this.canvas.random(0, this.canvas.width);
        if (initialDistribution) {
            this.y = this.canvas.random(-100, this.canvas.height);
        } else {
            this.y = this.canvas.random(-100, -10);
        }
        
        this.baseSize = this.canvas.random(CONSTANTS.BASE_SIZE_MIN, CONSTANTS.BASE_SIZE_MAX);
        this.size = this.baseSize * sizeMultiplier;
        
        this.baseSpeed = this.canvas.map(this.baseSize, CONSTANTS.BASE_SIZE_MIN, CONSTANTS.BASE_SIZE_MAX, 1, 3);
        this.speedMultiplier = 1;
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        this.opacity = this.canvas.map(this.baseSize, CONSTANTS.BASE_SIZE_MIN, CONSTANTS.BASE_SIZE_MAX, 150, 255);
        
        this.baseWobbleAmount = this.canvas.random(CONSTANTS.WOBBLE_AMOUNT_MIN, CONSTANTS.WOBBLE_AMOUNT_MAX);
        this.wobbleIntensity = 1.0;
        this.wobble = this.canvas.random(0, this.canvas.TWO_PI);
        this.baseWobbleSpeed = this.canvas.random(CONSTANTS.WOBBLE_SPEED_MIN, CONSTANTS.WOBBLE_SPEED_MAX);
        this.wobbleSpeed = this.baseWobbleSpeed;
        
        this.windStrength = 0;
        this.windDirection = 0;
        
        this.color = { r: 255, g: 255, b: 255 };
        
        this.rotation = this.canvas.random(0, this.canvas.TWO_PI);
        this.rotationSpeed = this.canvas.random(CONSTANTS.ROTATION_SPEED_MIN, CONSTANTS.ROTATION_SPEED_MAX);
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
    }

    setSizeMultiplier(multiplier) {
        this.size = this.baseSize * multiplier;
    }
    
    setWobbleIntensity(intensity) {
        this.wobbleIntensity = intensity;
        this.wobbleSpeed = this.baseWobbleSpeed * (intensity * 2.2 + 0.3);
    }
    
    setWind(strength, direction) {
        this.windStrength = strength;
        this.windDirection = direction;
    }
    
    setColor(r, g, b) {
        this.color = { r, g, b };
    }

    update() {
        this.y += this.speed;
        
        const wobbleAmount = this.baseWobbleAmount * this.wobbleIntensity * 2.0;
        this.x += this.canvas.sin(this.wobble) * wobbleAmount;
        this.wobble += this.wobbleSpeed;
        
        if (this.windStrength > 0) {
            const windRad = this.canvas.radians(this.windDirection);
            const inverseSize = this.canvas.map(this.size, CONSTANTS.BASE_SIZE_MIN, 40, 1, 0.3);
            const windForce = this.windStrength * 0.2 * inverseSize;
            this.x += Math.cos(windRad) * windForce;
            this.y += Math.sin(windRad) * windForce;
        }
        
        this.rotation += this.rotationSpeed;
        
        if (this.x < -50) {
            this.x = this.canvas.width + 50;
        } else if (this.x > this.canvas.width + 50) {
            this.x = -50;
        }
        
        if (this.y > this.canvas.height + this.size) {
            this.resetPosition();
        }
    }

    draw() {
        this.canvas.push();
        this.canvas.noStroke();
        this.canvas.fill(this.color.r, this.color.g, this.color.b, this.opacity);
        this.canvas.translate(this.x, this.y);
        this.canvas.rotate(this.rotation);

        for (let i = 0; i < 6; i++) {
            this.canvas.push();
            this.canvas.rotate(this.canvas.PI * 2 * i / 6);
            this.canvas.ellipse(0, 0, this.size * 0.2, this.size);
            this.canvas.pop();
        }
        
        this.canvas.ellipse(0, 0, this.size * 0.5);
        
        this.canvas.pop();
    }

    resetPosition() {
        this.x = this.canvas.random(0, this.canvas.width);
        this.y = this.canvas.random(-150, -10);
    }
}

/**
 * Particle class for explosion effects
 */
class ExplosionParticle {
    /**
     * Create a new explosion particle
     * 
     * @param {p5} canvas - The p5.js instance
     * @param {number} x - Starting X position
     * @param {number} y - Starting Y position
     * @param {number} angle - Direction angle in radians
     * @param {number} speed - Movement speed
     * @param {number} size - Particle size
     * @param {number} lifespan - Total lifespan in frames
     * @param {Object} color - RGB color object
     * @param {string} type - Particle type ('snowflake', 'sparkle', 'dust', or 'crystal')
     */
    constructor(canvas, x, y, angle, speed, size, lifespan, color, type) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = size;
        this.alpha = 255;
        this.lifespan = lifespan;
        this.color = color;
        this.type = type;
        
        // Particle properties
        this.sparkle = canvas.random() > 0.5;
        this.rotation = canvas.random(0, canvas.TWO_PI);
        this.rotationSpeed = canvas.random(-0.15, 0.15);
        this.trail = canvas.random() > CONSTANTS.TRAIL_PARTICLE_CHANCE;
        this.trailLength = canvas.random(3, 10);
        this.bounceCount = Math.floor(canvas.random(0, 3));
        this.trailHistory = [];
    }
    
    /**
     * Update the particle's position and properties
     * 
     * @param {number} age - Current age of the parent explosion
     * @param {number} totalLifespan - Total lifespan of the parent explosion
     */
    update(age, totalLifespan) {
        // Update trail first (to record current position)
        this.updateTrail();
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Apply drag based on particle type
        const drag = this.type === 'dust' 
            ? CONSTANTS.PARTICLE_DRAG_DUST 
            : CONSTANTS.PARTICLE_DRAG_DEFAULT;
        this.vx *= drag;
        this.vy *= drag;
        
        // Apply gravity based on particle type
        const gravity = this.type === 'crystal' 
            ? CONSTANTS.PARTICLE_GRAVITY_CRYSTAL 
            : CONSTANTS.PARTICLE_GRAVITY_DEFAULT;
        this.vy += gravity;
        
        // Handle bouncing
        this.handleBouncing();
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Update alpha based on lifecycle
        this.updateAlpha(age, totalLifespan);
    }
    
    /**
     * Update the particle's trail
     */
    updateTrail() {
        if (this.trail) {
            this.trailHistory.unshift({ 
                x: this.x, 
                y: this.y, 
                alpha: this.alpha * CONSTANTS.TRAIL_ALPHA_RATIO 
            });
            
            if (this.trailHistory.length > this.trailLength) {
                this.trailHistory.pop();
            }
        }
    }
    
    /**
     * Handle bouncing off the bottom of the screen
     */
    handleBouncing() {
        if (this.bounceCount > 0 && this.y > this.canvas.height - 10) {
            this.vy = -this.vy * CONSTANTS.PARTICLE_BOUNCE_DAMPEN;
            this.vx *= CONSTANTS.PARTICLE_BOUNCE_FRICTION;
            this.bounceCount--;
            
            if (this.size > 5) {
                this.size *= CONSTANTS.PARTICLE_SIZE_DECAY;
            }
        }
    }
    
    /**
     * Update the particle's alpha based on its lifecycle
     * 
     * @param {number} age - Current age of the parent explosion
     * @param {number} totalLifespan - Total lifespan of the parent explosion
     */
    updateAlpha(age, totalLifespan) {
        const lifeProgress = age / this.lifespan;
        let alphaFactor;
        
        if (lifeProgress < 0.2) {
            alphaFactor = this.canvas.map(lifeProgress, 0, 0.2, 0, 1);
        } else {
            alphaFactor = this.canvas.map(lifeProgress, 0.2, 1, 1, 0);
            alphaFactor = 1 - (1 - alphaFactor) * (1 - alphaFactor);
        }
        
        this.alpha = 255 * alphaFactor;
        
        if (this.sparkle) {
            const sparkleIntensity = CONSTANTS.SPARKLE_INTENSITY_MIN + 
                CONSTANTS.SPARKLE_INTENSITY_MAX * 
                Math.sin(age * CONSTANTS.SPARKLE_FREQUENCY + this.rotation);
            this.alpha *= 0.7 + sparkleIntensity * 0.5;
        }
    }
    
    /**
     * Draw the particle's trail
     */
    drawTrail() {
        if (!this.trail || this.trailHistory.length === 0) return;
        
        for (let i = 0; i < this.trailHistory.length; i++) {
            const pos = this.trailHistory[i];
            const trailSize = this.size * (1 - i / this.trailHistory.length);
            const trailAlpha = pos.alpha * (1 - i / this.trailHistory.length);
            
            this.canvas.fill(this.color.r, this.color.g, this.color.b, trailAlpha);
            this.canvas.ellipse(pos.x, pos.y, trailSize * 0.6);
        }
    }
    
    /**
     * Draw the particle based on its type
     */
    draw() {
        if (this.alpha <= 0) return;
        
        // Draw trail if present
        this.drawTrail();
        
        this.canvas.push();
        this.canvas.translate(this.x, this.y);
        this.canvas.rotate(this.rotation);
        
        this.canvas.fill(this.color.r, this.color.g, this.color.b, this.alpha);
        
        // Draw based on particle type
        switch (this.type) {
            case 'sparkle':
                this.drawSparkleParticle();
                break;
                
            case 'dust':
                this.canvas.ellipse(0, 0, this.size * 0.7);
                break;
                
            case 'crystal':
                this.drawCrystalParticle();
                break;
                
            case 'snowflake':
            default:
                this.drawSnowflakeParticle();
                break;
        }
        
        this.canvas.pop();
    }
    
    /**
     * Draw a sparkle-type particle
     */
    drawSparkleParticle() {
        if (this.sparkle) {
            this.canvas.fill(255, 255, 255, this.alpha);
        }
        
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;
        const numPoints = 6;
        
        this.canvas.beginShape();
        for (let i = 0; i < numPoints * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = this.canvas.PI * i / numPoints;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.canvas.vertex(x, y);
        }
        this.canvas.endShape(this.canvas.CLOSE);
        
        this.canvas.fill(this.color.r, this.color.g, this.color.b, this.alpha * 0.3);
        this.canvas.ellipse(0, 0, this.size * 2);
    }
    
    /**
     * Draw a crystal-type particle
     */
    drawCrystalParticle() {
        this.canvas.quad(
            0, -this.size / 2,
            this.size / 2, 0,
            0, this.size / 2,
            -this.size / 2, 0
        );
        this.canvas.fill(255, 255, 255, this.alpha * 0.5);
        this.canvas.quad(
            0, -this.size / 4,
            this.size / 4, 0,
            0, this.size / 4,
            -this.size / 4, 0
        );
    }
    
    /**
     * Draw a snowflake-type particle
     */
    drawSnowflakeParticle() {
        for (let i = 0; i < 6; i++) {
            this.canvas.push();
            this.canvas.rotate(this.canvas.PI * 2 * i / 6);
            
            this.canvas.ellipse(0, 0, this.size * 0.2, this.size);
            
            if (this.size > 7) {
                this.canvas.push();
                this.canvas.translate(0, this.size * 0.3);
                this.canvas.rotate(this.canvas.PI / 3);
                this.canvas.ellipse(0, 0, this.size * 0.1, this.size * 0.3);
                this.canvas.pop();
                
                this.canvas.push();
                this.canvas.translate(0, -this.size * 0.3);
                this.canvas.rotate(-this.canvas.PI / 3);
                this.canvas.ellipse(0, 0, this.size * 0.1, this.size * 0.3);
                this.canvas.pop();
            }
            
            this.canvas.pop();
        }
        
        this.canvas.ellipse(0, 0, this.size * 0.5);
        
        if (this.sparkle) {
            this.canvas.fill(255, 255, 255, this.alpha * 0.7);
            this.canvas.ellipse(0, 0, this.size * 0.3);
        }
    }
}

/**
 * Represents a single ray in the burst effect
 */
class BurstRay {
    /**
     * Create a new burst ray
     * 
     * @param {p5} canvas - The p5.js instance
     * @param {number} angle - Ray angle in radians
     * @param {number} length - Ray length
     * @param {number} width - Ray width
     * @param {Object} color - RGB color object
     */
    constructor(canvas, angle, length, width, color) {
        this.canvas = canvas;
        this.angle = angle;
        this.length = length;
        this.width = width;
        this.color = color;
        this.alpha = 255;
    }
    
    /**
     * Update the ray's properties
     * 
     * @param {number} age - Current age of the parent explosion
     * @param {number} totalLifespan - Total lifespan of the parent explosion
     * @param {number} burstLifespanRatio - Ratio of lifespan for the burst effect
     */
    update(age, totalLifespan, burstLifespanRatio) {
        this.length *= CONSTANTS.BURST_RAY_GROWTH;
        this.width *= CONSTANTS.BURST_RAY_WIDTH_DECAY;
        this.alpha = this.canvas.map(
            age, 
            0, 
            totalLifespan * burstLifespanRatio, 
            255, 
            0
        );
    }
    
    /**
     * Draw the ray
     */
    draw(centerX, centerY) {
        this.canvas.push();
        this.canvas.translate(centerX, centerY);
        this.canvas.rotate(this.angle);
        
        const steps = 5;
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            const alpha = this.alpha * (1 - t);
            const length = this.length * t;
            const width = this.width * (1 - t * 0.5);
            
            this.canvas.fill(this.color.r, this.color.g, this.color.b, alpha);
            this.canvas.ellipse(length, 0, width, width);
        }
        
        this.canvas.pop();
    }
}

/**
 * Central glow effect for explosions
 */
class CentralGlow {
    /**
     * Create a new central glow
     * 
     * @param {p5} canvas - The p5.js instance
     * @param {number} size - Glow size
     * @param {Object} color - RGB color object
     */
    constructor(canvas, size, color) {
        this.canvas = canvas;
        this.size = size;
        this.alpha = CONSTANTS.CENTRAL_GLOW_INITIAL_ALPHA;
        this.color = color;
    }
    
    /**
     * Update the glow's properties
     * 
     * @param {number} age - Current age of the parent explosion
     * @param {number} totalLifespan - Total lifespan of the parent explosion
     * @returns {boolean} Whether the glow is still active
     */
    update(age, totalLifespan) {
        this.size *= CONSTANTS.CENTRAL_GLOW_DECAY;
        this.alpha = Math.max(0, this.canvas.map(
            age, 
            0, 
            totalLifespan * 0.5, 
            CONSTANTS.CENTRAL_GLOW_INITIAL_ALPHA, 
            0
        ));
        
        return this.alpha > 0;
    }
    
    /**
     * Draw the glow
     * 
     * @param {number} x - Center X position
     * @param {number} y - Center Y position
     */
    draw(x, y) {
        const glowColor = this.color;
        
        for (let i = 5; i >= 0; i--) {
            const alpha = this.alpha * (i / 5);
            const size = this.size * (1 - i / 10);
            
            this.canvas.fill(glowColor.r, glowColor.g, glowColor.b, alpha);
            this.canvas.ellipse(x, y, size);
        }
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
        this.size = size * CONSTANTS.EXPLOSION_SIZE_MULTIPLIER;
        this.particleCount = particleCount * CONSTANTS.EXPLOSION_PARTICLE_MULTIPLIER;
        this.particles = [];
        this.lifespan = CONSTANTS.EXPLOSION_LIFESPAN;
        this.age = 0;
        this.active = true;
        
        // Generate complementary colors for more beautiful effects
        this.secondaryColor = this.generateComplementaryColor(color);
        this.tertiaryColor = this.generateAccentColor(color);
        
        // Create effects
        this.createParticles();
        this.createBurstEffect();

        // Debug info
        this._debugInfo = {
            createdAt: Date.now(),
            position: { x, y },
            color: { ...color },
            size: this.size,
            particleCount: this.particleCount,
            particlesCreated: this.particles.length
        };
    }
    
    /**
     * Generate a complementary color to the main color
     */
    generateComplementaryColor(color) {
        // Simple complementary color - invert RGB
        return {
            r: 255 - color.r,
            g: 255 - color.g,
            b: 255 - color.b
        };
    }
    
    /**
     * Generate an accent color (shifted hue)
     */
    generateAccentColor(color) {
        // Convert RGB to HSL, shift hue by 60 degrees, convert back
        const [h, s, l] = ColorUtils.rgbToHsl(color.r, color.g, color.b);
        const newHue = (h + 60) % 360;
        const [r, g, b] = ColorUtils.hslToRgb(newHue, s, l);
        return { r, g, b };
    }
    
    /**
     * Create the central burst effect
     */
    createBurstEffect() {
        this.burstRays = [];
        
        // Create rays emanating from center
        const rayCount = CONSTANTS.BURST_RAY_COUNT;
        for (let i = 0; i < rayCount; i++) {
            const angle = (i / rayCount) * this.canvas.TWO_PI;
            const length = this.canvas.random(
                this.size * CONSTANTS.BURST_RAY_LENGTH_MIN, 
                this.size * CONSTANTS.BURST_RAY_LENGTH_MAX
            );
            
            const ray = new BurstRay(
                this.canvas,
                angle, 
                length,
                this.canvas.random(2, 5) * this.size / 2,
                this.canvas.random() < 0.5 ? this.secondaryColor : this.tertiaryColor
            );
            
            this.burstRays.push(ray);
        }
        
        // Create central glow
        this.centralGlow = new CentralGlow(this.canvas, this.size * 5, this.color);
    }
    
    /**
     * Create particles for the explosion
     */
    createParticles() {
        const particleTypes = ['snowflake', 'sparkle', 'dust', 'crystal']; 
        
        for (let i = 0; i < this.particleCount; i++) {
            // Basic particle parameters
            const angle = this.canvas.random(0, this.canvas.TWO_PI);
            const speed = this.canvas.random(
                CONSTANTS.PARTICLE_SPEED_MIN, 
                CONSTANTS.PARTICLE_SPEED_MAX
            ) * this.size;
            const particleSize = this.canvas.random(
                CONSTANTS.PARTICLE_SIZE_MIN, 
                CONSTANTS.PARTICLE_SIZE_MAX
            ) * this.size;
            const lifespan = this.canvas.random(
                this.lifespan * CONSTANTS.PARTICLE_LIFESPAN_MIN_RATIO, 
                this.lifespan * CONSTANTS.PARTICLE_LIFESPAN_MAX_RATIO
            );
            
            // Select particle type
            const type = particleTypes[Math.floor(this.canvas.random(0, particleTypes.length))];
            
            // Select particle color
            const particleColor = this.selectParticleColor();
            
            // Create and add particle
            const particle = new ExplosionParticle(
                this.canvas,
                this.x,
                this.y,
                angle,
                speed,
                particleSize,
                lifespan,
                particleColor,
                type
            );
            
            this.particles.push(particle);
        }
    }
    
    /**
     * Select a color for a particle based on weighted random choices
     * @returns {Object} RGB color object
     */
    selectParticleColor() {
        const colorChoice = this.canvas.random();
        let particleColor;
        
        if (colorChoice < 0.4) {
            particleColor = this.color;
        } else if (colorChoice < 0.7) {
            particleColor = this.secondaryColor;
        } else {
            particleColor = this.tertiaryColor;
        }
        
        // Chance for pure white particles
        if (this.canvas.random() < CONSTANTS.WHITE_PARTICLE_CHANCE) {
            particleColor = { r: 255, g: 255, b: 255 };
        }
        
        return particleColor;
    }
    
    /**
     * Update all components of the explosion
     */
    update() {
        if (!this.active) return;
        
        this.age++;
        if (this.age >= this.lifespan) {
            this.active = false;
            return;
        }
        
        this.updateCentralGlow();
        this.updateBurstRays();
        this.updateParticles();
        this.logDebugUpdates();
    }
    
    /**
     * Update the central glow effect
     */
    updateCentralGlow() {
        if (this.centralGlow) {
            const stillActive = this.centralGlow.update(this.age, this.lifespan);
            if (!stillActive) {
                this.centralGlow = null;
            }
        }
    }
    
    /**
     * Update the burst rays
     */
    updateBurstRays() {
        if (this.burstRays && this.age < this.lifespan * CONSTANTS.BURST_LIFESPAN_RATIO) {
            for (let ray of this.burstRays) {
                ray.update(this.age, this.lifespan, CONSTANTS.BURST_LIFESPAN_RATIO);
            }
        } else {
            this.burstRays = null;
        }
    }
    
    /**
     * Update all particles
     */
    updateParticles() {
        for (let particle of this.particles) {
            particle.update(this.age, this.lifespan);
        }
    }
    
    /**
     * Log debug updates at specific lifecycle moments
     */
    logDebugUpdates() {
        const debugPoints = [1, Math.floor(this.lifespan / 2), this.lifespan - 1];
        if (debugPoints.includes(this.age)) {
            this._debugInfo.age = this.age;
            this._debugInfo.remainingParticles = this.particles.filter(p => p.alpha > 0).length;
            this._debugInfo.lifespanProgress = `${Math.round((this.age / this.lifespan) * 100)}%`;
            
            if (window.sentireApp && window.sentireApp.stateManager && 
                window.sentireApp.stateManager.state.debug) {
                console.log(`SnowflakeExplosion: Progress update`, this._debugInfo);
            }
        }
    }
    
    /**
     * Draw the explosion and all its components
     */
    draw() {
        if (!this.active) return;
        
        this.canvas.push();
        this.canvas.noStroke();
        
        // Draw central glow
        if (this.centralGlow) {
            this.centralGlow.draw(this.x, this.y);
        }
        
        // Draw burst rays
        if (this.burstRays) {
            for (let ray of this.burstRays) {
                ray.draw(this.x, this.y);
            }
        }
        
        // Draw particles
        for (let particle of this.particles) {
            particle.draw();
        }
        
        this.canvas.pop();
    }
    
    /**
     * Check if the explosion is finished
     */
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
        this.numSnowflakes = 200;
        this.sizeMultiplier = 1;
        this.speedMultiplier = 1;
        this.wobbleIntensity = 0.5;
        this.windStrength = 0;
        this.windDirection = 0;
        
        this.snowflakeColor = { r: 255, g: 255, b: 255 };
        this.backgroundColor = { r: 0, g: 10, b: 40 };
        
        this.explosions = [];
        
        this.effectsConfig = {
            enabled: true,
            particleCount: 25,
            sizeMultiplier: 1.0,
            colorMatchSnowflakes: true,
            maxSimultaneous: 5,
            triggerThreshold: 70,
            cooldownMs: 500
        };
        
        this.lastExplosionTime = 0;
        this.audioManager = null;
        
        if (this.stateManager) {
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'theme');
            
            this.stateManager.subscribe({
                update: this.onStateUpdate.bind(this)
            }, 'appState');
            
            this.logDebug('Initialized with state manager');
        }
    }
    
    logDebug(message, data = null) {
        if (this.stateManager && this.stateManager.state.debug) {
            if (data) {
                console.log(`SnowflakesTheme: ${message}`, data);
            } else {
                console.log(`SnowflakesTheme: ${message}`);
            }
        }
    }
    
    createConfiguredSnowflake(initialDistribution) {
        const snowflake = new Snowflake(this.canvas, initialDistribution, this.sizeMultiplier);
        snowflake.setSpeedMultiplier(this.speedMultiplier);
        snowflake.setColor(this.snowflakeColor.r, this.snowflakeColor.g, this.snowflakeColor.b);
        snowflake.setWobbleIntensity(this.wobbleIntensity);
        snowflake.setWind(this.windStrength, this.windDirection);
        return snowflake;
    }
    
    init(canvas) {
        super.init(canvas);
        
        if (window.sentireApp && window.sentireApp.audioManager) {
            this.connectToAudioManager(window.sentireApp.audioManager);
        }
        
        if (this.stateManager) {
            this.applyStateConfig();
            this.logDebug('Applied state configuration');
        }
    }
    
    connectToAudioManager(audioManager) {
        this.audioManager = audioManager;
        this.audioManager.on('volumeThreshold', this.handleVolumeThreshold.bind(this));
        this.logDebug('Connected to audio manager');
    }
    
    handleVolumeThreshold(data) {
        if (!this.isRunning || !this.effectsConfig.enabled) return;
        
        this.logDebug(`Audio trigger received with volume ${data.volume.toFixed(1)}`, {
            isRunning: this.isRunning,
            explosionsEnabled: this.effectsConfig.enabled,
            themeActive: this.stateManager ? (this.stateManager.state.currentTheme === 'snowflakes') : true,
            audioData: data,
            currentNumEffects: this.explosions.length
        });

        if (this.stateManager && this.stateManager.state.currentTheme !== 'snowflakes') {
            return;
        }
        
        if (this.explosions.length >= this.effectsConfig.maxSimultaneous) {
            this.logDebug(`Max effects limit reached (${this.explosions.length}/${this.effectsConfig.maxSimultaneous})`);
            return;
        }
        
        const currentTime = Date.now();
        if (currentTime - this.lastExplosionTime < this.effectsConfig.cooldownMs) {
            this.logDebug(`Cooldown active, skipping explosion`);
            return;
        }
        
        this.createRandomExplosion(data.volume);
        this.lastExplosionTime = currentTime;
        this.logDebug(`Created explosion from audio trigger (volume: ${data.volume.toFixed(1)})`);
    }
    
    createRandomExplosion(volume) {
        // Generate a random position for the explosion
        const x = this.canvas.random(
            this.canvas.width * CONSTANTS.POSITION_PADDING_RATIO, 
            this.canvas.width * (1 - CONSTANTS.POSITION_PADDING_RATIO)
        );
        const y = this.canvas.random(
            this.canvas.height * CONSTANTS.POSITION_PADDING_RATIO, 
            this.canvas.height * (1 - CONSTANTS.POSITION_PADDING_RATIO)
        );
        
        // Calculate explosion size based on volume and config
        const volumeRatio = volume / 100; // 0-1 range
        const baseSize = this.effectsConfig.sizeMultiplier;
        const sizeMultiplier = baseSize * (
            CONSTANTS.VOLUME_BASE_SIZE_FACTOR + 
            volumeRatio * CONSTANTS.VOLUME_ADDITIONAL_SIZE_FACTOR
        );
        
        // Use snowflake color or generate a custom color
        let color;
        if (this.effectsConfig.colorMatchSnowflakes) {
            color = this.snowflakeColor;
        } else {
            // Generate a pastel color based on volume
            const hue = (this.canvas.frameCount * 2 + volume * 2) % 360;
            const saturation = 80;
            const brightness = 95;
            
            // Convert HSB to RGB
            const rgb = ColorUtils.hsbToRgb(hue, saturation, brightness);
            color = { r: rgb[0], g: rgb[1], b: rgb[2] };
        }
        
        // Calculate particle count based on volume
        const particleCount = Math.floor(
            this.effectsConfig.particleCount * (
                CONSTANTS.VOLUME_BASE_PARTICLE_FACTOR + 
                volumeRatio * CONSTANTS.VOLUME_ADDITIONAL_PARTICLE_FACTOR
            )
        );
        
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
    
    applyStateConfig() {
        if (!this.stateManager) return;
        
        const config = this.stateManager.getStateSection('themeConfigs.snowflakes');
        if (!config) return;
        
        this.setBackgroundColor(config.backgroundColor);
        this.setSnowflakeColor(config.snowflakeColor);
        this.setNumberOfSnowflakes(config.count);
        
        const sizeMultiplier = config.size / 10;
        this.setSizeMultiplier(sizeMultiplier);
        
        this.setSpeedMultiplier(config.speed);
        
        const wobbleIntensity = config.wobbleIntensity / 10;
        this.setWobbleIntensity(wobbleIntensity);
        
        this.setWind(config.windStrength, config.windDirection);
        
        if (this.audioManager && typeof this.audioManager.getThreshold === 'function') {
            this.effectsConfig.triggerThreshold = this.audioManager.getThreshold();
            this.logDebug(`Using AudioManager threshold ${this.effectsConfig.triggerThreshold}`);
        }
        
        this.logDebug('Audio reactive config initialized', this.effectsConfig);
        
        if (this.stateManager.state.isRunning) {
            this.start();
        } else {
            this.stop();
        }
    }

    setNumberOfSnowflakes(num) {
        const previouslyRunning = this.isRunning;
        
        if (previouslyRunning) {
            this.isRunning = false;
        }
        
        this.numSnowflakes = num;
        this.updateSnowflakes();
        
        if (previouslyRunning) {
            this.isRunning = true;
        }
    }

    setSizeMultiplier(multiplier) {
        this.sizeMultiplier = multiplier;
        for (let snowflake of this.snowflakes) {
            snowflake.setSizeMultiplier(this.sizeMultiplier);
        }
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        for (let snowflake of this.snowflakes) {
            snowflake.setSpeedMultiplier(this.speedMultiplier);
        }
    }
    
    setWobbleIntensity(intensity) {
        this.wobbleIntensity = intensity;
        for (let snowflake of this.snowflakes) {
            snowflake.setWobbleIntensity(intensity);
        }
    }
    
    setWind(strength, direction) {
        this.windStrength = strength;
        this.windDirection = direction;
        for (let snowflake of this.snowflakes) {
            snowflake.setWind(strength, direction);
        }
    }
    
    setSnowflakeColor(hexColor) {
        const rgb = ColorUtils.hexToRgb(hexColor);
        this.snowflakeColor = rgb;
        
        for (let snowflake of this.snowflakes) {
            snowflake.setColor(rgb.r, rgb.g, rgb.b);
        }
    }
    
    setBackgroundColor(hexColor) {
        this.backgroundColor = ColorUtils.hexToRgb(hexColor);
    }

    updateSnowflakes() {
        if (this.snowflakes.length < this.numSnowflakes) {
            const numToAdd = this.numSnowflakes - this.snowflakes.length;
            for (let i = 0; i < numToAdd; i++) {
                this.snowflakes.push(this.createConfiguredSnowflake(true));
            }
        } else if (this.snowflakes.length > this.numSnowflakes) {
            this.snowflakes = this.snowflakes.slice(0, this.numSnowflakes);
        }
    }

    setup() {
        this.snowflakes = [];
        for (let i = 0; i < this.numSnowflakes; i++) {
            this.snowflakes.push(this.createConfiguredSnowflake(true));
        }
    }

    update() {
        if (!this.isRunning) return;
        
        for (let snowflake of this.snowflakes) {
            snowflake.update();
        }
        
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            this.explosions[i].update();
            
            if (this.explosions[i].isFinished()) {
                this.explosions.splice(i, 1);
            }
        }
    }

    draw() {
        if (!this.isRunning) return;

        this.canvas.background(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
        
        for (let snowflake of this.snowflakes) {
            snowflake.draw();
        }
        
        for (let explosion of this.explosions) {
            explosion.draw();
        }
    }

    cleanup() {
        this.snowflakes = [];
        this.logDebug('Cleaned up resources');
    }
    
    onStateUpdate(newState, oldState) {
        if (newState.currentTheme !== 'snowflakes') return;
        
        const configChanged = 
            JSON.stringify(newState.themeConfigs.snowflakes) !== 
            JSON.stringify(oldState.themeConfigs.snowflakes);
        const runningChanged = newState.isRunning !== oldState.isRunning;
        
        if (configChanged || runningChanged) {
            this.applyStateConfig();
            
            if (newState.debug) {
                this.logDebug('Updated from state change');
            }
        }
    }
    
    setEffectsConfig(config) {
        this.effectsConfig = {
            ...this.effectsConfig,
            ...config
        };
        
        this.logDebug('Updated effects config', this.effectsConfig);
    }
    
    triggerExplosion(x, y, size = 1) {
        if (!this.isRunning || !this.effectsConfig.enabled) return;
        
        const explosion = new SnowflakeExplosion(
            this.canvas,
            x, 
            y,
            this.snowflakeColor,
            size,
            this.effectsConfig.particleCount
        );
        
        this.explosions.push(explosion);
    }
}