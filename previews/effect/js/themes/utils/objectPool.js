/**
 * Object Pool Utility
 * 
 * This utility provides a generic object pooling system to reduce garbage collection
 * by reusing objects instead of creating new ones each time. This is especially useful
 * for particle systems and other effects that create many short-lived objects.
 * 
 * Features:
 * - Reduces memory allocation and garbage collection
 * - Improves performance for frequently created/destroyed objects
 * - Configurable pool size and growth behavior
 * - Custom creation and reset functions
 */
const ObjectPool = {    /**
     * Create a new object pool
     * 
     * @param {Function} createFn - Function to create a new object
     * @param {Function} resetFn - Function to reset an object for reuse
     * @param {number} initialSize - Initial size of the pool (optional)
     * @param {number} maxSize - Maximum size of the pool (optional, 0 for unlimited)
     * @returns {Object} The object pool
     * @throws {Error} If invalid parameters are provided
     */
    create(createFn, resetFn, initialSize = 20, maxSize = 100) {
        // Validate parameters
        if (typeof createFn !== 'function') {
            throw new Error('ObjectPool: createFn must be a function');
        }
        
        if (typeof resetFn !== 'function') {
            throw new Error('ObjectPool: resetFn must be a function');
        }
        
        if (typeof initialSize !== 'number' || initialSize < 0) {
            throw new Error('ObjectPool: initialSize must be a non-negative number');
        }
        
        if (typeof maxSize !== 'number' || (maxSize !== 0 && maxSize < initialSize)) {
            throw new Error('ObjectPool: maxSize must be 0 (unlimited) or greater than initialSize');
        }
        const pool = {
            _available: [],
            _inUse: new Set(),
            _createFn: createFn,
            _resetFn: resetFn,
            _maxSize: maxSize,
            _stats: {
                created: 0,
                reused: 0,
                returned: 0,
                currentSize: 0,
                maxSizeReached: 0
            },
            
            /**
             * Get an object from the pool or create a new one
             * 
             * @param {...any} args - Arguments to pass to the create or reset function
             * @returns {Object} The obtained object
             */
            get(...args) {
                let obj;
                
                if (this._available.length > 0) {
                    obj = this._available.pop();
                    this._resetFn(obj, ...args);
                    this._stats.reused++;
                } else {
                    obj = this._createFn(...args);
                    this._stats.created++;
                    this._stats.currentSize++;
                    this._stats.maxSizeReached = Math.max(this._stats.maxSizeReached, this._stats.currentSize);
                }
                
                this._inUse.add(obj);
                return obj;
            },
            
            /**
             * Return an object to the pool
             * 
             * @param {Object} obj - The object to return to the pool
             */
            release(obj) {
                if (this._inUse.has(obj)) {
                    this._inUse.delete(obj);
                    
                    // Only add to available if we're under the max size
                    if (this._maxSize === 0 || this._available.length < this._maxSize) {
                        this._available.push(obj);
                    } else {
                        // We're at max capacity, let the object be garbage collected
                        this._stats.currentSize--;
                    }
                    
                    this._stats.returned++;
                }
            },
            
            /**
             * Get the current stats for this pool
             * 
             * @returns {Object} Statistics about the pool usage
             */
            getStats() {
                return {
                    ...this._stats,
                    available: this._available.length,
                    inUse: this._inUse.size
                };
            },
            
            /**
             * Clear the pool and release all objects
             */
            clear() {
                this._available = [];
                this._inUse.clear();
                this._stats.currentSize = 0;
            }
        };
        
        // Pre-populate the pool
        for (let i = 0; i < initialSize; i++) {
            const obj = createFn();
            pool._available.push(obj);
            pool._stats.created++;
            pool._stats.currentSize++;
        }
        
        pool._stats.maxSizeReached = pool._stats.currentSize;
        
        return pool;
    }
};
