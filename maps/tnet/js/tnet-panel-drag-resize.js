/**
 * tnet-panel-drag-resize.js
 * Drag & Resize für das Spatial Query Panel
 * Muss NACH dem Panel-Element im DOM geladen werden
 */

(function() {
    // Panel verschiebbar machen
    var panel = document.getElementById('spatial-query-panel');
    var header = document.getElementById('spatial-query-header');
    
    if (!panel || !header) {
        console.error('Spatial Query Panel oder Header nicht gefunden!');
        return;
    }
    
    var isDragging = false;
    var startX, startY, startLeft, startTop;
    
    header.addEventListener('mousedown', function(e) {
        // Nicht draggen wenn auf Button geklickt
        if (e.target.closest('button')) return;
        if (window.isPanelDocked) return;
        
        isDragging = true;
        
        var rect = panel.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        
        panel.style.right = 'auto';
        panel.style.left = startLeft + 'px';
        panel.style.top = startTop + 'px';
        
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        
        panel.style.left = (startLeft + dx) + 'px';
        panel.style.top = (startTop + dy) + 'px';
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // ===== RESIZE FUNCTIONALITY =====
    var isResizing = false;
    var resizeDirection = '';
    var resizeStartX, resizeStartY, resizeStartWidth, resizeStartHeight, resizeStartLeft, resizeStartTop;
    
    // Resize-Handles
    var handles = {
        top: document.getElementById('spatial-query-resize-top'),
        left: document.getElementById('spatial-query-resize-left'),
        right: document.getElementById('spatial-query-resize-right'),
        bottom: document.getElementById('spatial-query-resize-bottom'),
        tl: document.getElementById('spatial-query-resize-corner-tl'),
        tr: document.getElementById('spatial-query-resize-corner-tr'),
        bl: document.getElementById('spatial-query-resize-corner-bl'),
        br: document.getElementById('spatial-query-resize-corner-br')
    };
    
    function startResize(e, direction) {
        if (window.isPanelDocked && direction !== 'top') return; // Im angedockten Modus nur oben
        
        isResizing = true;
        resizeDirection = direction;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        
        var rect = panel.getBoundingClientRect();
        resizeStartWidth = rect.width;
        resizeStartHeight = rect.height;
        resizeStartLeft = rect.left;
        resizeStartTop = rect.top;
        
        document.body.style.userSelect = 'none';
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Mousedown Handler für alle Handles
    if (handles.top) {
        handles.top.addEventListener('mousedown', function(e) { startResize(e, 'top'); });
    }
    if (handles.left) {
        handles.left.addEventListener('mousedown', function(e) { startResize(e, 'left'); });
    }
    if (handles.right) {
        handles.right.addEventListener('mousedown', function(e) { startResize(e, 'right'); });
    }
    if (handles.bottom) {
        handles.bottom.addEventListener('mousedown', function(e) { startResize(e, 'bottom'); });
    }
    if (handles.tl) {
        handles.tl.addEventListener('mousedown', function(e) { startResize(e, 'tl'); });
    }
    if (handles.tr) {
        handles.tr.addEventListener('mousedown', function(e) { startResize(e, 'tr'); });
    }
    if (handles.bl) {
        handles.bl.addEventListener('mousedown', function(e) { startResize(e, 'bl'); });
    }
    if (handles.br) {
        handles.br.addEventListener('mousedown', function(e) { startResize(e, 'br'); });
    }
    
    document.addEventListener('mousemove', function(e) {
        if (!isResizing) return;
        
        var dx = e.clientX - resizeStartX;
        var dy = e.clientY - resizeStartY;
        
        var newWidth = resizeStartWidth;
        var newHeight = resizeStartHeight;
        var newLeft = resizeStartLeft;
        var newTop = resizeStartTop;
        
        // Angedockt: nur Höhe ändern
        if (window.isPanelDocked) {
            newHeight = Math.max(150, Math.min(resizeStartHeight - dy, window.innerHeight - 100));
            panel.style.height = newHeight + 'px';
            if (window.updateFreepaneHeight) {
                window.updateFreepaneHeight();
            }
            return;
        }
        
        // Freischwebend: alle Richtungen
        switch(resizeDirection) {
            case 'top':
                newHeight = Math.max(200, resizeStartHeight - dy);
                newTop = resizeStartTop + (resizeStartHeight - newHeight);
                panel.style.height = newHeight + 'px';
                panel.style.top = newTop + 'px';
                break;
            case 'bottom':
                newHeight = Math.max(200, resizeStartHeight + dy);
                panel.style.height = newHeight + 'px';
                break;
            case 'left':
                newWidth = Math.max(300, resizeStartWidth - dx);
                newLeft = resizeStartLeft + (resizeStartWidth - newWidth);
                panel.style.width = newWidth + 'px';
                panel.style.left = newLeft + 'px';
                break;
            case 'right':
                newWidth = Math.max(300, resizeStartWidth + dx);
                panel.style.width = newWidth + 'px';
                break;
            case 'tl':
                newWidth = Math.max(300, resizeStartWidth - dx);
                newHeight = Math.max(200, resizeStartHeight - dy);
                newLeft = resizeStartLeft + (resizeStartWidth - newWidth);
                newTop = resizeStartTop + (resizeStartHeight - newHeight);
                panel.style.width = newWidth + 'px';
                panel.style.height = newHeight + 'px';
                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
                break;
            case 'tr':
                newWidth = Math.max(300, resizeStartWidth + dx);
                newHeight = Math.max(200, resizeStartHeight - dy);
                newTop = resizeStartTop + (resizeStartHeight - newHeight);
                panel.style.width = newWidth + 'px';
                panel.style.height = newHeight + 'px';
                panel.style.top = newTop + 'px';
                break;
            case 'bl':
                newWidth = Math.max(300, resizeStartWidth - dx);
                newHeight = Math.max(200, resizeStartHeight + dy);
                newLeft = resizeStartLeft + (resizeStartWidth - newWidth);
                panel.style.width = newWidth + 'px';
                panel.style.height = newHeight + 'px';
                panel.style.left = newLeft + 'px';
                break;
            case 'br':
                newWidth = Math.max(300, resizeStartWidth + dx);
                newHeight = Math.max(200, resizeStartHeight + dy);
                panel.style.width = newWidth + 'px';
                panel.style.height = newHeight + 'px';
                break;
        }
    });
    
    document.addEventListener('mouseup', function() {
        if (isResizing) {
            isResizing = false;
            resizeDirection = '';
            document.body.style.userSelect = '';
            if (window.isPanelDocked && window.updateFreepaneHeight) {
                window.updateFreepaneHeight();
            }
        }
    });
})();
