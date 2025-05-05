/**
 * Bubble class for underwater theme
 */
class Bubble {
    constructor(canvas, initialDistribution = false, sizeMultiplier = 1, depthLevel = null) {
        this.canvas = canvas;
        this.x = this.canvas.random(0, this.canvas.width);
        
        // For initial setup, distribute bubbles throughout the canvas
        if (initialDistribution) {
            this.y = this.canvas.random(0, this.canvas.height);
        } else {
            this.y = this.canvas.random(this.canvas.height, this.canvas.height + 50);
        }
        
        // Depth simulation (0 = closest, 1 = furthest away)
        this.depth = depthLevel !== null ? depthLevel : this.canvas.random(0, 1);
        
        // Base size affected by the size multiplier parameter and depth
        this.baseSize = this.canvas.random(5, 15) * this.canvas.map(this.depth, 0, 1, 1, 0.5);
        this.size = this.baseSize * sizeMultiplier;
        
        // Store base speed for later adjustments - deeper bubbles move slower
        this.baseSpeed = this.canvas.map(this.baseSize, 5, 15, 2, 1) * this.canvas.map(this.depth, 0, 1, 1, 0.6);
        this.speedMultiplier = 1;
        this.speed = this.baseSpeed * this.speedMultiplier;
        
        // Opacity varies by depth - further bubbles are more transparent
        this.opacity = this.canvas.map(this.baseSize, 5, 15, 150, 200) * this.canvas.map(this.depth, 0, 1, 1, 0.7);
        
        // Wobble properties with base randomness - deeper bubbles wobble less
        this.baseWobbleAmount = this.canvas.random(0.3, 1.0) * this.canvas.map(this.depth, 0, 1, 1, 0.6);
        this.wobbleIntensity = 1.0; // Default multiplier
        this.wobble = this.canvas.random(0, this.canvas.TWO_PI); // Random starting phase
        this.baseWobbleSpeed = this.canvas.random(0.01, 0.05) * this.canvas.map(this.depth, 0, 1, 1, 0.8);
        this.wobbleSpeed = this.baseWobbleSpeed;
        
        // Current properties - deeper bubbles less affected
        this.currentStrength = 0;
        this.currentDirection = 0; // Degrees (0 is right, 90 is up)
        this.currentDepthFactor = this.canvas.map(this.depth, 0, 1, 1, 0.3);
        
        // Default bubble color (white with blue tint) - adjust saturation based on depth
        const depthColorFactor = this.canvas.map(this.depth, 0, 1, 1, 0.85);
        this.color = { 
            r: 220 * depthColorFactor, 
            g: 240 * depthColorFactor, 
            b: 255 * depthColorFactor 
        };
        this.strokeColor = { 
            r: 150 * depthColorFactor, 
            g: 200 * depthColorFactor, 
            b: 255 * depthColorFactor 
        };
        
        // New properties for enhanced realism
        this.rotationAngle = this.canvas.random(0, this.canvas.TWO_PI);
        this.rotationSpeed = this.canvas.random(-0.01, 0.01) * this.canvas.map(this.depth, 0, 1, 1, 0.7);
        
        // Variable shine effect properties - deeper bubbles have subtler shine
        this.shineAngle = this.canvas.random(0, this.canvas.TWO_PI);
        this.shineSize = this.canvas.random(0.2, 0.35) * this.canvas.map(this.depth, 0, 1, 1, 0.7);
        this.shineBrightness = this.canvas.random(0.5, 0.7) * this.canvas.map(this.depth, 0, 1, 1, 0.6);
        
        // Acceleration properties - deeper bubbles accelerate less
        this.acceleration = 0;
        this.maxAcceleration = 0.03 * this.canvas.map(this.depth, 0, 1, 1, 0.5);
        this.currentAcceleration = 0;
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
    
    // Set current properties - apply depth factor to current effect
    setCurrent(strength, direction) {
        this.currentStrength = strength * this.currentDepthFactor;
        this.currentDirection = direction;
    }
    
    // Set the bubble color
    setColor(r, g, b) {
        // Apply depth-based color adjustment
        const depthColorFactor = this.canvas.map(this.depth, 0, 1, 1, 0.85);
        this.color = { 
            r: r * depthColorFactor, 
            g: g * depthColorFactor, 
            b: b * depthColorFactor 
        };
        
        // Set stroke color slightly darker
        this.strokeColor = { 
            r: Math.max(r * depthColorFactor - 70, 0), 
            g: Math.max(g * depthColorFactor - 40, 0), 
            b: Math.max(b * depthColorFactor - 0, 0) 
        };
        
        // Calculate color brightness (0-255)
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
        
        // For darker colors, create more noticeably tinted highlights
        // For lighter colors, keep highlights brighter
        const colorInfluence = this.canvas.map(brightness, 0, 255, 0.5, 0.2);
        
        // Create highlight colors that are tinted by the bubble color
        this.highlightColor = {
            r: Math.min(255, r * colorInfluence + 255 * (1 - colorInfluence)),
            g: Math.min(255, g * colorInfluence + 255 * (1 - colorInfluence)),
            b: Math.min(255, b * colorInfluence + 255 * (1 - colorInfluence))
        };
        
        // Secondary highlight has a stronger color influence
        const secondaryColorInfluence = this.canvas.map(brightness, 0, 255, 0.7, 0.3);
        this.secondaryHighlightColor = {
            r: Math.min(255, r * secondaryColorInfluence + 255 * (1 - secondaryColorInfluence)),
            g: Math.min(255, g * secondaryColorInfluence + 255 * (1 - secondaryColorInfluence)),
            b: Math.min(255, b * secondaryColorInfluence + 255 * (1 - secondaryColorInfluence))
        };
    }

    update() {
        // Calculate acceleration based on depth - bubbles accelerate as they rise
        const depthFactor = Math.max(0, Math.min(1, this.y / this.canvas.height));
        this.acceleration = this.maxAcceleration * (1 - depthFactor);
        this.currentAcceleration = Math.min(this.currentAcceleration + this.acceleration, this.speed * 0.5);
        
        // Base vertical movement - rising (negative y is up) with acceleration
        this.y -= (this.speed + this.currentAcceleration);
        
        // Update rotation
        this.rotationAngle += this.rotationSpeed;
        
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
        this.canvas.rotate(this.rotationAngle); // Apply rotation
        
        // Create a subtle gradient for more realistic bubble appearance
        const gradientSteps = 3;
        for (let i = 0; i < gradientSteps; i++) {
            const ratio = i / (gradientSteps - 1);
            const radius = this.size * (1 - ratio * 0.15);
            const alpha = this.opacity * (0.7 - ratio * 0.5);
            
            // Draw bubble fill with gradient effect
            this.canvas.noStroke();
            this.canvas.fill(
                this.color.r, 
                this.color.g, 
                this.color.b, 
                alpha
            );
            this.canvas.ellipse(0, 0, radius, radius);
        }
        
        // Edge detail varies by depth - closer bubbles have sharper edges
        const edgeWeight = this.canvas.map(this.depth, 0, 1, 1, 0.5);
        
        // Draw bubble edge
        this.canvas.noFill();
        this.canvas.strokeWeight(edgeWeight);
        this.canvas.stroke(
            this.strokeColor.r,
            this.strokeColor.g,
            this.strokeColor.b,
            this.opacity * 0.9
        );
        this.canvas.ellipse(0, 0, this.size, this.size);
        
        // Draw highlights - closer bubbles have more pronounced highlights
        this.canvas.noStroke();
        
        // Draw variable-sized main highlight using the color-tinted highlight color
        const shineSize = this.size * this.shineSize;
        const shineX = this.size * 0.2;
        const shineY = -this.size * 0.2;
        
        this.canvas.fill(
            this.highlightColor.r,
            this.highlightColor.g,
            this.highlightColor.b,
            this.opacity * this.shineBrightness
        );
        this.canvas.ellipse(shineX, shineY, shineSize, shineSize * 0.7);
        
        // Add a smaller secondary highlight for realism (only visible on closer bubbles)
        if (this.depth < 0.7) {
            const secondaryShineSize = this.size * 0.12 * this.canvas.map(this.depth, 0, 0.7, 1, 0);
            const secondaryShineX = -this.size * 0.25;
            const secondaryShineY = this.size * 0.15;
            
            this.canvas.fill(
                this.secondaryHighlightColor.r,
                this.secondaryHighlightColor.g,
                this.secondaryHighlightColor.b,
                this.opacity * 0.4 * this.canvas.map(this.depth, 0, 0.7, 1, 0)
            );
            this.canvas.ellipse(secondaryShineX, secondaryShineY, secondaryShineSize);
        }
        
        this.canvas.pop();
    }

    resetPosition() {
        this.x = this.canvas.random(0, this.canvas.width);
        this.y = this.canvas.random(this.canvas.height, this.canvas.height + 50);
        
        // Reset acceleration
        this.currentAcceleration = 0;
        
        // Randomize shine properties for variety
        this.shineAngle = this.canvas.random(0, this.canvas.TWO_PI);
        this.shineSize = this.canvas.random(0.2, 0.35) * this.canvas.map(this.depth, 0, 1, 1, 0.7);
        this.shineBrightness = this.canvas.random(0.5, 0.7) * this.canvas.map(this.depth, 0, 1, 1, 0.6);
        
        // Randomize rotation
        this.rotationSpeed = this.canvas.random(-0.01, 0.01) * this.canvas.map(this.depth, 0, 1, 1, 0.7);
    }
    
    // Getter for calculating z-index based on depth (for sorting)
    getZIndex() {
        return this.depth;
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
        
        // Body shape properties for more natural fish forms
        this.bodyWidthRatio = this.canvas.random(1.4, 1.8);  // Body width/height ratio
        this.bodyTaperRatio = this.canvas.random(0.6, 0.75); // How much the body tapers toward the tail
        
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
        
        // Fish colors - now with additional color properties for gradients
        this.generateRandomColors();
        
        // Tail wagging
        this.tailAngle = 0;
        this.tailSpeed = this.canvas.random(0.1, 0.2);
        this.tailAmplitude = this.canvas.random(20, 30);
        
        // Body curvature for swimming animation
        this.bodyCurve = 0;
    }
    
    generateRandomColors() {
        // Generate a random fish color scheme with primary and secondary colors for gradients
        const colorSchemes = [
            // Red fish
            { 
                body: { primary: { r: 255, g: 100, b: 100 }, secondary: { r: 255, g: 150, b: 130 } }, 
                tail: { primary: { r: 255, g: 50, b: 50 }, secondary: { r: 220, g: 80, b: 70 } },
                fin: { r: 255, g: 130, b: 120 }
            },
            // Blue fish
            { 
                body: { primary: { r: 100, g: 150, b: 255 }, secondary: { r: 130, g: 180, b: 255 } }, 
                tail: { primary: { r: 70, g: 130, b: 230 }, secondary: { r: 100, g: 160, b: 255 } },
                fin: { r: 120, g: 170, b: 250 }
            },
            // Gold fish
            { 
                body: { primary: { r: 255, g: 200, b: 70 }, secondary: { r: 255, g: 220, b: 130 } }, 
                tail: { primary: { r: 255, g: 170, b: 40 }, secondary: { r: 255, g: 190, b: 80 } },
                fin: { r: 255, g: 215, b: 120 }
            },
            // Green fish
            { 
                body: { primary: { r: 150, g: 220, b: 150 }, secondary: { r: 180, g: 235, b: 180 } }, 
                tail: { primary: { r: 120, g: 200, b: 120 }, secondary: { r: 140, g: 210, b: 140 } },
                fin: { r: 160, g: 225, b: 160 }
            },
            // Purple fish
            { 
                body: { primary: { r: 200, g: 150, b: 255 }, secondary: { r: 220, g: 180, b: 255 } }, 
                tail: { primary: { r: 180, g: 120, b: 240 }, secondary: { r: 200, g: 150, b: 250 } },
                fin: { r: 210, g: 170, b: 250 }
            },
            // Teal fish
            { 
                body: { primary: { r: 80, g: 200, b: 200 }, secondary: { r: 120, g: 225, b: 215 } }, 
                tail: { primary: { r: 60, g: 180, b: 180 }, secondary: { r: 100, g: 200, b: 200 } },
                fin: { r: 90, g: 210, b: 210 }
            }
        ];
        
        const scheme = colorSchemes[Math.floor(this.canvas.random(0, colorSchemes.length))];
        this.bodyColor = scheme.body;
        this.tailColor = scheme.tail;
        this.finColor = scheme.fin;
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
        
        // Update body curve for swimming motion - subtle S-shape
        this.bodyCurve = Math.sin(this.yWobble * 0.5) * 4;
    }
    
    draw() {
        this.canvas.push();
        this.canvas.translate(this.x, this.y);
        
        // Flip based on direction
        if (this.side === 'right') {
            this.canvas.scale(-1, 1);
        }
        
        // Draw fish with natural body shape using beginShape/endShape
        this.drawBodyWithGradient();
        
        // Draw tail with more natural shape and gradient
        this.drawTail();
        
        // Draw fins
        this.drawFins();
        
        // Draw eye
        this.drawEye();
        
        this.canvas.pop();
    }
    
    drawBodyWithGradient() {
        // Create a custom gradient fill for the fish body
        const ctx = this.canvas.drawingContext;
        const bodyWidth = this.size * this.bodyWidthRatio;
        const bodyHeight = this.size * 0.8;
        
        // Save the current context state
        ctx.save();
        
        // Create body shape path for clipping
        ctx.beginPath();
        
        // Calculate control points for bezier curves to create natural fish shape
        const taperX = -bodyWidth * 0.3; // Where body starts to taper toward tail
        const taperWidth = bodyWidth * this.bodyTaperRatio;
        
        // Top curve
        ctx.moveTo(bodyWidth * 0.5, 0); // Front of fish
        ctx.quadraticCurveTo(
            bodyWidth * 0.4, -bodyHeight * 0.5, 
            taperX, -bodyHeight * 0.45
        );
        ctx.quadraticCurveTo(
            -bodyWidth * 0.5, -bodyHeight * 0.3, 
            -bodyWidth * 0.6, 0
        );
        
        // Bottom curve
        ctx.quadraticCurveTo(
            -bodyWidth * 0.5, bodyHeight * 0.3, 
            taperX, bodyHeight * 0.45
        );
        ctx.quadraticCurveTo(
            bodyWidth * 0.4, bodyHeight * 0.5, 
            bodyWidth * 0.5, 0
        );
        
        // Apply subtle body curve for swimming motion
        if (this.bodyCurve !== 0) {
            // Apply a transform to curve the body slightly
            ctx.transform(1, 0, Math.sin(this.bodyCurve * 0.01) * 0.1, 1, 0, 0);
        }
        
        ctx.closePath();
        ctx.clip(); // Use the path as a clipping region
        
        // Create gradient
        const gradient = ctx.createLinearGradient(
            bodyWidth * 0.5, -bodyHeight * 0.2,
            -bodyWidth * 0.5, bodyHeight * 0.2
        );
        
        // Add color stops for smooth gradient
        gradient.addColorStop(0, `rgba(${this.bodyColor.primary.r}, ${this.bodyColor.primary.g}, ${this.bodyColor.primary.b}, 1)`);
        gradient.addColorStop(0.4, `rgba(${this.bodyColor.secondary.r}, ${this.bodyColor.secondary.g}, ${this.bodyColor.secondary.b}, 1)`);
        gradient.addColorStop(0.6, `rgba(${this.bodyColor.secondary.r}, ${this.bodyColor.secondary.g}, ${this.bodyColor.secondary.b}, 1)`);
        gradient.addColorStop(1, `rgba(${this.bodyColor.primary.r}, ${this.bodyColor.primary.g}, ${this.bodyColor.primary.b}, 1)`);
        
        // Fill the clipped shape with the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(-bodyWidth, -bodyHeight, bodyWidth * 2, bodyHeight * 2);
        
        // Restore context
        ctx.restore();
    }
    
    drawTail() {
        this.canvas.push();
        
        // Move to where the tail connects with the body
        this.canvas.translate(-this.size * this.bodyWidthRatio * 0.6, 0);
        
        // Apply tail wagging rotation
        this.canvas.rotate(this.canvas.radians(this.tailAngle));
        
        // Draw tail with gradient
        const ctx = this.canvas.drawingContext;
        
        // Save context
        ctx.save();
        
        // Create tail shape
        const tailLength = this.size * 0.9;
        const tailHeight = this.size * 0.7;
        
        ctx.beginPath();
        ctx.moveTo(0, 0); // Tail start
        ctx.quadraticCurveTo(
            -tailLength * 0.7, -tailHeight * 0.5,
            -tailLength, -tailHeight
        );
        ctx.quadraticCurveTo(
            -tailLength * 0.6, 0,
            -tailLength, tailHeight
        );
        ctx.quadraticCurveTo(
            -tailLength * 0.7, tailHeight * 0.5,
            0, 0
        );
        
        ctx.closePath();
        ctx.clip(); // Use the path as a clipping region
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, -tailLength, 0);
        
        // Add color stops for smooth gradient
        gradient.addColorStop(0, `rgba(${this.tailColor.primary.r}, ${this.tailColor.primary.g}, ${this.tailColor.primary.b}, 1)`);
        gradient.addColorStop(0.7, `rgba(${this.tailColor.secondary.r}, ${this.tailColor.secondary.g}, ${this.tailColor.secondary.b}, 1)`);
        gradient.addColorStop(1, `rgba(${this.tailColor.primary.r}, ${this.tailColor.primary.g}, ${this.tailColor.primary.b}, 0.8)`);
        
        // Fill the clipped shape with the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(-tailLength, -tailHeight, tailLength, tailHeight * 2);
        
        // Restore context
        ctx.restore();
        
        this.canvas.pop();
    }
    
    drawFins() {
        // Draw dorsal fin (top)
        this.canvas.fill(this.finColor.r, this.finColor.g, this.finColor.b);
        this.canvas.noStroke();
        
        // Dorsal fin
        this.canvas.beginShape();
        this.canvas.vertex(this.size * 0.1, 0);
        this.canvas.bezierVertex(
            this.size * 0.2, -this.size * 0.6,
            -this.size * 0.2, -this.size * 0.7,
            -this.size * 0.3, -this.size * 0.1
        );
        this.canvas.endShape(this.canvas.CLOSE);
        
        // Pectoral fin (side)
        this.canvas.beginShape();
        this.canvas.vertex(this.size * 0.3, this.size * 0.1);
        this.canvas.bezierVertex(
            this.size * 0.2, this.size * 0.3,
            -this.size * 0.1, this.size * 0.4,
            -this.size * 0.1, this.size * 0.2
        );
        this.canvas.endShape(this.canvas.CLOSE);
    }
    
    drawEye() {
        // Calculate eye position based on fish size
        const eyeX = this.size * 0.35;
        const eyeY = -this.size * 0.1;
        const eyeSize = this.size * 0.15;
        
        // White of eye
        this.canvas.fill(255);
        this.canvas.ellipse(eyeX, eyeY, eyeSize, eyeSize);
        
        // Pupil - slightly offset for more natural look
        this.canvas.fill(0);
        this.canvas.ellipse(eyeX + eyeSize * 0.1, eyeY, eyeSize * 0.5, eyeSize * 0.5);
        
        // Add a highlight on the eye
        this.canvas.fill(255, 255, 255, 200);
        this.canvas.ellipse(eyeX - eyeSize * 0.2, eyeY - eyeSize * 0.2, eyeSize * 0.2, eyeSize * 0.2);
    }
}

/**
 * Plankton class for underwater theme
 * Small floating particles that add depth to the scene
 */
class Plankton {
    constructor(canvas, depthLevel = null) {
        this.canvas = canvas;
        
        // Random position throughout the canvas
        this.x = this.canvas.random(0, this.canvas.width);
        this.y = this.canvas.random(0, this.canvas.height);
        
        // Depth simulation (0 = closest, 1 = furthest away)
        this.depth = depthLevel !== null ? depthLevel : this.canvas.random(0, 1);
        
        // Size properties with base size for consistent multiplier application
        this.baseSize = this.canvas.map(this.depth, 0, 1, 3, 0.5);
        this.sizeMultiplier = 1;
        this.size = this.baseSize * this.sizeMultiplier;
        
        this.opacity = this.canvas.map(this.depth, 0, 1, 220, 80);
        
        // Movement properties - deeper plankton move slower
        const speedFactor = this.canvas.map(this.depth, 0, 1, 1, 0.3);
        this.xSpeed = this.canvas.random(-0.3, 0.3) * speedFactor;
        this.ySpeed = this.canvas.random(-0.2, 0.2) * speedFactor;
        
        // Color properties vary with depth
        const colorBrightness = this.canvas.map(this.depth, 0, 1, 1, 0.7);
        this.color = {
            r: this.canvas.random(180, 230) * colorBrightness,
            g: this.canvas.random(230, 255) * colorBrightness,
            b: this.canvas.random(180, 230) * colorBrightness
        };
    }
    
    // Set the size multiplier to adjust plankton size
    setSizeMultiplier(multiplier) {
        this.sizeMultiplier = multiplier;
        this.size = this.baseSize * this.sizeMultiplier;
    }
    
    update() {
        // Slow drifting movement
        this.x += this.xSpeed;
        this.y += this.ySpeed;
        
        // Add slight random movement - varies by depth
        const randomFactor = this.canvas.map(this.depth, 0, 1, 1, 0.4);
        this.x += this.canvas.random(-0.2, 0.2) * randomFactor;
        this.y += this.canvas.random(-0.2, 0.2) * randomFactor;
        
        // Wrap around edges
        if (this.x < 0) this.x = this.canvas.width;
        if (this.x > this.canvas.width) this.x = 0;
        if (this.y < 0) this.y = this.canvas.height;
        if (this.y > this.canvas.height) this.y = 0;
    }
    
    draw() {
        this.canvas.noStroke();
        this.canvas.fill(this.color.r, this.color.g, this.color.b, this.opacity);
        
        // Draw as small blurry dots for deeper plankton, sharper for closer ones
        if (this.depth > 0.7) {
            // Far away plankton - just a dot
            this.canvas.ellipse(this.x, this.y, this.size);
        } else {
            // Closer plankton - slightly more detailed
            this.canvas.push();
            this.canvas.translate(this.x, this.y);
            
            // Main body
            this.canvas.ellipse(0, 0, this.size);
            
            // Add simple details for closer plankton
            if (this.depth < 0.3) {
                const detailSize = this.size * 0.6;
                const angle = this.canvas.frameCount * 0.01 + this.depth * 10;
                const xOffset = Math.cos(angle) * this.size * 0.3;
                const yOffset = Math.sin(angle) * this.size * 0.3;
                this.canvas.fill(this.color.r * 1.1, this.color.g * 1.1, this.color.b * 1.1, this.opacity * 0.7);
                this.canvas.ellipse(xOffset, yOffset, detailSize);
            }
            
            this.canvas.pop();
        }
    }
    
    setDepth(depth) {
        this.depth = depth;
        // Update base size based on new depth
        this.baseSize = this.canvas.map(this.depth, 0, 1, 3, 0.5);
        // Apply the current size multiplier to maintain consistency
        this.size = this.baseSize * this.sizeMultiplier;
        
        this.opacity = this.canvas.map(this.depth, 0, 1, 220, 80);
        
        // Update speed based on depth
        const speedFactor = this.canvas.map(this.depth, 0, 1, 1, 0.3);
        this.xSpeed = this.canvas.random(-0.3, 0.3) * speedFactor;
        this.ySpeed = this.canvas.random(-0.2, 0.2) * speedFactor;
        
        // Update color based on depth
        const colorBrightness = this.canvas.map(this.depth, 0, 1, 1, 0.7);
        this.color = {
            r: this.canvas.random(180, 230) * colorBrightness,
            g: this.canvas.random(230, 255) * colorBrightness,
            b: this.canvas.random(180, 230) * colorBrightness
        };
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
        this.planktons = [];
        this.numBubbles = 100; // Default number of bubbles
        this.numFishes = 5;    // Default number of fish
        this.numPlanktons = 50; // Default number of planktons
        this.bubbleSizeMultiplier = 1; // Default size multiplier
        this.fishSizeMultiplier = 1;   // Default fish size multiplier
        this.bubbleSpeedMultiplier = 1; // Default speed multiplier
        this.fishSpeedMultiplier = 1;   // Default fish speed multiplier
        this.wobbleIntensity = 0.5; // Default wobble intensity
        this.currentStrength = 0; // Default current strength
        this.currentDirection = 0; // Default current direction (degrees)
        this.planktonSizeMultiplier = 1; // Default plankton size multiplier
        this.planktonDepthVariation = 0.5; // Default depth variation (0-1)
        
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
                        planktonCount: 50,
                        bubbleSize: 10,   // 1-40 scale like snowflakes
                        fishSize: 10,     // 1-20 scale
                        bubbleSpeed: 1,   // 0.5-3 scale
                        fishSpeed: 1,     // 0.5-3 scale
                        wobbleIntensity: 5, // 0-10 scale
                        currentStrength: 0, // 0-10 scale
                        currentDirection: 0, // 0-360 degrees
                        planktonSize: 10, // 1-20 scale
                        planktonDepth: 5  // 0-10 scale (depth variation)
                    }
                }
            }, 'UnderwaterTheme.constructor');
            
            return;
        }
        
        // Set background color
        this.setBackgroundColor(config.backgroundColor);
        
        // Set bubble color
        this.setBubbleColor(config.bubbleColor);
        
        // Set number of bubbles, fish, and planktons
        this.setNumberOfBubbles(config.bubbleCount);
        this.setNumberOfFish(config.fishCount);
        this.setNumberOfPlanktons(config.planktonCount);
        
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
        
        // Set plankton properties if they exist
        if (config.planktonSize !== undefined) {
            const planktonSizeMultiplier = config.planktonSize / 10;
            this.setPlanktonSizeMultiplier(planktonSizeMultiplier);
        }
        
        if (config.planktonDepth !== undefined) {
            const planktonDepthVariation = config.planktonDepth / 10;
            this.setPlanktonDepthVariation(planktonDepthVariation);
        }
        
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

    setNumberOfPlanktons(num) {
        const previouslyRunning = this.isRunning;
        
        // Stop animation temporarily if running
        if (previouslyRunning) {
            this.isRunning = false;
        }
        
        this.numPlanktons = num;
        this.updatePlanktons();
        
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

    setPlanktonSizeMultiplier(multiplier) {
        this.planktonSizeMultiplier = multiplier;
        // Update existing plankton sizes using the proper method
        for (let plankton of this.planktons) {
            plankton.setSizeMultiplier(multiplier);
        }
    }
    
    setPlanktonDepthVariation(variation) {
        this.planktonDepthVariation = variation;
        
        // Redistribute plankton depths based on variation
        const previouslyRunning = this.isRunning;
        
        // Stop animation temporarily if running
        if (previouslyRunning) {
            this.isRunning = false;
        }
        
        // Redistribute plankton depths
        for (let plankton of this.planktons) {
            // If variation is 0, all plankton are at middle depth (0.5)
            // If variation is 1, full range of depths is used
            const minDepth = 0.5 - (0.5 * variation);
            const maxDepth = 0.5 + (0.5 * variation);
            
            const newDepth = this.canvas.random(minDepth, maxDepth);
            plankton.setDepth(newDepth);
        }
        
        // Resume animation if it was running before
        if (previouslyRunning) {
            this.isRunning = true;
        }
    }

    updateBubbles() {
        // Adjust number of bubbles
        if (this.bubbles.length < this.numBubbles) {
            // Add more bubbles
            const numToAdd = this.numBubbles - this.bubbles.length;
            for (let i = 0; i < numToAdd; i++) {
                const depthLevel = this.canvas.random(0, 1); // Assign random depth level for 3D effect
                const bubble = new Bubble(this.canvas, true, this.bubbleSizeMultiplier, depthLevel);
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

    updatePlanktons() {
        // Adjust number of planktons
        if (this.planktons.length < this.numPlanktons) {
            // Add more planktons
            const numToAdd = this.numPlanktons - this.planktons.length;
            for (let i = 0; i < numToAdd; i++) {
                // Create new plankton with proper depth variation and size multiplier
                const minDepth = 0.5 - (0.5 * this.planktonDepthVariation);
                const maxDepth = 0.5 + (0.5 * this.planktonDepthVariation);
                const depthLevel = this.canvas.random(minDepth, maxDepth);
                
                const plankton = new Plankton(this.canvas, depthLevel);
                plankton.setSizeMultiplier(this.planktonSizeMultiplier);
                
                this.planktons.push(plankton);
            }
        } else if (this.planktons.length > this.numPlanktons) {
            // Remove excess planktons
            this.planktons = this.planktons.slice(0, this.numPlanktons);
        }
    }

    setup() {
        // Create bubbles with initial distribution throughout canvas
        this.bubbles = [];
        for (let i = 0; i < this.numBubbles; i++) {
            const depthLevel = this.canvas.random(0, 1); // Assign depth level for 3D effect
            const bubble = new Bubble(this.canvas, true, this.bubbleSizeMultiplier, depthLevel);
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

        // Create planktons with proper depth variation and size multiplier
        this.planktons = [];
        for (let i = 0; i < this.numPlanktons; i++) {
            // Create plankton with proper depth variation
            const minDepth = 0.5 - (0.5 * this.planktonDepthVariation);
            const maxDepth = 0.5 + (0.5 * this.planktonDepthVariation);
            const depthLevel = this.canvas.random(minDepth, maxDepth);
            
            const plankton = new Plankton(this.canvas, depthLevel);
            plankton.setSizeMultiplier(this.planktonSizeMultiplier);
            
            this.planktons.push(plankton);
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

        // Update all planktons
        for (let plankton of this.planktons) {
            plankton.update();
        }
    }

    draw() {
        if (!this.canvas || !this.isRunning) return;

        // Clear background with custom color
        this.canvas.background(this.backgroundColor.r, this.backgroundColor.g, this.backgroundColor.b);
        
        // Draw subtle underwater gradient
        this.drawUnderwaterGradient();
        
        // Sort bubbles by depth (furthest first, closest last)
        this.bubbles.sort((a, b) => b.getZIndex() - a.getZIndex());
        
        // Draw planktons (furthest back)
        for (let plankton of this.planktons) {
            plankton.draw();
        }
        
        // Draw bubbles (in the middle layer)
        for (let bubble of this.bubbles) {
            bubble.draw();
        }

        // Draw fish (in the foreground, on top of bubbles)
        for (let fish of this.fishes) {
            fish.draw();
        }
    }
    
    drawUnderwaterGradient() {
        // Use the HTML Canvas API for a smooth gradient with no banding
        const ctx = this.canvas.drawingContext;
        
        // Create a linear gradient from bottom to top
        const gradient = ctx.createLinearGradient(0, this.canvas.height, 0, 0);
        
        // Define gradient color stops
        const baseColor = this.backgroundColor;
        const deepColor = {
            r: Math.max(0, baseColor.r - 20), 
            g: Math.max(0, baseColor.g - 20), 
            b: Math.max(0, baseColor.b)
        };
        
        // Add multiple color stops for smoother transition
        gradient.addColorStop(0, `rgb(${deepColor.r}, ${deepColor.g}, ${deepColor.b})`);
        gradient.addColorStop(0.6, `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`);
        gradient.addColorStop(1, `rgb(${Math.min(255, baseColor.r + 15)}, ${Math.min(255, baseColor.g + 15)}, ${Math.min(255, baseColor.b + 20)})`);
        
        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    cleanup() {
        // Clean up resources
        this.bubbles = [];
        this.fishes = [];
        this.planktons = [];
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