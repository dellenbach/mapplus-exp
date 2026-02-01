/**
 * tnet_toc.js
 * Table of Contents, Accordion und Tab-Manipulation für TNet
 * 
 * Version: 2026-02-01
 */

(function() {
  'use strict';

  // ===========================================================================
  // TABS TO ACCORDION CONVERTER (dijit TabContainer)
  // ===========================================================================

  var Tabs2Accordion = {
    // Extrahiere Tab-Info (Label + Icon)
    getTabInfo: function(tabContainer, index) {
      var tabs = tabContainer.querySelectorAll('.dijitTabListWrapper [role="tab"]');
      var tab = tabs[index];
      var info = { label: 'Kategorie ' + (index + 1), iconClass: null };
      
      if (tab) {
        info.label = tab.getAttribute('title') || tab.textContent.trim() || info.label;
        var iconEl = tab.querySelector('.dijitIcon, .dijitTabButtonIcon');
        if (iconEl) {
          var classes = Array.from(iconEl.classList).filter(function(c) {
            return c.indexOf('njsCategory') !== -1 || c.indexOf('Icon') !== -1;
          });
          if (classes.length) info.iconClass = classes.join(' ');
        }
      }
      return info;
    },

    // Konvertiere einen TabContainer zu Accordion
    convert: function(tabContainer) {
      var self = this;
      if (tabContainer.dataset.tabs2accDone === 'true') return;
      
      var panelWrapper = tabContainer.querySelector('.dijitTabPaneWrapper');
      if (!panelWrapper) return;
      
      var panels = panelWrapper.querySelectorAll(':scope > .dijitTabContainerTopChildWrapper');
      if (!panels.length) return;

      tabContainer.classList.add('tabs2acc-converted');

      panels.forEach(function(panelWrap, idx) {
        if (panelWrap.previousElementSibling && 
            panelWrap.previousElementSibling.classList.contains('tabs2acc-header')) {
          return;
        }

        var info = self.getTabInfo(tabContainer, idx);
        
        // Header erstellen
        var header = document.createElement('div');
        header.className = 'tabs2acc-header';
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');
        
        // Pfeil
        var arrow = document.createElement('span');
        arrow.className = 'acc-arrow';
        arrow.textContent = '▶';
        header.appendChild(arrow);
        
        // Icon falls vorhanden
        if (info.iconClass) {
          var icon = document.createElement('span');
          icon.className = 'acc-icon dijitIcon ' + info.iconClass;
          header.appendChild(icon);
        }
        
        // Label
        var label = document.createElement('span');
        label.textContent = info.label;
        header.appendChild(label);

        // Panel vorbereiten
        panelWrap.classList.add('tabs2acc-panel');
        panelWrap.classList.remove('dijitVisible', 'dijitHidden');
        panelWrap.style.display = 'none';

        // Toggle-Funktion
        function toggle() {
          var isOpen = header.classList.contains('is-open');
          header.classList.toggle('is-open', !isOpen);
          panelWrap.classList.toggle('is-open', !isOpen);
          panelWrap.style.display = isOpen ? 'none' : 'block';
          header.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        }

        header.addEventListener('click', toggle);
        header.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });

        panelWrapper.insertBefore(header, panelWrap);
      });

      tabContainer.dataset.tabs2accDone = 'true';
    },

    // Finde und konvertiere alle TabContainer
    processAll: function() {
      var self = this;
      var containers = document.querySelectorAll('.dijitTabContainer');
      containers.forEach(function(c) { self.convert(c); });
    },

    // Initialisierung
    init: function() {
      var self = this;
      var attempts = 0;
      var maxAttempts = 30;
      
      function tryConvert() {
        attempts++;
        var containers = document.querySelectorAll('.dijitTabContainer');
        if (containers.length > 0) {
          self.processAll();
        }
        if (attempts < maxAttempts) {
          setTimeout(tryConvert, 300);
        }
      }
      
      tryConvert();

      // MutationObserver für dynamisch hinzugefügte Container
      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function(mutations) {
          var shouldProcess = mutations.some(function(m) {
            return m.addedNodes.length > 0;
          });
          if (shouldProcess) self.processAll();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }
  };

  // ===========================================================================
  // TITLEPANES TO TABS CONVERTER (Kantons-Tabs)
  // ===========================================================================

  var TitlePane2Tabs = {
    icons: {
      'Nidwalden': '/maps/tnet/resources/wappen_nidwalden.svg',
      'Obwalden': '/maps/tnet/resources/wappen_obwalden.svg',
      'Bund': '/maps/tnet/resources/wappen_bund.svg',
      'Weitere': '/maps/tnet/resources/icon_weitere.svg'
    },

    panes: [
      { id: 'tp_layer_menu', name: 'Nidwalden' },
      { id: 'tp_layer_menu2', name: 'Obwalden' },
      { id: 'tp_layer_menu3', name: 'Bund' },
      { id: 'tp_layer_menu4', name: 'Weitere' }
    ],

    convert: function() {
      var self = this;
      var container = document.getElementById('kantons_container');
      if (!container || container.dataset.tabified === 'true') return false;

      // Prüfen ob alle Panes existieren
      var allExist = this.panes.every(function(p) {
        return document.getElementById(p.id);
      });
      if (!allExist) return false;

      // Tab-Bar erstellen
      var tabBar = document.createElement('div');
      tabBar.id = 'kantons_tab_bar';

      this.panes.forEach(function(pane, index) {
        var tab = document.createElement('div');
        tab.className = 'kanton-tab' + (index === 0 ? ' active' : '');
        tab.dataset.target = pane.id;
        
        if (self.icons[pane.name]) {
          var img = document.createElement('img');
          img.src = self.icons[pane.name];
          img.alt = pane.name;
          tab.appendChild(img);
        }
        
        tab.title = pane.name;

        tab.addEventListener('click', function() {
          // Alle Tabs deaktivieren
          tabBar.querySelectorAll('.kanton-tab').forEach(function(t) {
            t.classList.remove('active');
          });
          self.panes.forEach(function(p) {
            var el = document.getElementById(p.id);
            if (el) el.classList.remove('active-tab');
          });
          
          // Diesen Tab aktivieren
          tab.classList.add('active');
          var targetPane = document.getElementById(pane.id);
          if (targetPane) {
            targetPane.classList.add('active-tab');
            // TitlePane öffnen falls geschlossen
            if (typeof dijit !== 'undefined') {
              var widget = dijit.byId(pane.id);
              if (widget && !widget.get('open')) {
                widget.set('open', true);
              }
            }
          }
        });

        tabBar.appendChild(tab);
      });

      container.insertBefore(tabBar, container.firstChild);

      // Ersten Tab aktivieren
      var firstPane = document.getElementById(this.panes[0].id);
      if (firstPane) {
        firstPane.classList.add('active-tab');
      }
      
      // Widget öffnen
      function openFirstTab() {
        if (typeof dijit !== 'undefined') {
          var widget = dijit.byId(self.panes[0].id);
          if (widget) {
            widget.set('open', true);
            setTimeout(function() {
              widget.set('open', true);
              if (widget.resize) widget.resize();
            }, 200);
          }
        }
      }
      
      openFirstTab();
      setTimeout(openFirstTab, 500);
      setTimeout(openFirstTab, 1000);

      container.dataset.tabified = 'true';
      return true;
    },

    init: function() {
      var self = this;
      var attempts = 0;
      
      function tryConvert() {
        attempts++;
        if (self.convert() || attempts > 50) return;
        setTimeout(tryConvert, 200);
      }

      setTimeout(tryConvert, 1000);
    }
  };

  // ===========================================================================
  // TOC (Table of Contents) für Karten-Navigation
  // ===========================================================================
  
  var CONFIG = {
    // TOC Struktur: Gruppen mit Karten
    sections: [
      {
        id: 'nw',
        title: 'Nidwalden',
        icon: 'resources/wappen_nidwalden.svg',
        maps: []  // Wird dynamisch gefüllt oder aus JSON geladen
      },
      {
        id: 'ow',
        title: 'Obwalden',
        icon: 'resources/wappen_obwalden.svg',
        maps: []
      },
      {
        id: 'ch',
        title: 'Schweiz',
        icon: 'resources/wappen_bund.svg',
        maps: []
      }
    ],
    
    // Bookmarks-Datei für Kartenliste
    bookmarksUrl: 'map-bookmarks.json'
  };

  // ===========================================
  // State
  // ===========================================
  
  var state = {
    isOpen: false,
    activeMap: null,
    sections: {}
  };

  // ===========================================
  // DOM Helpers
  // ===========================================
  
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function createElement(tag, className, content) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (content) el.innerHTML = content;
    return el;
  }

  // ===========================================
  // TOC Rendering
  // ===========================================
  
  function renderTOC() {
    var toc = createElement('div', 'tnet-toc');
    toc.id = 'tnetToc';
    
    // Header
    var header = createElement('div', 'tnet-toc-header');
    header.innerHTML = 
      '<span class="tnet-toc-title">Karten</span>' +
      '<button class="tnet-toc-close" onclick="TnetTOC.close()">&times;</button>';
    toc.appendChild(header);
    
    // Sections
    CONFIG.sections.forEach(function(section) {
      toc.appendChild(renderSection(section));
    });
    
    document.body.appendChild(toc);
    
    // Toggle Button
    var toggle = createElement('button', 'tnet-toc-toggle');
    toggle.id = 'tnetTocToggle';
    toggle.innerHTML = '<span>☰</span> Karten';
    toggle.onclick = function() { TnetTOC.toggle(); };
    document.body.appendChild(toggle);
  }

  function renderSection(section) {
    var div = createElement('div', 'tnet-toc-section');
    div.dataset.sectionId = section.id;
    
    // Section Header
    var header = createElement('div', 'tnet-toc-section-header');
    header.innerHTML = 
      '<img src="' + section.icon + '" alt="">' +
      '<span>' + section.title + '</span>' +
      '<span class="tnet-toc-section-arrow">▶</span>';
    header.onclick = function() { toggleSection(section.id); };
    div.appendChild(header);
    
    // Items Container
    var items = createElement('div', 'tnet-toc-items');
    items.id = 'tnetTocItems_' + section.id;
    
    // Platzhalter falls keine Karten geladen
    if (section.maps.length === 0) {
      items.innerHTML = '<div class="tnet-toc-item" style="color:#999;font-style:italic;">Wird geladen...</div>';
    } else {
      section.maps.forEach(function(map) {
        items.appendChild(renderItem(map));
      });
    }
    
    div.appendChild(items);
    return div;
  }

  function renderItem(map) {
    var item = createElement('div', 'tnet-toc-item');
    item.textContent = map.title || map.name;
    item.dataset.mapId = map.id || map.name;
    item.onclick = function() { selectMap(map); };
    return item;
  }

  // ===========================================
  // TOC Actions
  // ===========================================
  
  function toggleSection(sectionId) {
    var section = $('[data-section-id="' + sectionId + '"]');
    if (section) {
      section.classList.toggle('open');
      state.sections[sectionId] = section.classList.contains('open');
    }
  }

  function selectMap(map) {
    state.activeMap = map.id || map.name;
    
    // Highlight active item
    $$('.tnet-toc-item').forEach(function(item) {
      item.classList.remove('active');
    });
    var activeItem = $('[data-map-id="' + state.activeMap + '"]');
    if (activeItem) activeItem.classList.add('active');
    
    // Navigate to map
    if (typeof window.TnetSetBookmark === 'function') {
      window.TnetSetBookmark(map.url || map.name);
    } else if (typeof window.reloadMap === 'function') {
      // Fallback
      console.log('[TOC] Map selected:', map);
    }
    
    // Close TOC on mobile
    if (window.innerWidth <= 600) {
      TnetTOC.close();
    }
  }

  // ===========================================
  // Public API
  // ===========================================
  
  window.TnetTOC = {
    init: function() {
      renderTOC();
      console.log('[TnetTOC] Initialized');
    },
    
    open: function() {
      var toc = $('#tnetToc');
      if (toc) {
        toc.classList.add('open');
        state.isOpen = true;
      }
    },
    
    close: function() {
      var toc = $('#tnetToc');
      if (toc) {
        toc.classList.remove('open');
        state.isOpen = false;
      }
    },
    
    toggle: function() {
      state.isOpen ? this.close() : this.open();
    },
    
    // Karten für eine Section setzen
    setMaps: function(sectionId, maps) {
      var section = CONFIG.sections.find(function(s) { return s.id === sectionId; });
      if (section) {
        section.maps = maps;
        var container = $('#tnetTocItems_' + sectionId);
        if (container) {
          container.innerHTML = '';
          maps.forEach(function(map) {
            container.appendChild(renderItem(map));
          });
        }
      }
    },
    
    // Bookmarks laden und TOC befüllen
    loadBookmarks: function(url) {
      url = url || CONFIG.bookmarksUrl;
      return fetch(url)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          console.log('[TnetTOC] Bookmarks loaded:', data);
          // TODO: Bookmarks nach Gruppen aufteilen und setMaps aufrufen
          return data;
        })
        .catch(function(err) {
          console.error('[TnetTOC] Failed to load bookmarks:', err);
        });
    }
  };

  // ===========================================================================
  // INITIALISIERUNG
  // ===========================================================================

  function initAll() {
    // Tabs zu Accordion konvertieren
    Tabs2Accordion.init();
    
    // TitlePanes zu Tabs konvertieren
    TitlePane2Tabs.init();
    
    console.log('[tnet_toc.js] Accordion/Tab-Konverter initialisiert');
  }

  // Auto-init wenn DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})();
