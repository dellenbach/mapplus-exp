/**
 * tnet-splitscreen.js
 * Split-screen functionality for layer comparison
 * 
 * Enables side-by-side map view with synchronized navigation
 * and independent layer selection for each map panel.
 */

(function() {
    'use strict';

    var SplitScreen = {
        enabled: false,
        map2: null,
        originalMapContainer: null,
        dividerPosition: 50, // percentage
        isDragging: false,

        /**
         * Initialize split-screen mode
         */
        init: function() {
            console.log('[SplitScreen] Initializing...');
            
            // Create the split-screen container structure
            this.createSplitLayout();
            
            // Initialize the second map
            this.initializeMap2();
            
            // Setup synchronization between maps
            this.setupSynchronization();
            
            // Setup resizable divider
            this.setupResizer();
            
            this.enabled = true;
            console.log('[SplitScreen] Initialized successfully');
        },

        /**
         * Create the HTML structure for split-screen layout
         */
        createSplitLayout: function() {
            var mapContainer = document.getElementById('mapContainer');
            var originalMap = document.getElementById('map');
            
            // Store original container
            this.originalMapContainer = mapContainer;
            
            // Create wrapper for split view
            var splitWrapper = document.createElement('div');
            splitWrapper.id = 'split-wrapper';
            splitWrapper.style.cssText = 'display: flex; width: 100%; height: 100%; position: relative;';
            
            // Create left panel for original map
            var leftPanel = document.createElement('div');
            leftPanel.id = 'split-panel-left';
            leftPanel.style.cssText = 'flex: 1; position: relative; overflow: hidden;';
            
            // Create divider
            var divider = document.createElement('div');
            divider.id = 'split-divider';
            divider.style.cssText = 'width: 4px; background: #2c5f6f; cursor: col-resize; position: relative; z-index: 1000; box-shadow: 0 0 5px rgba(0,0,0,0.3);';
            divider.innerHTML = '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 40px; background: rgba(44, 95, 111, 0.8); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">⋮</div>';
            
            // Create right panel for second map
            var rightPanel = document.createElement('div');
            rightPanel.id = 'split-panel-right';
            rightPanel.style.cssText = 'flex: 1; position: relative; overflow: hidden; background: #f0f0f0;';
            
            // Create second map container
            var map2Container = document.createElement('div');
            map2Container.id = 'map2';
            map2Container.className = 'map-cont';
            map2Container.style.cssText = 'width: 100%; height: 100%;';
            
            // Create label for map panels
            var leftLabel = document.createElement('div');
            leftLabel.style.cssText = 'position: absolute; top: 80px; left: 10px; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
            leftLabel.textContent = 'Karte A';
            
            var rightLabel = document.createElement('div');
            rightLabel.style.cssText = 'position: absolute; top: 80px; left: 10px; background: rgba(255,255,255,0.9); padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
            rightLabel.textContent = 'Karte B';
            
            // Assemble the structure
            leftPanel.appendChild(leftLabel);
            rightPanel.appendChild(rightLabel);
            rightPanel.appendChild(map2Container);
            
            splitWrapper.appendChild(leftPanel);
            splitWrapper.appendChild(divider);
            splitWrapper.appendChild(rightPanel);
            
            // Move original map to left panel
            leftPanel.appendChild(originalMap);
            
            // Insert split wrapper into map container
            mapContainer.appendChild(splitWrapper);
        },

        /**
         * Initialize the second map instance
         */
        initializeMap2: function() {
            var self = this;
            
            // Wait for the main map to be initialized
            var checkMainMap = setInterval(function() {
                if (typeof njs !== 'undefined' && 
                    njs.AppManager && 
                    njs.AppManager.Maps && 
                    njs.AppManager.Maps.main && 
                    njs.AppManager.Maps.main.mapObj) {
                    
                    clearInterval(checkMainMap);
                    
                    var mainMap = njs.AppManager.Maps.main.mapObj;
                    var mainView = mainMap.getView();
                    
                    // Create second map with same configuration
                    self.map2 = new ol.Map({
                        target: 'map2',
                        view: new ol.View({
                            center: mainView.getCenter(),
                            zoom: mainView.getZoom(),
                            projection: mainView.getProjection(),
                            extent: mainView.getProjection().getExtent()
                        }),
                        controls: ol.control.defaults({
                            attribution: false,
                            zoom: true
                        })
                    });
                    
                    // Clone layers from main map
                    mainMap.getLayers().forEach(function(layer) {
                        if (layer instanceof ol.layer.Layer) {
                            var clonedLayer = self.cloneLayer(layer);
                            if (clonedLayer) {
                                self.map2.addLayer(clonedLayer);
                            }
                        }
                    });
                    
                    console.log('[SplitScreen] Second map initialized');
                }
            }, 100);
        },

        /**
         * Clone a layer for the second map
         */
        cloneLayer: function(layer) {
            var source = layer.getSource();
            var newSource = null;
            
            if (source instanceof ol.source.TileWMS) {
                newSource = new ol.source.TileWMS({
                    url: source.getUrls()[0],
                    params: source.getParams(),
                    serverType: source.getServerType(),
                    crossOrigin: 'anonymous'
                });
            } else if (source instanceof ol.source.ImageWMS) {
                newSource = new ol.source.ImageWMS({
                    url: source.getUrl(),
                    params: source.getParams(),
                    serverType: source.getServerType(),
                    crossOrigin: 'anonymous'
                });
            } else if (source instanceof ol.source.XYZ) {
                newSource = new ol.source.XYZ({
                    url: source.getUrls()[0],
                    crossOrigin: 'anonymous'
                });
            } else if (source instanceof ol.source.OSM) {
                newSource = new ol.source.OSM();
            } else {
                // For other source types, try to copy basic properties
                console.warn('[SplitScreen] Unknown layer source type, skipping:', source);
                return null;
            }
            
            var newLayer;
            if (layer instanceof ol.layer.Tile) {
                newLayer = new ol.layer.Tile({
                    source: newSource,
                    opacity: layer.getOpacity(),
                    visible: layer.getVisible(),
                    zIndex: layer.getZIndex()
                });
            } else if (layer instanceof ol.layer.Image) {
                newLayer = new ol.layer.Image({
                    source: newSource,
                    opacity: layer.getOpacity(),
                    visible: layer.getVisible(),
                    zIndex: layer.getZIndex()
                });
            }
            
            return newLayer;
        },

        /**
         * Setup synchronization between the two maps
         */
        setupSynchronization: function() {
            var self = this;
            
            var syncTimeout;
            
            // Sync from main map to map2
            var checkMainMap = setInterval(function() {
                if (typeof njs !== 'undefined' && 
                    njs.AppManager && 
                    njs.AppManager.Maps && 
                    njs.AppManager.Maps.main && 
                    njs.AppManager.Maps.main.mapObj) {
                    
                    clearInterval(checkMainMap);
                    
                    var mainMap = njs.AppManager.Maps.main.mapObj;
                    var mainView = mainMap.getView();
                    
                    mainView.on('change:center', function() {
                        if (self.map2 && !self.map2.syncing) {
                            clearTimeout(syncTimeout);
                            syncTimeout = setTimeout(function() {
                                mainMap.syncing = true;
                                self.map2.getView().setCenter(mainView.getCenter());
                                mainMap.syncing = false;
                            }, 50);
                        }
                    });
                    
                    mainView.on('change:resolution', function() {
                        if (self.map2 && !self.map2.syncing) {
                            clearTimeout(syncTimeout);
                            syncTimeout = setTimeout(function() {
                                mainMap.syncing = true;
                                self.map2.getView().setResolution(mainView.getResolution());
                                mainMap.syncing = false;
                            }, 50);
                        }
                    });
                }
            }, 100);
            
            // Sync from map2 to main map
            if (this.map2) {
                var map2View = this.map2.getView();
                
                map2View.on('change:center', function() {
                    if (njs.AppManager.Maps.main && !njs.AppManager.Maps.main.mapObj.syncing) {
                        clearTimeout(syncTimeout);
                        syncTimeout = setTimeout(function() {
                            self.map2.syncing = true;
                            njs.AppManager.Maps.main.mapObj.getView().setCenter(map2View.getCenter());
                            self.map2.syncing = false;
                        }, 50);
                    }
                });
                
                map2View.on('change:resolution', function() {
                    if (njs.AppManager.Maps.main && !njs.AppManager.Maps.main.mapObj.syncing) {
                        clearTimeout(syncTimeout);
                        syncTimeout = setTimeout(function() {
                            self.map2.syncing = true;
                            njs.AppManager.Maps.main.mapObj.getView().setResolution(map2View.getResolution());
                            self.map2.syncing = false;
                        }, 50);
                    }
                });
            }
        },

        /**
         * Setup resizable divider between the two map panels
         */
        setupResizer: function() {
            var self = this;
            var divider = document.getElementById('split-divider');
            var leftPanel = document.getElementById('split-panel-left');
            var rightPanel = document.getElementById('split-panel-right');
            
            if (!divider || !leftPanel || !rightPanel) return;
            
            divider.addEventListener('mousedown', function(e) {
                self.isDragging = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });
            
            document.addEventListener('mousemove', function(e) {
                if (!self.isDragging) return;
                
                var container = document.getElementById('split-wrapper');
                var containerRect = container.getBoundingClientRect();
                var offsetX = e.clientX - containerRect.left;
                var percentage = (offsetX / containerRect.width) * 100;
                
                // Limit to 20%-80%
                percentage = Math.max(20, Math.min(80, percentage));
                
                leftPanel.style.flex = percentage;
                rightPanel.style.flex = (100 - percentage);
                
                // Update maps
                if (njs.AppManager.Maps.main && njs.AppManager.Maps.main.mapObj) {
                    njs.AppManager.Maps.main.mapObj.updateSize();
                }
                if (self.map2) {
                    self.map2.updateSize();
                }
            });
            
            document.addEventListener('mouseup', function() {
                if (self.isDragging) {
                    self.isDragging = false;
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                }
            });
        },

        /**
         * Disable split-screen mode
         */
        disable: function() {
            if (!this.enabled) return;
            
            console.log('[SplitScreen] Disabling...');
            
            var mapContainer = document.getElementById('mapContainer');
            var splitWrapper = document.getElementById('split-wrapper');
            var originalMap = document.getElementById('map');
            
            if (splitWrapper && mapContainer) {
                // Remove the split wrapper and restore original map
                mapContainer.removeChild(splitWrapper);
                mapContainer.appendChild(originalMap);
                
                // Destroy second map
                if (this.map2) {
                    this.map2.setTarget(null);
                    this.map2 = null;
                }
                
                // Update main map size
                if (njs.AppManager.Maps.main && njs.AppManager.Maps.main.mapObj) {
                    setTimeout(function() {
                        njs.AppManager.Maps.main.mapObj.updateSize();
                    }, 100);
                }
            }
            
            this.enabled = false;
            console.log('[SplitScreen] Disabled');
        },

        /**
         * Toggle split-screen mode
         */
        toggle: function() {
            var btn = document.getElementById('split-screen-btn');
            
            if (this.enabled) {
                this.disable();
                if (btn) btn.classList.remove('active');
            } else {
                this.init();
                if (btn) btn.classList.add('active');
            }
        }
    };

    // Export to global scope
    window.TnetSplitScreen = SplitScreen;
})();

/**
 * Global function to toggle split-screen mode
 */
function toggleSplitScreen() {
    if (window.TnetSplitScreen) {
        window.TnetSplitScreen.toggle();
    } else {
        console.error('[SplitScreen] Module not loaded');
    }
}
