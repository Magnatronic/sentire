/**
 * Main p5.js sketch file for Sentire
 * 
 * This file handles the p5.js canvas setup and integration
 * with the state management system.
 */

// Global variable for p5.js canvas
let canvas;

// Reference to app components from global scope
let themeManager;
let stateManager;
let audioManager; // Added reference to audio manager

/**
 * p5.js setup function - runs once at the start
 */
function setup() {
  // Get DOM elements
  const canvasContainer = document.getElementById('canvas-container');
  
  // Create canvas that fits the container
  canvas = createCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  canvas.parent('canvas-container');
  
  // Get references to the state and theme manager from global scope
  if (window.sentireApp) {
    stateManager = window.sentireApp.stateManager;
    themeManager = window.sentireApp.themeManager;
    audioManager = window.sentireApp.audioManager; // Get reference to audio manager
    
    // Initialize all themes with the p5.js instance
    themeManager.initThemes(this);
    
    if (stateManager.state.debug) {
      console.log('Sketch: p5.js canvas initialized and themes setup');
    }
  } else {
    console.error('State management system not initialized before p5.js setup');
  }
  
  // Set frame rate to 30 for smooth animation without being too resource intensive
  frameRate(30);
}

/**
 * p5.js draw function - runs continuously after setup
 */
function draw() {
  // Only proceed if theme manager is available
  if (!themeManager) return;
  
  const currentTheme = themeManager.currentTheme;
    if (currentTheme) {
    // Update and draw the current theme
    currentTheme.update();
    currentTheme.draw();
  }
}

/**
 * p5.js windowResized function - runs when window is resized
 */
function windowResized() {
  // Get current fullscreen state from state manager
  const isFullscreen = stateManager ? stateManager.state.isFullscreen : false;
  const canvasContainer = document.getElementById('canvas-container');
  
  // Resize canvas to fit container
  if (isFullscreen) {
    // In fullscreen mode, use window dimensions directly
    resizeCanvas(window.innerWidth, window.innerHeight);
  } else {
    // In normal mode, use container dimensions
    resizeCanvas(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
  }
  
  if (stateManager && stateManager.state.debug) {
    console.log(`Sketch: Canvas resized to ${width}x${height}, fullscreen: ${isFullscreen}`);
  }
}