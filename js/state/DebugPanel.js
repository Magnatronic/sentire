/**
 * DebugPanel - Development tool for visualizing and interacting with application state
 * 
 * This class provides a UI panel for developers to:
 * - View the current application state in real-time
 * - See a history of state changes
 * - Manually modify state for testing
 * - Save and load state snapshots
 */
class DebugPanel {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.isVisible = false;
        this.selectedTab = 'current'; // Options: 'current', 'history', 'snapshots'
        this.filter = '';
        this.panel = null;
        this.expandedPaths = new Set(); // Track which state paths are expanded in the view
        this.initialized = false;
        
        // Keep a list of snapshots for quick access
        this.snapshots = [];
        
        // Subscribe to state changes
        this.stateManager.subscribe({
            update: this.onStateUpdate.bind(this)
        }, 'global');
        
        // Note: Panel is not initialized automatically
        // Call init() method explicitly when ready to display the panel
    }
    
    /**
     * Initialize the debug panel
     * This is separated from the constructor to allow delayed initialization
     */
    init() {
        if (this.initialized) return;
        
        // Initialize the panel UI
        this.initPanel();
        this.initialized = true;
        
        if (this.stateManager.state.debug) {
            console.log('DebugPanel: Initialized');
        }
        
        return this;
    }
    
    /**
     * Initialize the debug panel UI
     * @private
     */
    initPanel() {
        // Create the main panel container
        this.panel = document.createElement('div');
        this.panel.className = 'debug-panel';
        this.panel.style.display = this.isVisible ? 'flex' : 'none';
        
        // Create the panel header
        const header = document.createElement('div');
        header.className = 'debug-panel-header';
        header.innerHTML = `
            <h2>State Debug Panel</h2>
            <div class="debug-panel-actions">
                <button id="debug-panel-close">×</button>
            </div>
        `;
        
        // Create tabs for different views
        const tabs = document.createElement('div');
        tabs.className = 'debug-panel-tabs';
        tabs.innerHTML = `
            <button id="tab-current" class="debug-panel-tab active">Current State</button>
            <button id="tab-history" class="debug-panel-tab">History</button>
            <button id="tab-snapshots" class="debug-panel-tab">Snapshots</button>
        `;
        
        // Create filter input
        const filter = document.createElement('div');
        filter.className = 'debug-panel-filter';
        filter.innerHTML = `
            <input type="text" id="debug-panel-filter" placeholder="Filter state (e.g. theme, isRunning)">
            <button id="debug-panel-clear-filter">Clear</button>
        `;
        
        // Create content area for the state tree display
        const content = document.createElement('div');
        content.className = 'debug-panel-content';
        
        // Create the state view container
        const stateView = document.createElement('div');
        stateView.id = 'debug-panel-state-view';
        stateView.className = 'debug-panel-state-view';
        
        // Create the history view container (initially hidden)
        const historyView = document.createElement('div');
        historyView.id = 'debug-panel-history-view';
        historyView.className = 'debug-panel-history-view';
        historyView.style.display = 'none';
        
        // Create the snapshots view container (initially hidden)
        const snapshotsView = document.createElement('div');
        snapshotsView.id = 'debug-panel-snapshots-view';
        snapshotsView.className = 'debug-panel-snapshots-view';
        snapshotsView.style.display = 'none';
        
        // Create panel footer with actions
        const footer = document.createElement('div');
        footer.className = 'debug-panel-footer';
        footer.innerHTML = `
            <div class="debug-panel-footer-actions">
                <button id="debug-panel-create-snapshot">Save Snapshot</button>
                <button id="debug-panel-reset-state">Reset State</button>
                <button id="debug-panel-toggle-debug">${this.stateManager.state.debug ? 'Disable' : 'Enable'} Debug Mode</button>
            </div>
        `;
        
        // Assemble the panel components
        content.appendChild(stateView);
        content.appendChild(historyView);
        content.appendChild(snapshotsView);
        
        this.panel.appendChild(header);
        this.panel.appendChild(tabs);
        this.panel.appendChild(filter);
        this.panel.appendChild(content);
        this.panel.appendChild(footer);
        
        // Add the toggle button to the page
        const toggleButton = document.createElement('button');
        toggleButton.id = 'debug-panel-toggle';
        toggleButton.className = 'debug-panel-toggle';
        toggleButton.textContent = 'Debug';
        toggleButton.title = 'Toggle Debug Panel';
        document.body.appendChild(toggleButton);
        
        // Add the panel to the page
        document.body.appendChild(this.panel);
        
        // Update the state view
        this.updateStateView();
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for panel interaction
     */
    setupEventListeners() {
        // Toggle panel visibility
        document.getElementById('debug-panel-toggle').addEventListener('click', () => {
            this.toggleVisibility();
        });
        
        // Close button
        document.getElementById('debug-panel-close').addEventListener('click', () => {
            this.hide();
        });
        
        // Tab switching
        document.getElementById('tab-current').addEventListener('click', () => {
            this.switchTab('current');
        });
        
        document.getElementById('tab-history').addEventListener('click', () => {
            this.switchTab('history');
        });
        
        document.getElementById('tab-snapshots').addEventListener('click', () => {
            this.switchTab('snapshots');
        });
        
        // Filter input
        document.getElementById('debug-panel-filter').addEventListener('input', (event) => {
            this.filter = event.target.value;
            this.updateStateView();
        });
        
        // Clear filter
        document.getElementById('debug-panel-clear-filter').addEventListener('click', () => {
            document.getElementById('debug-panel-filter').value = '';
            this.filter = '';
            this.updateStateView();
        });
        
        // Footer actions
        document.getElementById('debug-panel-create-snapshot').addEventListener('click', () => {
            this.createSnapshot();
        });
        
        document.getElementById('debug-panel-reset-state').addEventListener('click', () => {
            this.resetState();
        });
        
        document.getElementById('debug-panel-toggle-debug').addEventListener('click', () => {
            this.toggleDebugMode();
        });
    }
    
    /**
     * Toggle panel visibility
     */
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        this.panel.style.display = this.isVisible ? 'flex' : 'none';
        
        // If becoming visible, refresh the view
        if (this.isVisible) {
            this.updateStateView();
            
            if (this.selectedTab === 'history') {
                this.updateHistoryView();
            } else if (this.selectedTab === 'snapshots') {
                this.updateSnapshotsView();
            }
        }
    }
    
    /**
     * Show the panel
     */
    show() {
        this.isVisible = true;
        this.panel.style.display = 'flex';
        this.updateStateView();
    }
    
    /**
     * Hide the panel
     */
    hide() {
        this.isVisible = false;
        this.panel.style.display = 'none';
    }
    
    /**
     * Switch between panel tabs
     * @param {string} tab - Tab to switch to ('current', 'history', 'snapshots')
     */
    switchTab(tab) {
        this.selectedTab = tab;
        
        // Update tab button states
        document.querySelectorAll('.debug-panel-tab').forEach(el => {
            el.classList.remove('active');
        });
        document.getElementById(`tab-${tab}`).classList.add('active');
        
        // Hide all views
        document.getElementById('debug-panel-state-view').style.display = 'none';
        document.getElementById('debug-panel-history-view').style.display = 'none';
        document.getElementById('debug-panel-snapshots-view').style.display = 'none';
        
        // Show the selected view
        if (tab === 'current') {
            document.getElementById('debug-panel-state-view').style.display = 'block';
            this.updateStateView();
        } else if (tab === 'history') {
            document.getElementById('debug-panel-history-view').style.display = 'block';
            this.updateHistoryView();
        } else if (tab === 'snapshots') {
            document.getElementById('debug-panel-snapshots-view').style.display = 'block';
            this.updateSnapshotsView();
        }
    }
    
    /**
     * Update the current state view
     */
    updateStateView() {
        const stateView = document.getElementById('debug-panel-state-view');
        if (!stateView) return;
        
        // Get current state
        const state = this.stateManager.getState();
        
        // Clear current state view
        stateView.innerHTML = '';
        
        // Create the state tree
        const stateTree = this.createStateTree(state, '', this.filter);
        stateView.appendChild(stateTree);
    }
    
    /**
     * Update the history view with state change history
     */
    updateHistoryView() {
        const historyView = document.getElementById('debug-panel-history-view');
        if (!historyView) return;
        
        // Clear current history view
        historyView.innerHTML = '';
        
        // Check if we have history
        if (!this.stateManager.stateHistory || this.stateManager.stateHistory.length === 0) {
            historyView.innerHTML = '<p class="debug-panel-empty">No state change history available. Enable debug mode to record state changes.</p>';
            return;
        }
        
        // Create history list container
        const historyList = document.createElement('div');
        historyList.className = 'debug-panel-history-list';
        
        // Add history entries (most recent first)
        this.stateManager.stateHistory.slice().reverse().forEach((entry, index) => {
            const historyEntry = document.createElement('div');
            historyEntry.className = 'debug-panel-history-entry';
            
            // Format timestamp
            const timestamp = new Date(entry.timestamp);
            const timeString = timestamp.toLocaleTimeString();
            
            // Create summary of changes
            const changeKeys = Object.keys(entry.changes);
            const changesSummary = changeKeys.length > 0 
                ? changeKeys.slice(0, 3).join(', ') + (changeKeys.length > 3 ? ` and ${changeKeys.length - 3} more` : '')
                : 'No changes';
            
            historyEntry.innerHTML = `
                <div class="history-entry-header">
                    <span class="history-entry-index">${this.stateManager.stateHistory.length - index}</span>
                    <span class="history-entry-time">${timeString}</span>
                    <span class="history-entry-source">${entry.source}</span>
                </div>
                <div class="history-entry-summary">${changesSummary}</div>
                <div class="history-entry-actions">
                    <button class="history-view-details" data-index="${index}">View Details</button>
                    <button class="history-restore-state" data-index="${index}">Restore This State</button>
                </div>
            `;
            
            historyList.appendChild(historyEntry);
        });
        
        historyView.appendChild(historyList);
        
        // Add event listeners for history entry actions
        document.querySelectorAll('.history-view-details').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                this.viewHistoryDetails(this.stateManager.stateHistory.length - 1 - index);
            });
        });
        
        document.querySelectorAll('.history-restore-state').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                this.restoreHistoryState(this.stateManager.stateHistory.length - 1 - index);
            });
        });
    }
    
    /**
     * Update the snapshots view
     */
    updateSnapshotsView() {
        const snapshotsView = document.getElementById('debug-panel-snapshots-view');
        if (!snapshotsView) return;
        
        // Clear current snapshots view
        snapshotsView.innerHTML = '';
        
        // Check if we have snapshots
        if (this.snapshots.length === 0) {
            snapshotsView.innerHTML = '<p class="debug-panel-empty">No snapshots saved yet. Use "Save Snapshot" to save the current state.</p>';
            return;
        }
        
        // Create snapshots list container
        const snapshotsList = document.createElement('div');
        snapshotsList.className = 'debug-panel-snapshots-list';
        
        // Add snapshot entries
        this.snapshots.forEach((snapshot, index) => {
            const snapshotEntry = document.createElement('div');
            snapshotEntry.className = 'debug-panel-snapshot-entry';
            
            // Format timestamp
            const timestamp = new Date(snapshot.timestamp);
            const timeString = timestamp.toLocaleTimeString();
            const dateString = timestamp.toLocaleDateString();
            
            snapshotEntry.innerHTML = `
                <div class="snapshot-entry-header">
                    <span class="snapshot-entry-name">${snapshot.name}</span>
                    <span class="snapshot-entry-time">${dateString} ${timeString}</span>
                </div>
                <div class="snapshot-entry-actions">
                    <button class="snapshot-view-details" data-index="${index}">View Details</button>
                    <button class="snapshot-restore" data-index="${index}">Restore</button>
                    <button class="snapshot-delete" data-index="${index}">Delete</button>
                </div>
            `;
            
            snapshotsList.appendChild(snapshotEntry);
        });
        
        snapshotsView.appendChild(snapshotsList);
        
        // Add event listeners for snapshot entry actions
        document.querySelectorAll('.snapshot-view-details').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                this.viewSnapshotDetails(index);
            });
        });
        
        document.querySelectorAll('.snapshot-restore').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                this.restoreSnapshot(index);
            });
        });
        
        document.querySelectorAll('.snapshot-delete').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                this.deleteSnapshot(index);
            });
        });
    }
    
    /**
     * Create a recursive state tree visualization
     * @param {Object} obj - Object or sub-object to visualize
     * @param {String} path - Current path in the state (for nested objects)
     * @param {String} filter - Optional filter text to highlight matching properties
     * @returns {HTMLElement} - DOM element representing the state tree
     */
    createStateTree(obj, path = '', filter = '') {
        // Create container for this level
        const container = document.createElement('div');
        container.className = 'state-tree-container';
        
        if (!obj || typeof obj !== 'object') {
            return container;
        }
        
        // Sort keys for consistent display
        const keys = Object.keys(obj).sort();
        
        // Process each property in the object
        keys.forEach(key => {
            const value = obj[key];
            const currentPath = path ? `${path}.${key}` : key;
            const matches = !filter || currentPath.toLowerCase().includes(filter.toLowerCase());
            
            // Create row for this property
            const row = document.createElement('div');
            row.className = 'state-tree-row';
            if (matches) row.classList.add('highlight-match');
            
            // Create property name element
            const keyElement = document.createElement('div');
            keyElement.className = 'state-key';
            keyElement.textContent = key;
            
            // Create property value container
            const valueContainer = document.createElement('div');
            valueContainer.className = 'state-value-container';
            
            // Different handling based on value type
            if (value === null) {
                // Handle null
                valueContainer.innerHTML = '<span class="state-value state-null">null</span>';
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                // Handle nested objects
                const objectCount = Object.keys(value).length;
                const isExpanded = this.expandedPaths.has(currentPath);
                
                const expanderButton = document.createElement('button');
                expanderButton.className = 'state-expander';
                expanderButton.textContent = isExpanded ? '▼' : '►';
                expanderButton.setAttribute('data-path', currentPath);
                
                expanderButton.addEventListener('click', () => {
                    if (this.expandedPaths.has(currentPath)) {
                        this.expandedPaths.delete(currentPath);
                    } else {
                        this.expandedPaths.add(currentPath);
                    }
                    this.updateStateView();
                });
                
                const objectPreview = document.createElement('span');
                objectPreview.className = 'state-preview';
                objectPreview.textContent = `Object (${objectCount} properties)`;
                
                valueContainer.appendChild(expanderButton);
                valueContainer.appendChild(objectPreview);
                
                // If expanded, add the child properties
                if (isExpanded) {
                    const childTree = this.createStateTree(value, currentPath, filter);
                    childTree.className = 'state-tree-children';
                    row.appendChild(keyElement);
                    row.appendChild(valueContainer);
                    container.appendChild(row);
                    container.appendChild(childTree);
                    return;
                }
            } else if (Array.isArray(value)) {
                // Handle arrays
                const isExpanded = this.expandedPaths.has(currentPath);
                
                const expanderButton = document.createElement('button');
                expanderButton.className = 'state-expander';
                expanderButton.textContent = isExpanded ? '▼' : '►';
                expanderButton.setAttribute('data-path', currentPath);
                
                expanderButton.addEventListener('click', () => {
                    if (this.expandedPaths.has(currentPath)) {
                        this.expandedPaths.delete(currentPath);
                    } else {
                        this.expandedPaths.add(currentPath);
                    }
                    this.updateStateView();
                });
                
                const arrayPreview = document.createElement('span');
                arrayPreview.className = 'state-preview';
                arrayPreview.textContent = `Array (${value.length} items)`;
                
                valueContainer.appendChild(expanderButton);
                valueContainer.appendChild(arrayPreview);
                
                // If expanded, add array items
                if (isExpanded) {
                    const arrayContainer = document.createElement('div');
                    arrayContainer.className = 'state-tree-children';
                    
                    value.forEach((item, index) => {
                        const itemRow = document.createElement('div');
                        itemRow.className = 'state-tree-row';
                        
                        const indexElement = document.createElement('div');
                        indexElement.className = 'state-key';
                        indexElement.textContent = `[${index}]`;
                        
                        const itemValueContainer = document.createElement('div');
                        itemValueContainer.className = 'state-value-container';
                        
                        if (typeof item === 'object' && item !== null) {
                            // For objects in arrays, create a subtree
                            const childPath = `${currentPath}[${index}]`;
                            const isItemExpanded = this.expandedPaths.has(childPath);
                            
                            const itemExpanderButton = document.createElement('button');
                            itemExpanderButton.className = 'state-expander';
                            itemExpanderButton.textContent = isItemExpanded ? '▼' : '►';
                            itemExpanderButton.setAttribute('data-path', childPath);
                            
                            itemExpanderButton.addEventListener('click', () => {
                                if (this.expandedPaths.has(childPath)) {
                                    this.expandedPaths.delete(childPath);
                                } else {
                                    this.expandedPaths.add(childPath);
                                }
                                this.updateStateView();
                            });
                            
                            const objectPreview = document.createElement('span');
                            objectPreview.className = 'state-preview';
                            
                            if (Array.isArray(item)) {
                                objectPreview.textContent = `Array (${item.length} items)`;
                            } else {
                                objectPreview.textContent = `Object (${Object.keys(item).length} properties)`;
                            }
                            
                            itemValueContainer.appendChild(itemExpanderButton);
                            itemValueContainer.appendChild(objectPreview);
                            
                            itemRow.appendChild(indexElement);
                            itemRow.appendChild(itemValueContainer);
                            arrayContainer.appendChild(itemRow);
                            
                            if (isItemExpanded) {
                                const childTree = this.createStateTree(item, childPath, filter);
                                childTree.className = 'state-tree-children';
                                arrayContainer.appendChild(childTree);
                            }
                        } else {
                            // For primitives in arrays, show the value directly
                            const itemValue = this.formatPrimitiveValue(item);
                            itemValueContainer.appendChild(itemValue);
                            
                            itemRow.appendChild(indexElement);
                            itemRow.appendChild(itemValueContainer);
                            arrayContainer.appendChild(itemRow);
                        }
                    });
                    
                    row.appendChild(keyElement);
                    row.appendChild(valueContainer);
                    container.appendChild(row);
                    container.appendChild(arrayContainer);
                    return;
                }
            } else {
                // Handle primitive values
                const valueElement = this.formatPrimitiveValue(value);
                valueContainer.appendChild(valueElement);
            }
            
            row.appendChild(keyElement);
            row.appendChild(valueContainer);
            container.appendChild(row);
        });
        
        return container;
    }
    
    /**
     * Format a primitive value for display
     * @param {*} value - The primitive value to format
     * @returns {HTMLElement} - Formatted element for the value
     */
    formatPrimitiveValue(value) {
        const valueElement = document.createElement('span');
        valueElement.className = 'state-value';
        
        if (value === undefined) {
            valueElement.textContent = 'undefined';
            valueElement.classList.add('state-undefined');
        } else if (value === null) {
            valueElement.textContent = 'null';
            valueElement.classList.add('state-null');
        } else if (typeof value === 'boolean') {
            valueElement.textContent = value.toString();
            valueElement.classList.add('state-boolean');
        } else if (typeof value === 'number') {
            valueElement.textContent = value.toString();
            valueElement.classList.add('state-number');
        } else if (typeof value === 'string') {
            valueElement.textContent = `"${value}"`;
            valueElement.classList.add('state-string');
        } else if (typeof value === 'function') {
            valueElement.textContent = 'function() { ... }';
            valueElement.classList.add('state-function');
        } else {
            valueElement.textContent = String(value);
        }
        
        return valueElement;
    }
    
    /**
     * Create a snapshot of the current state
     */
    createSnapshot() {
        // Ask for a name
        const name = prompt('Enter a name for this snapshot:', `Snapshot ${this.snapshots.length + 1}`);
        if (!name) return;
        
        // Create and save the snapshot
        const snapshot = {
            name,
            timestamp: Date.now(),
            state: this.stateManager.getState()
        };
        
        this.snapshots.push(snapshot);
        
        // If snapshots tab is visible, update it
        if (this.isVisible && this.selectedTab === 'snapshots') {
            this.updateSnapshotsView();
        }
    }
    
    /**
     * View details of a snapshot
     * @param {number} index - Index of the snapshot
     */
    viewSnapshotDetails(index) {
        const snapshot = this.snapshots[index];
        if (!snapshot) return;
        
        // Create a modal for viewing snapshot details
        const modal = document.createElement('div');
        modal.className = 'debug-panel-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'debug-panel-modal-content';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'debug-panel-modal-header';
        modalHeader.innerHTML = `
            <h3>Snapshot Details: ${snapshot.name}</h3>
            <button class="debug-panel-modal-close">×</button>
        `;
        
        const snapshotDate = new Date(snapshot.timestamp);
        const dateStr = snapshotDate.toLocaleString();
        
        const modalInfo = document.createElement('div');
        modalInfo.className = 'debug-panel-modal-info';
        modalInfo.innerHTML = `<p>Created on: ${dateStr}</p>`;
        
        const modalStateView = document.createElement('div');
        modalStateView.className = 'debug-panel-modal-state-view';
        
        // Create a tree view of the snapshot state
        const stateTree = this.createStateTree(snapshot.state);
        modalStateView.appendChild(stateTree);
        
        const modalFooter = document.createElement('div');
        modalFooter.className = 'debug-panel-modal-footer';
        modalFooter.innerHTML = `
            <button class="debug-panel-modal-restore" data-index="${index}">Restore This Snapshot</button>
            <button class="debug-panel-modal-close-btn">Close</button>
        `;
        
        // Assemble the modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalInfo);
        modalContent.appendChild(modalStateView);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);
        
        // Add the modal to the document
        document.body.appendChild(modal);
        
        // Set up event listeners
        modal.querySelector('.debug-panel-modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.debug-panel-modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.debug-panel-modal-restore').addEventListener('click', () => {
            this.restoreSnapshot(index);
            document.body.removeChild(modal);
        });
    }
    
    /**
     * Restore a snapshot to current state
     * @param {number} index - Index of the snapshot
     */
    restoreSnapshot(index) {
        const snapshot = this.snapshots[index];
        if (!snapshot) return;
        
        // Confirm before restoring
        if (confirm(`Are you sure you want to restore the snapshot "${snapshot.name}"? This will replace your current state.`)) {
            // Preserve debug mode setting
            const debug = this.stateManager.state.debug;
            
            // Restore the state
            this.stateManager.updateState(snapshot.state, 'DebugPanel.restoreSnapshot');
            
            // Make sure debug mode stays enabled
            this.stateManager.state.debug = debug;
            
            // Update UI
            this.updateStateView();
        }
    }
    
    /**
     * Delete a snapshot
     * @param {number} index - Index of the snapshot
     */
    deleteSnapshot(index) {
        const snapshot = this.snapshots[index];
        if (!snapshot) return;
        
        // Confirm before deleting
        if (confirm(`Are you sure you want to delete the snapshot "${snapshot.name}"?`)) {
            this.snapshots.splice(index, 1);
            this.updateSnapshotsView();
        }
    }
    
    /**
     * View details of a history entry
     * @param {number} index - Index in the state history
     */
    viewHistoryDetails(index) {
        const historyEntry = this.stateManager.stateHistory[index];
        if (!historyEntry) return;
        
        // Create a modal for viewing history details
        const modal = document.createElement('div');
        modal.className = 'debug-panel-modal';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'debug-panel-modal-content';
        
        // Create the header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'debug-panel-modal-header';
        
        const entryDate = new Date(historyEntry.timestamp);
        const dateStr = entryDate.toLocaleString();
        
        modalHeader.innerHTML = `
            <h3>State Change Details</h3>
            <button class="debug-panel-modal-close">×</button>
        `;
        
        // Create the info section
        const modalInfo = document.createElement('div');
        modalInfo.className = 'debug-panel-modal-info';
        modalInfo.innerHTML = `
            <p><strong>Timestamp:</strong> ${dateStr}</p>
            <p><strong>Source:</strong> ${historyEntry.source}</p>
            <p><strong>Duration:</strong> ${historyEntry.duration}ms</p>
        `;
        
        // Create the changes section
        const changesContainer = document.createElement('div');
        changesContainer.className = 'debug-panel-changes';
        
        const changesHeader = document.createElement('h4');
        changesHeader.textContent = 'Changes:';
        changesContainer.appendChild(changesHeader);
        
        const changesList = document.createElement('div');
        changesList.className = 'debug-panel-changes-list';
        
        // Add each changed property
        Object.entries(historyEntry.changes).forEach(([path, change]) => {
            const changeEntry = document.createElement('div');
            changeEntry.className = 'debug-panel-change-entry';
            
            let fromValue = change.from === undefined ? 'undefined' : JSON.stringify(change.from);
            let toValue = change.to === undefined ? 'undefined' : JSON.stringify(change.to);
            
            changeEntry.innerHTML = `
                <div class="change-path">${path}</div>
                <div class="change-details">
                    <div class="change-from">From: ${fromValue}</div>
                    <div class="change-to">To: ${toValue}</div>
                </div>
            `;
            
            changesList.appendChild(changeEntry);
        });
        
        changesContainer.appendChild(changesList);
        
        // Create the state section
        const stateContainer = document.createElement('div');
        stateContainer.className = 'debug-panel-modal-state-container';
        
        const tabsContainer = document.createElement('div');
        tabsContainer.className = 'debug-panel-modal-tabs';
        tabsContainer.innerHTML = `
            <button class="debug-panel-modal-tab active" data-tab="previous">Previous State</button>
            <button class="debug-panel-modal-tab" data-tab="new">New State</button>
        `;
        
        const previousStateView = document.createElement('div');
        previousStateView.className = 'debug-panel-modal-tab-content active';
        previousStateView.id = 'tab-previous';
        
        const newStateView = document.createElement('div');
        newStateView.className = 'debug-panel-modal-tab-content';
        newStateView.id = 'tab-new';
        newStateView.style.display = 'none';
        
        // Add state trees
        const previousStateTree = this.createStateTree(historyEntry.previousState);
        previousStateView.appendChild(previousStateTree);
        
        const newStateTree = this.createStateTree(historyEntry.newState);
        newStateView.appendChild(newStateTree);
        
        stateContainer.appendChild(tabsContainer);
        stateContainer.appendChild(previousStateView);
        stateContainer.appendChild(newStateView);
        
        // Create footer
        const modalFooter = document.createElement('div');
        modalFooter.className = 'debug-panel-modal-footer';
        modalFooter.innerHTML = `
            <button class="debug-panel-modal-restore" data-index="${index}">Restore Previous State</button>
            <button class="debug-panel-modal-close-btn">Close</button>
        `;
        
        // Assemble the modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalInfo);
        modalContent.appendChild(changesContainer);
        modalContent.appendChild(stateContainer);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);
        
        // Add the modal to the document
        document.body.appendChild(modal);
        
        // Set up event listeners
        modal.querySelector('.debug-panel-modal-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.debug-panel-modal-close-btn').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.debug-panel-modal-restore').addEventListener('click', () => {
            this.restoreHistoryState(index);
            document.body.removeChild(modal);
        });
        
        // Tab switching
        modal.querySelectorAll('.debug-panel-modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-tab');
                
                // Update tab buttons
                modal.querySelectorAll('.debug-panel-modal-tab').forEach(t => {
                    t.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update tab contents
                modal.querySelectorAll('.debug-panel-modal-tab-content').forEach(c => {
                    c.style.display = 'none';
                });
                
                const tabContent = modal.querySelector(`#tab-${tabId}`);
                if (tabContent) {
                    tabContent.style.display = 'block';
                }
            });
        });
    }
    
    /**
     * Restore a previous state from history
     * @param {number} index - Index in the state history
     */
    restoreHistoryState(index) {
        const historyEntry = this.stateManager.stateHistory[index];
        if (!historyEntry) return;
        
        // Confirm before restoring
        if (confirm('Are you sure you want to restore this previous state? This will replace your current state.')) {
            // Preserve debug mode setting
            const debug = this.stateManager.state.debug;
            
            // Restore the state
            this.stateManager.updateState(historyEntry.previousState, 'DebugPanel.restoreHistoryState');
            
            // Make sure debug mode stays enabled
            this.stateManager.state.debug = debug;
            
            // Update UI
            this.updateStateView();
        }
    }
    
    /**
     * Reset the state to default values
     */
    resetState() {
        if (confirm('Are you sure you want to reset the state to default values? This will clear all customizations.')) {
            // Preserve debug mode setting
            const debug = this.stateManager.state.debug;
            
            // Create a new StateManager to get default state
            const tempStateManager = new StateManager();
            const defaultState = tempStateManager.getState();
            
            // Reset state but keep debug mode
            this.stateManager.updateState(defaultState, 'DebugPanel.resetState');
            this.stateManager.state.debug = debug;
            
            // Update UI
            this.updateStateView();
        }
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        const newDebugMode = !this.stateManager.state.debug;
        this.stateManager.setDebugMode(newDebugMode);
        
        // Update the button text
        const toggleButton = document.getElementById('debug-panel-toggle-debug');
        if (toggleButton) {
            toggleButton.textContent = newDebugMode ? 'Disable Debug Mode' : 'Enable Debug Mode';
        }
    }
    
    /**
     * Observer method called when state changes
     */
    onStateUpdate() {
        // Only update if the panel is visible
        if (!this.isVisible) return;
        
        // Update the appropriate view based on the selected tab
        if (this.selectedTab === 'current') {
            this.updateStateView();
        }
    }
}