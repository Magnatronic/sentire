/**
 * Snowflakes Theme
 * 
 * This theme creates a snowfall effect with interactive snowflakes.
 * Uses shared ColorUtils from utils/colorUtils.js
 */
// Check if ColorUtils is available
if (!window.ColorUtils) {
    console.error('ColorUtils not found! Make sure utils/colorUtils.js is loaded before snowflake.js');
}

/**
 * Constants for the Snowflakes theme
 * 
 * This object contains all the configurable parameters for the theme.
 * Adjusting these values will change the behavior and appearance of the theme.
 * When creating your own theme, use these constants as a template and adjust
 * for your specific visual effects.
 */
const CONSTANTS = {
    // ==========================================
    // Snowflake Physics - Controls basic snowflake behavior
    // ==========================================
    
    /** Minimum base size for snowflakes (pixels) */
    BASE_SIZE_MIN: 3,
    
    /** Maximum base size for snowflakes (pixels) */
    BASE_SIZE_MAX: 10,
    
    /** Minimum amount of side-to-side wobble (pixels) */
    WOBBLE_AMOUNT_MIN: 0.8,
    
    /** Maximum amount of side-to-side wobble (pixels) */
    WOBBLE_AMOUNT_MAX: 2.0,
    
    /** Minimum wobble speed (radians per frame) */
    WOBBLE_SPEED_MIN: 0.01,
    
    /** Maximum wobble speed (radians per frame) */
    WOBBLE_SPEED_MAX: 0.05,
    
    /** Minimum rotation speed (radians per frame) - negative for clockwise */
    ROTATION_SPEED_MIN: -0.02,
    
    /** Maximum rotation speed (radians per frame) - positive for counter-clockwise */
    ROTATION_SPEED_MAX: 0.02,
    
    // ==========================================
    // Explosion Effects - Controls audio-reactive explosions
    // ==========================================
    
    /** Multiplier for explosion size relative to the base size */
    EXPLOSION_SIZE_MULTIPLIER: 1.5,
    
    /** Multiplier for number of particles in explosions */
    EXPLOSION_PARTICLE_MULTIPLIER: 1.5,
    
    /** Total lifespan of explosions in frames */
    EXPLOSION_LIFESPAN: 150,
    
    /** Initial alpha (opacity) of the central glow (0-255) */
    CENTRAL_GLOW_INITIAL_ALPHA: 230,
    
    /** Rate at which the central glow fades (0-1) - lower values fade faster */
    CENTRAL_GLOW_DECAY: 0.97,
    
    /** Number of rays in the burst effect */
    BURST_RAY_COUNT: 12,
    
    /** Minimum length of burst rays (multiplied by snowflake size) */
    BURST_RAY_LENGTH_MIN: 5,
    
    /** Maximum length of burst rays (multiplied by snowflake size) */
    BURST_RAY_LENGTH_MAX: 10,
    
    /** Growth rate of burst rays - values > 1 make rays grow over time */
    BURST_RAY_GROWTH: 1.06,
    
    /** Rate at which burst ray width decreases - lower values thin out faster */
    BURST_RAY_WIDTH_DECAY: 0.95,
    
    /** Ratio of explosion lifespan during which burst rays are visible */
    BURST_LIFESPAN_RATIO: 0.3,
    
    // ==========================================
    // Particle Physics - Controls particle behavior in explosions
    // ==========================================
    
    /** Minimum speed of explosion particles */
    PARTICLE_SPEED_MIN: 1,
    
    /** Maximum speed of explosion particles */
    PARTICLE_SPEED_MAX: 7,
    
    /** Minimum size of explosion particles */
    PARTICLE_SIZE_MIN: 3,
    
    /** Maximum size of explosion particles */
    PARTICLE_SIZE_MAX: 15,
    
    /** Minimum lifespan ratio for particles (relative to explosion lifespan) */
    PARTICLE_LIFESPAN_MIN_RATIO: 0.5,
    
    /** Maximum lifespan ratio for particles (relative to explosion lifespan) */
    PARTICLE_LIFESPAN_MAX_RATIO: 1.2,
    
    /** Air drag coefficient for dust-type particles (0-1) - lower values = more drag */
    PARTICLE_DRAG_DUST: 0.96,
    
    /** Default air drag coefficient for particles (0-1) - lower values = more drag */
    PARTICLE_DRAG_DEFAULT: 0.98,
    
    /** Gravity strength for crystal-type particles - higher values fall faster */
    PARTICLE_GRAVITY_CRYSTAL: 0.03,
    
    /** Default gravity strength for particles - higher values fall faster */
    PARTICLE_GRAVITY_DEFAULT: 0.07,
    
    /** Bounce dampening factor when particles hit surfaces (0-1) */
    PARTICLE_BOUNCE_DAMPEN: 0.6,
    
    /** Horizontal friction when particles bounce (0-1) */
    PARTICLE_BOUNCE_FRICTION: 0.8,
    
    /** Size reduction factor when particles bounce (0-1) - lower values shrink more */
    PARTICLE_SIZE_DECAY: 0.8,
    
    // ==========================================
    // Audio Reaction - Controls how the theme responds to audio
    // ==========================================
    
    /** Base factor for explosion size relative to volume */
    VOLUME_BASE_SIZE_FACTOR: 0.7,
    
    /** Additional size factor based on volume level */
    VOLUME_ADDITIONAL_SIZE_FACTOR: 0.6,
    
    /** Base factor for particle count relative to volume */
    VOLUME_BASE_PARTICLE_FACTOR: 0.8,
    
    /** Additional particle count factor based on volume level */
    VOLUME_ADDITIONAL_PARTICLE_FACTOR: 0.5,
    
    /** Padding ratio to keep explosions away from screen edges (0-1) */
    POSITION_PADDING_RATIO: 0.1,
    
    // ==========================================
    // Visual Effects - Controls appearance details
    // ==========================================
    
    /** Alpha ratio for particle trails (0-1) */
    TRAIL_ALPHA_RATIO: 0.7,
    
    /** Minimum sparkle intensity for particles (0-1) */
    SPARKLE_INTENSITY_MIN: 0.3,
    
    /** Maximum sparkle intensity for particles (0-1) */
    SPARKLE_INTENSITY_MAX: 0.7,
    
    /** Frequency of sparkle effects (0-1) - higher values = more sparkles */
    SPARKLE_FREQUENCY: 0.3,
    
    /** Chance of creating pure white particles (0-1) */
    WHITE_PARTICLE_CHANCE: 0.15,
    
    /** Chance of particles having trails (0-1) */
    TRAIL_PARTICLE_CHANCE: 0.7
};

/**
 * A single Snowflake object
 * 
 * This class represents and manages an individual snowflake in the scene.
 * Each snowflake has its own physical properties (size, speed, wobble),
 * responds to wind forces, and can be reset when it falls off-screen.
 * 
 * When creating your own theme, you can use this as a template for
 * defining visual elements with physics-based movement.
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
 * 
 * This class handles the behavior and rendering of individual particles
 * in explosion effects. It supports multiple particle types with different
 * physical properties and appearances:
 * - snowflake: Six-pointed snowflake shape with rotation
 * - dust: Simple circular particles with air drag
 * - sparkle: Particles that sparkle/flicker with varying opacity
 * - crystal: Diamond-shaped particles with lower gravity
 * 
 * The class demonstrates physics-based animation including:
 * - Velocity and direction
 * - Gravity and air drag simulation
 * - Bouncing off the bottom of the screen
 * - Trail effects
 * 
 * When creating your own theme, this provides a template for implementing
 * various particle effects with different visual styles and behaviors.
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
/**
 * BurstRay class for creating radial rays in explosion effects
 * 
 * This class handles the rendering and animation of ray-like lines
 * that emanate from the center of an explosion. These rays create
 * a starburst effect and help convey energy in the visual effect.
 * 
 * The rays have animated properties including:
 * - Growth over time
 * - Width decay (thinning)
 * - Alpha/opacity fading
 * 
 * When creating your own theme, this provides a template for implementing
 * simple line-based effects that emanate from a central point.
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
/**
 * CentralGlow class for creating a glowing core in explosion effects
 * 
 * This class handles the rendering and animation of a circular glow
 * that appears at the center of an explosion. It creates a soft,
 * radiant effect that helps convey energy and light.
 * 
 * The glow has animated properties including:
 * - Alpha/opacity decay over time
 * - Size that follows a curve based on the explosion lifecycle
 * 
 * When creating your own theme, this provides a template for implementing
 * simple radial glow effects that can enhance visual impact.
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
 * 
 * This class manages the creation and lifecycle of audio-reactive explosion effects.
 * It orchestrates multiple components to create a visually rich explosion:
 * - Spawns particles of various types (snowflake, dust, sparkle, crystal)
 * - Creates burst rays emanating from the center
 * - Manages a central glow effect
 * - Handles color variations using complementary and accent colors
 * 
 * When creating your own theme, you can use this as a template for
 * implementing complex visual effects composed of multiple components.
 * 
 * This implementation uses object pooling for better performance by
 * reusing particle objects instead of creating new ones each time.
 */
class SnowflakeExplosion {
    // Static pool initialization - done once when the class is defined
    static initPools(canvas) {
        if (SnowflakeExplosion._poolsInitialized) return;
        
        // Create particle pool
        SnowflakeExplosion.particlePool = ObjectPool.create(
            // Create function
            () => new ExplosionParticle(
                canvas, 0, 0, 0, 0, 0, 0, 
                { r: 0, g: 0, b: 0 }, 'dust'
            ),
            // Reset function
            (particle, canvas, x, y, angle, speed, size, lifespan, color, type) => {
                particle.canvas = canvas;
                particle.x = x;
                particle.y = y;
                particle.angle = angle;
                particle.speed = speed;
                particle.size = size;
                particle.maxLifespan = lifespan;
                particle.lifespan = lifespan;
                particle.color = color;
                particle.type = type;
                
                // Reset derived properties
                particle.vx = Math.cos(angle) * speed;
                particle.vy = Math.sin(angle) * speed;
                particle.gravity = type === 'crystal' ? 
                    CONSTANTS.PARTICLE_GRAVITY_CRYSTAL : 
                    CONSTANTS.PARTICLE_GRAVITY_DEFAULT;
                particle.drag = type === 'dust' ? 
                    CONSTANTS.PARTICLE_DRAG_DUST : 
                    CONSTANTS.PARTICLE_DRAG_DEFAULT;
                particle.alpha = 255;
                particle.sparkle = 0;
                particle.canBounce = type === 'crystal' || type === 'snowflake';
                particle.hasBounced = false;
                particle.hasTrail = Math.random() < CONSTANTS.TRAIL_PARTICLE_CHANCE;
                particle.trailPositions = [];
                
                return particle;
            },
            50,  // Initial pool size
            200   // Max pool size
        );
        
        // Create ray pool
        SnowflakeExplosion.rayPool = ObjectPool.create(
            // Create function
            () => new BurstRay(
                canvas, 0, 0, 0, { r: 0, g: 0, b: 0 }
            ),
            // Reset function
            (ray, canvas, angle, length, width, color) => {
                ray.canvas = canvas;
                ray.angle = angle;
                ray.length = length;
                ray.width = width;
                ray.color = color;
                ray.alpha = 255;
                return ray;
            },
            20,  // Initial pool size
            50   // Max pool size
        );
        
        SnowflakeExplosion._poolsInitialized = true;
    }
    
    constructor(canvas, x, y, color, size = 1, particleCount = 25) {
        // Initialize pools if not already done
        SnowflakeExplosion.initPools(canvas);
    
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size * CONSTANTS.EXPLOSION_SIZE_MULTIPLIER;
        this.particleCount = Math.round(particleCount * CONSTANTS.EXPLOSION_PARTICLE_MULTIPLIER);
        this.particles = [];
        this.burstRays = [];
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
        // Use shared ColorUtils implementation
        return ColorUtils.getComplementaryColor(color);
    }
    
    /**
     * Generate an accent color (shifted hue)
     */
    generateAccentColor(color) {
        // Use shared ColorUtils implementation
        return ColorUtils.getAccentColor(color);
    }
    
    /**
     * Create the central burst effect
     */    /**
     * Create the burst effect using object pooling for better performance
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
            const width = this.canvas.random(2, 5) * this.size / 2;
            const color = this.canvas.random() < 0.5 ? this.secondaryColor : this.tertiaryColor;
            
            // Get a ray from the pool instead of creating a new one
            const ray = SnowflakeExplosion.rayPool.get(
                this.canvas,
                angle, 
                length,
                width,
                color
            );
            
            this.burstRays.push(ray);
        }
        
        // Create central glow
        this.centralGlow = new CentralGlow(this.canvas, this.size * 5, this.color);
    }
    
    /**
     * Create particles for the explosion
     */    /**
     * Create particles for the explosion using object pooling for better performance
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
            
            // Get a particle from the pool instead of creating a new one
            const particle = SnowflakeExplosion.particlePool.get(
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
     * Check if the explosion is finished and release resources to pools if it is
     * @returns {boolean} Whether the explosion is finished
     */
    isFinished() {
        if (!this.active) {
            // Return particles to pool
            for (let particle of this.particles) {
                SnowflakeExplosion.particlePool.release(particle);
            }
            
            // Return burst rays to pool
            if (this.burstRays) {
                for (let ray of this.burstRays) {
                    SnowflakeExplosion.rayPool.release(ray);
                }
            }
            
            // Clear references for garbage collection
            this.particles = [];
            this.burstRays = [];
            
            return true;
        }
        return false;
    }
}

/**
 * Snowflakes Theme class that extends the base Theme
 * 
 * This class orchestrates the entire snowflake visual effect, including:
 * - Managing collections of snowflake objects
 * - Handling audio reactivity through explosion effects
 * - Managing color schemes and theme settings
 * - Processing user interactions and state changes
 * 
 * The architecture follows a component-based design where the main theme class
 * delegates rendering and behavior to smaller specialized classes (Snowflake, 
 * Explosion, Particle, etc.). This makes the code more maintainable and serves
 * as a good template for creating new themes.
 * 
 * Integration points:
 * - Extends the base Theme class
 * - Uses stateManager for configuration persistence
 * - Implements required lifecycle methods (setup, draw, etc.)
 * - Provides audio reactivity via onAudioFeature method
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
      /**
     * Apply configuration from the state manager with safety checks
     * This method handles missing or invalid configuration values gracefully
     */
    applyStateConfig() {
        if (!this.stateManager) return;
        
        try {
            const config = this.stateManager.getStateSection('themeConfigs.snowflakes');
            if (!config) {
                this.logDebug('No snowflakes theme config found in state');
                return;
            }
            
            // Apply each config with validation checks
            
            // Colors
            if (config.backgroundColor) {
                this.setBackgroundColor(config.backgroundColor);
            }
            
            if (config.snowflakeColor) {
                this.setSnowflakeColor(config.snowflakeColor);
            }
            
            // Snowflake properties
            if (typeof config.count === 'number') {
                this.setNumberOfSnowflakes(config.count);
            }
            
            if (typeof config.size === 'number') {
                const sizeMultiplier = config.size / 10;
                this.setSizeMultiplier(sizeMultiplier);
            }
            
            if (typeof config.speed === 'number') {
                this.setSpeedMultiplier(config.speed);
            }
            
            if (typeof config.wobbleIntensity === 'number') {
                const wobbleIntensity = config.wobbleIntensity / 10;
                this.setWobbleIntensity(wobbleIntensity);
            }
            
            // Wind properties
            if (typeof config.windStrength === 'number' && typeof config.windDirection === 'number') {
                this.setWind(config.windStrength, config.windDirection);
            }
            
            // Audio reaction settings
            if (this.audioManager && typeof this.audioManager.getThreshold === 'function') {
                try {
                    this.effectsConfig.triggerThreshold = this.audioManager.getThreshold();
                    this.logDebug(`Using AudioManager threshold ${this.effectsConfig.triggerThreshold}`);
                } catch (error) {
                    this.logDebug(`Error getting audio threshold: ${error.message}`);
                }
            }
            
            this.logDebug('Audio reactive config initialized', this.effectsConfig);
            
            // Apply running state
            if (this.stateManager.state.isRunning) {
                this.start();
            } else {
                this.stop();
            }
        } catch (error) {
            this.logDebug(`Error applying state config: ${error.message}`);
            
            // Ensure theme is in a valid state even after an error
            this.setup();
        }
    }/**
     * Set the number of snowflakes with validation and error handling
     * @param {number} num - The number of snowflakes to display
     */
    setNumberOfSnowflakes(num) {
        // Validate the input
        const safeNum = this.validateNumber(num, 1, 1000, this.numSnowflakes);
        if (safeNum !== num) {
            this.logDebug(`Invalid snowflake count (${num}), using ${safeNum} instead`);
        }
        
        const previouslyRunning = this.isRunning;
        
        try {
            if (previouslyRunning) {
                this.isRunning = false;
            }
            
            this.numSnowflakes = safeNum;
            this.updateSnowflakes();
        } catch (error) {
            this.logDebug(`Error setting snowflake count: ${error.message}`);
        } finally {
            if (previouslyRunning) {
                this.isRunning = true;
            }
        }
    }
    
    /**
     * Validate a numeric value with bounds checking
     * @param {any} value - The value to validate
     * @param {number} min - Minimum acceptable value
     * @param {number} max - Maximum acceptable value
     * @param {number} defaultValue - Fallback value if validation fails
     * @returns {number} - The validated number
     */
    validateNumber(value, min, max, defaultValue) {
        const num = Number(value);
        if (isNaN(num) || num < min || num > max) {
            return defaultValue;
        }
        return num;
    }    /**
     * Set the size multiplier for snowflakes with validation
     * @param {number} multiplier - The size multiplier
     */
    setSizeMultiplier(multiplier) {
        // Validate the input
        const safeMultiplier = this.validateNumber(multiplier, 0.1, 10, this.sizeMultiplier);
        if (safeMultiplier !== multiplier) {
            this.logDebug(`Invalid size multiplier (${multiplier}), using ${safeMultiplier} instead`);
        }
        
        try {
            this.sizeMultiplier = safeMultiplier;
            for (let snowflake of this.snowflakes) {
                snowflake.setSizeMultiplier(this.sizeMultiplier);
            }
        } catch (error) {
            this.logDebug(`Error setting size multiplier: ${error.message}`);
        }
    }

    /**
     * Set the speed multiplier for snowflakes with validation
     * @param {number} multiplier - The speed multiplier
     */
    setSpeedMultiplier(multiplier) {
        // Validate the input
        const safeMultiplier = this.validateNumber(multiplier, 0.1, 10, this.speedMultiplier);
        if (safeMultiplier !== multiplier) {
            this.logDebug(`Invalid speed multiplier (${multiplier}), using ${safeMultiplier} instead`);
        }
        
        try {
            this.speedMultiplier = safeMultiplier;
            for (let snowflake of this.snowflakes) {
                snowflake.setSpeedMultiplier(this.speedMultiplier);
            }
        } catch (error) {
            this.logDebug(`Error setting speed multiplier: ${error.message}`);
        }
    }
    
    /**
     * Set the wobble intensity for snowflakes with validation
     * @param {number} intensity - The wobble intensity
     */
    setWobbleIntensity(intensity) {
        // Validate the input
        const safeIntensity = this.validateNumber(intensity, 0, 10, this.wobbleIntensity);
        if (safeIntensity !== intensity) {
            this.logDebug(`Invalid wobble intensity (${intensity}), using ${safeIntensity} instead`);
        }
        
        try {
            this.wobbleIntensity = safeIntensity;
            for (let snowflake of this.snowflakes) {
                snowflake.setWobbleIntensity(safeIntensity);
            }
        } catch (error) {
            this.logDebug(`Error setting wobble intensity: ${error.message}`);
        }
    }
    
    /**
     * Set the wind properties for snowflakes with validation
     * @param {number} strength - The wind strength
     * @param {number} direction - The wind direction in degrees
     */
    setWind(strength, direction) {
        // Validate inputs
        const safeStrength = this.validateNumber(strength, 0, 20, this.windStrength);
        const safeDirection = this.validateNumber(direction, 0, 360, this.windDirection);
        
        if (safeStrength !== strength || safeDirection !== direction) {
            this.logDebug(`Invalid wind properties (${strength}, ${direction}), using (${safeStrength}, ${safeDirection}) instead`);
        }
        
        try {
            this.windStrength = safeStrength;
            this.windDirection = safeDirection;
            for (let snowflake of this.snowflakes) {
                snowflake.setWind(safeStrength, safeDirection);
            }
        } catch (error) {
            this.logDebug(`Error setting wind properties: ${error.message}`);
        }
    }
      /**
     * Set the snowflake color with validation and error handling
     * @param {string} hexColor - The color in hex format (#RRGGBB)
     */
    setSnowflakeColor(hexColor) {
        try {
            // Validate hex color format
            if (!this.validateHexColor(hexColor)) {
                this.logDebug(`Invalid hex color: ${hexColor}, using default color instead`);
                return;
            }
            
            const rgb = ColorUtils.hexToRgb(hexColor);
            this.snowflakeColor = rgb;
            
            for (let snowflake of this.snowflakes) {
                snowflake.setColor(rgb.r, rgb.g, rgb.b);
            }
        } catch (error) {
            this.logDebug(`Error setting snowflake color: ${error.message}`);
        }
    }
    
    /**
     * Set the background color with validation and error handling
     * @param {string} hexColor - The color in hex format (#RRGGBB)
     */
    setBackgroundColor(hexColor) {
        try {
            // Validate hex color format
            if (!this.validateHexColor(hexColor)) {
                this.logDebug(`Invalid hex color: ${hexColor}, using default background color instead`);
                return;
            }
            
            this.backgroundColor = ColorUtils.hexToRgb(hexColor);
        } catch (error) {
            this.logDebug(`Error setting background color: ${error.message}`);
        }
    }
    
    /**
     * Validate a hex color string
     * @param {string} color - The hex color to validate
     * @returns {boolean} Whether the color is valid
     */
    validateHexColor(color) {
        return typeof color === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(color);
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
    }    /**
     * Update all elements of the theme with improved safety checks
     */
    update() {
        if (!this.isRunning) return;
        
        try {
            // Update snowflakes with safety check
            if (Array.isArray(this.snowflakes)) {
                for (let snowflake of this.snowflakes) {
                    if (snowflake && typeof snowflake.update === 'function') {
                        snowflake.update();
                    }
                }
            }
            
            // Update explosions with safety check
            if (Array.isArray(this.explosions)) {
                for (let i = this.explosions.length - 1; i >= 0; i--) {
                    if (this.explosions[i] && typeof this.explosions[i].update === 'function') {
                        this.explosions[i].update();
                        
                        if (this.explosions[i].isFinished()) {
                            this.explosions.splice(i, 1);
                        }
                    } else {
                        // Remove invalid explosion objects
                        this.explosions.splice(i, 1);
                    }
                }
            }
        } catch (error) {
            this.logDebug(`Error in update: ${error.message}`);
        }
    }

    /**
     * Draw all elements of the theme with improved safety checks
     */
    draw() {
        if (!this.isRunning) return;

        try {
            if (this.canvas && typeof this.canvas.background === 'function') {
                this.canvas.background(
                    this.backgroundColor.r || 0, 
                    this.backgroundColor.g || 0, 
                    this.backgroundColor.b || 0
                );
            }
            
            // Draw snowflakes with safety check
            if (Array.isArray(this.snowflakes)) {
                for (let snowflake of this.snowflakes) {
                    if (snowflake && typeof snowflake.draw === 'function') {
                        snowflake.draw();
                    }
                }
            }
            
            // Draw explosions with safety check
            if (Array.isArray(this.explosions)) {
                for (let explosion of this.explosions) {
                    if (explosion && typeof explosion.draw === 'function') {
                        explosion.draw();
                    }
                }
            }
        } catch (error) {
            this.logDebug(`Error in draw: ${error.message}`);
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