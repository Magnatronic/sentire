/**
 * Color utility functions for themes
 * Centralized color manipulation utilities to be used across different themes
 */
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
        s /= 100;
        l /= 100;
        
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = l - c / 2;
        let r, g, b;
        
        if (h >= 0 && h < 60) {
            [r, g, b] = [c, x, 0];
        } else if (h >= 60 && h < 120) {
            [r, g, b] = [x, c, 0];
        } else if (h >= 120 && h < 180) {
            [r, g, b] = [0, c, x];
        } else if (h >= 180 && h < 240) {
            [r, g, b] = [0, x, c];
        } else if (h >= 240 && h < 300) {
            [r, g, b] = [x, 0, c];
        } else {
            [r, g, b] = [c, 0, x];
        }
        
        return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
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
    },

    /**
     * Generate a complementary color to the given RGB color
     * @param {Object} color - RGB color object with r, g, b properties
     * @returns {Object} Complementary RGB color object
     */
    getComplementaryColor(color) {
        // Simple complementary color - invert RGB
        return {
            r: 255 - color.r,
            g: 255 - color.g,
            b: 255 - color.b
        };
    },
    
    /**
     * Generate an accent color (shifted hue) from an RGB color
     * @param {Object} color - RGB color object with r, g, b properties
     * @param {number} hueShift - Amount to shift the hue (0-360), default 60
     * @returns {Object} Accent RGB color object
     */
    getAccentColor(color, hueShift = 60) {
        // Convert RGB to HSL, shift hue, convert back
        const [h, s, l] = this.rgbToHsl(color.r, color.g, color.b);
        const newHue = (h + hueShift) % 360;
        const [r, g, b] = this.hslToRgb(newHue, s, l);
        return { r, g, b };
    },
    
    /**
     * Generate an array of triadic colors from the given RGB color
     * @param {Object} color - RGB color object with r, g, b properties
     * @returns {Array} Array of three RGB color objects (including the original)
     */
    getTriadicColors(color) {
        // Convert to HSL, create 3 colors with hues 120° apart, then back to RGB
        const [h, s, l] = this.rgbToHsl(color.r, color.g, color.b);
        
        // Original color
        const color1 = { r: color.r, g: color.g, b: color.b };
        
        // Triadic colors (120° and 240° from original)
        const [r2, g2, b2] = this.hslToRgb((h + 120) % 360, s, l);
        const [r3, g3, b3] = this.hslToRgb((h + 240) % 360, s, l);
        
        const color2 = { r: r2, g: g2, b: b2 };
        const color3 = { r: r3, g: g3, b: b3 };
        
        return [color1, color2, color3];
    },
    
    /**
     * Generate analogous colors from the given RGB color
     * @param {Object} color - RGB color object with r, g, b properties
     * @param {number} angle - Angle between colors in degrees, default 30
     * @param {number} count - Number of colors to generate (including original), default 3
     * @returns {Array} Array of RGB color objects
     */
    getAnalogousColors(color, angle = 30, count = 3) {
        // Convert to HSL
        const [h, s, l] = this.rgbToHsl(color.r, color.g, color.b);
        const colors = [];
        
        // Calculate the starting hue offset
        const startOffset = -((count - 1) / 2) * angle;
        
        // Generate colors around the original hue
        for (let i = 0; i < count; i++) {
            const hueOffset = startOffset + i * angle;
            const newHue = (h + hueOffset + 360) % 360;
            const [r, g, b] = this.hslToRgb(newHue, s, l);
            colors.push({ r, g, b });
        }
        
        return colors;
    },
    
    /**
     * Generate a pastel version of the given RGB color
     * @param {Object} color - RGB color object with r, g, b properties
     * @param {number} pastelAmount - How pastel to make it (0-1), default 0.3
     * @returns {Object} Pastel RGB color object
     */
    getPastelColor(color, pastelAmount = 0.3) {
        return {
            r: Math.min(255, Math.round(color.r + (255 - color.r) * pastelAmount)),
            g: Math.min(255, Math.round(color.g + (255 - color.g) * pastelAmount)),
            b: Math.min(255, Math.round(color.b + (255 - color.b) * pastelAmount))
        };
    },
    
    /**
     * Generate a gradient between two colors
     * @param {Object} color1 - Starting RGB color object
     * @param {Object} color2 - Ending RGB color object
     * @param {number} steps - Number of color steps (including start and end)
     * @returns {Array} Array of RGB color objects
     */
    getColorGradient(color1, color2, steps) {
        const gradient = [];
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            
            const r = Math.round(color1.r + (color2.r - color1.r) * ratio);
            const g = Math.round(color1.g + (color2.g - color1.g) * ratio);
            const b = Math.round(color1.b + (color2.b - color1.b) * ratio);
            
            gradient.push({ r, g, b });
        }
        
        return gradient;
    },
    
    /**
     * Adjust the brightness of a color
     * @param {Object} color - RGB color object
     * @param {number} factor - Factor to adjust brightness (0-2, 1 is unchanged)
     * @returns {Object} Adjusted RGB color
     */
    adjustBrightness(color, factor) {
        return {
            r: Math.min(255, Math.max(0, Math.round(color.r * factor))),
            g: Math.min(255, Math.max(0, Math.round(color.g * factor))),
            b: Math.min(255, Math.max(0, Math.round(color.b * factor)))
        };
    },
    
    /**
     * Calculate contrast ratio between two colors (WCAG)
     * @param {Object} color1 - First RGB color
     * @param {Object} color2 - Second RGB color
     * @returns {number} Contrast ratio (1 to 21)
     */
    getContrastRatio(color1, color2) {
        // Calculate relative luminance for both colors
        const l1 = this.getRelativeLuminance(color1);
        const l2 = this.getRelativeLuminance(color2);
        
        // Return contrast ratio
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    },
    
    /**
     * Calculate relative luminance of an RGB color (WCAG)
     * @param {Object} color - RGB color object
     * @returns {number} Relative luminance value (0 to 1)
     */
    getRelativeLuminance(color) {
        // Convert RGB to sRGB
        const rsrgb = color.r / 255;
        const gsrgb = color.g / 255;
        const bsrgb = color.b / 255;
        
        // Calculate RGB values for luminance
        const r = rsrgb <= 0.03928 ? rsrgb / 12.92 : Math.pow((rsrgb + 0.055) / 1.055, 2.4);
        const g = gsrgb <= 0.03928 ? gsrgb / 12.92 : Math.pow((gsrgb + 0.055) / 1.055, 2.4);
        const b = bsrgb <= 0.03928 ? bsrgb / 12.92 : Math.pow((bsrgb + 0.055) / 1.055, 2.4);
        
        // Calculate luminance using WCAG formula
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    },
    
    /**
     * Convert RGB color to hex string
     * @param {Object|Array} color - RGB color object or array [r, g, b]
     * @returns {string} Hex color string (e.g. "#FFFFFF")
     */
    rgbToHex(color) {
        let r, g, b;
        
        if (Array.isArray(color)) {
            [r, g, b] = color;
        } else {
            r = color.r;
            g = color.g;
            b = color.b;
        }
        
        return "#" + 
            ((1 << 24) + (r << 16) + (g << 8) + b)
            .toString(16).slice(1);
    }
};

// Make ColorUtils available globally
if (typeof window !== 'undefined') {
    window.ColorUtils = ColorUtils;
}
