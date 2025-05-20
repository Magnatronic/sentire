/**
 * PresetManager - Manages the creation, application, and organization of presets
 * 
 * This class provides functionality for creating presets from current state,
 * applying presets to change state, and organizing presets into categories.
 */
class PresetManager {
    constructor(stateManager, stateStorage) {
        this.stateManager = stateManager;
        this.stateStorage = stateStorage;
        this.activePreset = null;
        
        // Load presets from storage
        this.presets = this.stateStorage.getPresets();
        
        if (this.stateManager.state.debug) {
            console.log(`PresetManager: Initialized with ${Object.keys(this.presets).length} presets`);
        }
    }
    
    /**
     * Create a preset from current state
     * @param {String} name - Name for the preset
     * @param {String} category - Category for the preset (optional)
     * @param {String} description - Description of the preset (optional)
     * @returns {Object} The created preset
     */
    createPreset(name, category = "default", description = "") {
        const currentTheme = this.stateManager.state.currentTheme;
        const themeConfig = this.stateManager.getStateSection(`themeConfigs.${currentTheme}`);
        
        const preset = {
            name,
            category,
            description,
            theme: currentTheme,
            config: themeConfig,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        
        // Save to storage
        this.stateStorage.savePreset(name, preset);
        
        // Update local cache
        this.presets[name] = preset;
        
        if (this.stateManager.state.debug) {
            console.log(`PresetManager: Created preset "${name}" for theme "${currentTheme}"`);
        }
        
        return preset;
    }
    
    /**
     * Apply a preset to the current state
     * @param {String} presetName - Name of the preset to apply
     * @returns {Boolean} Whether the application was successful
     */
    applyPreset(presetName) {
        const preset = this.presets[presetName];
        
        if (!preset) {
            if (this.stateManager.state.debug) {
                console.error(`PresetManager: Preset "${presetName}" not found`);
            }
            return false;
        }
        
        // Apply the theme and configuration
        const updates = {
            currentTheme: preset.theme,
            themeConfigs: {
                [preset.theme]: preset.config
            }
        };
        
        this.stateManager.updateState(updates, `PresetManager.applyPreset(${presetName})`);
        this.activePreset = presetName;
        
        if (this.stateManager.state.debug) {
            console.log(`PresetManager: Applied preset "${presetName}"`);
        }
        
        return true;
    }
    
    /**
     * Update an existing preset with current state
     * @param {String} presetName - Name of the preset to update
     * @returns {Boolean} Whether the update was successful
     */
    updatePreset(presetName) {
        if (!this.presets[presetName]) {
            if (this.stateManager.state.debug) {
                console.error(`PresetManager: Preset "${presetName}" not found, cannot update`);
            }
            return false;
        }
        
        const existingPreset = this.presets[presetName];
        const currentTheme = this.stateManager.state.currentTheme;
        const themeConfig = this.stateManager.getStateSection(`themeConfigs.${currentTheme}`);
        
        const updatedPreset = {
            ...existingPreset,
            theme: currentTheme,
            config: themeConfig,
            updatedAt: Date.now()
        };
        
        // Save to storage
        this.stateStorage.savePreset(presetName, updatedPreset);
        
        // Update local cache
        this.presets[presetName] = updatedPreset;
        
        if (this.stateManager.state.debug) {
            console.log(`PresetManager: Updated preset "${presetName}"`);
        }
        
        return true;
    }
    
    /**
     * Delete a preset
     * @param {String} presetName - Name of the preset to delete
     * @returns {Boolean} Whether the deletion was successful
     */
    deletePreset(presetName) {
        if (!this.presets[presetName]) {
            if (this.stateManager.state.debug) {
                console.error(`PresetManager: Preset "${presetName}" not found, cannot delete`);
            }
            return false;
        }
        
        // Delete from storage
        const result = this.stateStorage.deletePreset(presetName);
        
        if (result) {
            // Update local cache
            delete this.presets[presetName];
            
            // Reset active preset if it was the one deleted
            if (this.activePreset === presetName) {
                this.activePreset = null;
            }
            
            if (this.stateManager.state.debug) {
                console.log(`PresetManager: Deleted preset "${presetName}"`);
            }
        }
        
        return result;
    }
    
    /**
     * Get all presets, optionally filtered by category
     * @param {String} category - Category to filter by (optional)
     * @returns {Object} Object containing matching presets
     */
    getPresets(category = null) {
        if (!category) {
            return this.presets;
        }
        
        // Filter presets by category
        const filtered = {};
        for (const [name, preset] of Object.entries(this.presets)) {
            if (preset.category === category) {
                filtered[name] = preset;
            }
        }
        
        return filtered;
    }
    
    /**
     * Get a list of all preset categories
     * @returns {Array} Array of unique category names
     */
    getCategories() {
        const categories = new Set();
        
        for (const preset of Object.values(this.presets)) {
            if (preset.category) {
                categories.add(preset.category);
            }
        }
        
        return Array.from(categories).sort();
    }
    
    /**
     * Export all presets or a category of presets
     * @param {String} category - Category to export (optional)
     * @returns {String} JSON string of exported presets
     */
    exportPresets(category = null) {
        const presetsToExport = category ? this.getPresets(category) : this.presets;
        return JSON.stringify(presetsToExport, null, 2);
    }
    
    /**
     * Import presets from JSON
     * @param {String} presetsJson - JSON string of presets
     * @param {Boolean} overwrite - Whether to overwrite existing presets
     * @returns {Number} Number of presets imported
     */
    importPresets(presetsJson, overwrite = false) {
        try {
            const imported = JSON.parse(presetsJson);
            
            // Count imported presets
            const count = Object.keys(imported).length;
            
            // Save to storage
            this.stateStorage.importPresets(presetsJson, overwrite);
            
            // Refresh local cache
            this.presets = this.stateStorage.getPresets();
            
            if (this.stateManager.state.debug) {
                console.log(`PresetManager: Imported ${count} presets`);
            }
            
            return count;
        } catch (error) {
            if (this.stateManager.state.debug) {
                console.error('PresetManager: Failed to import presets', error);
            }
            return 0;
        }
    }
    
    /**
     * Rename a preset
     * @param {String} oldName - Current preset name
     * @param {String} newName - New preset name
     * @returns {Boolean} Whether the rename was successful
     */
    renamePreset(oldName, newName) {
        if (!this.presets[oldName]) {
            if (this.stateManager.state.debug) {
                console.error(`PresetManager: Preset "${oldName}" not found, cannot rename`);
            }
            return false;
        }
        
        if (this.presets[newName]) {
            if (this.stateManager.state.debug) {
                console.error(`PresetManager: Preset "${newName}" already exists, cannot rename`);
            }
            return false;
        }
        
        // Create a copy with the new name
        const preset = {...this.presets[oldName]};
        preset.name = newName;
        
        // Save to storage
        this.stateStorage.savePreset(newName, preset);
        this.stateStorage.deletePreset(oldName);
        
        // Update local cache
        this.presets[newName] = preset;
        delete this.presets[oldName];
        
        // Update active preset reference if needed
        if (this.activePreset === oldName) {
            this.activePreset = newName;
        }
        
        if (this.stateManager.state.debug) {
            console.log(`PresetManager: Renamed preset "${oldName}" to "${newName}"`);
        }
        
        return true;
    }
    
    /**
     * Change the category of a preset
     * @param {String} presetName - Name of the preset
     * @param {String} newCategory - New category name
     * @returns {Boolean} Whether the change was successful
     */
    changePresetCategory(presetName, newCategory) {
        if (!this.presets[presetName]) {
            if (this.stateManager.state.debug) {
                console.error(`PresetManager: Preset "${presetName}" not found, cannot change category`);
            }
            return false;
        }
        
        // Update preset
        const preset = {...this.presets[presetName]};
        preset.category = newCategory;
        
        // Save to storage
        this.stateStorage.savePreset(presetName, preset);
        
        // Update local cache
        this.presets[presetName] = preset;
        
        if (this.stateManager.state.debug) {
            console.log(`PresetManager: Changed category of preset "${presetName}" to "${newCategory}"`);
        }
        
        return true;
    }
    
    /**
     * Check if the state has been modified since the preset was applied
     * @returns {Boolean} Whether the state differs from the active preset
     */
    hasStateChanged() {
        if (!this.activePreset) {
            return true; // No active preset, so state is considered changed
        }
        
        const preset = this.presets[this.activePreset];
        const currentTheme = this.stateManager.state.currentTheme;
        
        // Different theme means state has changed
        if (preset.theme !== currentTheme) {
            return true;
        }
        
        // Compare theme config
        const currentConfig = this.stateManager.getStateSection(`themeConfigs.${currentTheme}`);
        const presetConfig = preset.config;
        
        // Deep compare current config with preset config
        return JSON.stringify(currentConfig) !== JSON.stringify(presetConfig);
    }
}