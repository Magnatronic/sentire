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
    }
};

// Make ColorUtils available globally
if (typeof window !== 'undefined') {
    window.ColorUtils = ColorUtils;
}
