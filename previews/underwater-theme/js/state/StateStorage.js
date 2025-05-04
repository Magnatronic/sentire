/**
 * StateStorage - Handles saving and loading state to/from localStorage
 * 
 * This class provides methods to persist application state and presets
 * to localStorage, and to retrieve them later.
 */
class StateStorage {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.storagePrefix = 'sentire_';
        this.stateKey = `${this.storagePrefix}state`;
        this.presetsKey = `${this.storagePrefix}presets`;
        
        if (this.stateManager.state.debug) {
            console.log('StateStorage: Initialized');
        }
    }
    
    /**
     * Save current state to localStorage
     * @returns {Boolean} Whether the save was successful
     */
    saveState() {
        try {
            const stateToSave = this.stateManager.getState();
            
            // Don't save debug information
            delete stateToSave.debug;
            
            localStorage.setItem(this.stateKey, JSON.stringify(stateToSave));
            
            if (this.stateManager.state.debug) {
                console.log('StateStorage: State saved to localStorage');
            }
            
            return true;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to save state to localStorage', error);
            }
            return false;
        }
    }
    
    /**
     * Load state from localStorage
     * @returns {Boolean} Whether the load was successful
     */
    loadState() {
        try {
            const savedState = localStorage.getItem(this.stateKey);
            if (!savedState) {
                if (this.stateManager.state.debug) {
                    console.log('StateStorage: No saved state found in localStorage');
                }
                return false;
            }
            
            const parsedState = JSON.parse(savedState);
            
            // Preserve debug setting
            const debug = this.stateManager.state.debug;
            
            this.stateManager.updateState(parsedState, 'StateStorage.loadState');
            
            // Restore debug setting
            this.stateManager.state.debug = debug;
            
            if (this.stateManager.state.debug) {
                console.log('StateStorage: State loaded from localStorage');
            }
            
            return true;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to load state from localStorage', error);
            }
            return false;
        }
    }
    
    /**
     * Clear saved state from localStorage
     * @returns {Boolean} Whether the operation was successful
     */
    clearState() {
        try {
            localStorage.removeItem(this.stateKey);
            
            if (this.stateManager.state.debug) {
                console.log('StateStorage: State cleared from localStorage');
            }
            
            return true;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to clear state from localStorage', error);
            }
            return false;
        }
    }
    
    /**
     * Save a preset to localStorage
     * @param {String} name - Name of the preset
     * @param {Object} preset - Preset data to save
     * @returns {Boolean} Whether the save was successful
     */
    savePreset(name, preset) {
        try {
            // Get existing presets
            const presetsJson = localStorage.getItem(this.presetsKey);
            const presets = presetsJson ? JSON.parse(presetsJson) : {};
            
            // Add or update the preset
            presets[name] = {
                ...preset,
                updatedAt: Date.now()
            };
            
            // Save back to localStorage
            localStorage.setItem(this.presetsKey, JSON.stringify(presets));
            
            if (this.stateManager.state.debug) {
                console.log(`StateStorage: Preset "${name}" saved to localStorage`);
            }
            
            return true;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to save preset to localStorage', error);
            }
            return false;
        }
    }
    
    /**
     * Get all presets from localStorage
     * @returns {Object} Object containing all presets
     */
    getPresets() {
        try {
            const presetsJson = localStorage.getItem(this.presetsKey);
            const presets = presetsJson ? JSON.parse(presetsJson) : {};
            
            if (this.stateManager.state.debug) {
                console.log(`StateStorage: Retrieved ${Object.keys(presets).length} presets from localStorage`);
            }
            
            return presets;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to retrieve presets from localStorage', error);
            }
            return {};
        }
    }
    
    /**
     * Get a specific preset from localStorage
     * @param {String} name - Name of the preset to retrieve
     * @returns {Object|null} The preset object or null if not found
     */
    getPreset(name) {
        try {
            const presets = this.getPresets();
            const preset = presets[name];
            
            if (preset) {
                if (this.stateManager.state.debug) {
                    console.log(`StateStorage: Retrieved preset "${name}" from localStorage`);
                }
                return preset;
            } else {
                if (this.stateManager.state.debug) {
                    console.log(`StateStorage: Preset "${name}" not found in localStorage`);
                }
                return null;
            }
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to retrieve preset from localStorage', error);
            }
            return null;
        }
    }
    
    /**
     * Delete a preset from localStorage
     * @param {String} name - Name of the preset to delete
     * @returns {Boolean} Whether the deletion was successful
     */
    deletePreset(name) {
        try {
            const presets = this.getPresets();
            
            if (presets[name]) {
                delete presets[name];
                localStorage.setItem(this.presetsKey, JSON.stringify(presets));
                
                if (this.stateManager.state.debug) {
                    console.log(`StateStorage: Deleted preset "${name}" from localStorage`);
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to delete preset from localStorage', error);
            }
            return false;
        }
    }
    
    /**
     * Export all presets to a JSON string
     * @returns {String} JSON string containing all presets
     */
    exportPresets() {
        try {
            const presets = this.getPresets();
            return JSON.stringify(presets, null, 2);
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to export presets', error);
            }
            return '{}';
        }
    }
    
    /**
     * Import presets from a JSON string
     * @param {String} presetsJson - JSON string containing presets
     * @param {Boolean} overwrite - Whether to overwrite existing presets with the same name
     * @returns {Boolean} Whether the import was successful
     */
    importPresets(presetsJson, overwrite = false) {
        try {
            const importedPresets = JSON.parse(presetsJson);
            const currentPresets = overwrite ? {} : this.getPresets();
            
            // Merge presets
            const mergedPresets = {
                ...currentPresets,
                ...importedPresets
            };
            
            // Save merged presets
            localStorage.setItem(this.presetsKey, JSON.stringify(mergedPresets));
            
            if (this.stateManager.state.debug) {
                console.log(`StateStorage: Imported ${Object.keys(importedPresets).length} presets`);
            }
            
            return true;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('StateStorage: Failed to import presets', error);
            }
            return false;
        }
    }
}