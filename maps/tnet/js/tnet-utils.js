/**
 * tnet-utils.js - Gemeinsame Hilfsfunktionen für alle TNET-Module
 * 
 * Muss VOR allen anderen tnet-*.js Dateien geladen werden.
 * 
 * Enthält:
 * - waitForMap(callback) — Wartet auf njs.AppManager.Maps['main'].mapObj
 * - waitForMapAndDOM(callback, domIds) — Wartet auf Map + spezifische DOM-Elemente
 * - lv95ToWgs84(e, n) — Koordinatentransformation LV95 → WGS84
 * - showToast(message, duration) — Toast-Benachrichtigung anzeigen
 * - getMainMap() — Map-Objekt sicher holen (oder null)
 * - getMainMapWrapper() — Map-Wrapper sicher holen (oder null)
 */

window.TnetUtils = (function() {
    'use strict';

    /**
     * Map-Objekt sicher holen
     * @returns {ol.Map|null}
     */
    function getMainMap() {
        if (window.njs && njs.AppManager && njs.AppManager.Maps && 
            njs.AppManager.Maps['main'] && njs.AppManager.Maps['main'].mapObj) {
            return njs.AppManager.Maps['main'].mapObj;
        }
        return null;
    }

    /**
     * Map-Wrapper sicher holen (enthält mapObj + Hilfsfunktionen)
     * @returns {Object|null}
     */
    function getMainMapWrapper() {
        if (window.njs && njs.AppManager && njs.AppManager.Maps && 
            njs.AppManager.Maps['main']) {
            return njs.AppManager.Maps['main'];
        }
        return null;
    }

    /**
     * Wartet bis Map-Objekt verfügbar ist, dann callback aufrufen
     * @param {function} callback - Erhält map (ol.Map) als Parameter
     * @param {number} [interval=300] - Polling-Intervall in ms
     */
    function waitForMap(callback, interval) {
        var ms = interval || 300;
        var map = getMainMap();
        if (map) {
            callback(map);
        } else {
            setTimeout(function() { waitForMap(callback, ms); }, ms);
        }
    }

    /**
     * Wartet bis Map UND bestimmte DOM-Elemente verfügbar sind
     * @param {function} callback - Erhält mapWrapper als Parameter
     * @param {string[]} domIds - Array von DOM-Element-IDs die vorhanden sein müssen
     * @param {number} [interval=300] - Polling-Intervall in ms
     */
    function waitForMapAndDOM(callback, domIds, interval) {
        var ms = interval || 300;
        var mapWrapper = getMainMapWrapper();
        var domReady = true;

        if (domIds && domIds.length) {
            for (var i = 0; i < domIds.length; i++) {
                if (!document.getElementById(domIds[i])) {
                    domReady = false;
                    break;
                }
            }
        }

        if (mapWrapper && mapWrapper.mapObj && domReady) {
            callback(mapWrapper);
        } else {
            setTimeout(function() { waitForMapAndDOM(callback, domIds, ms); }, ms);
        }
    }

    /**
     * LV95 (CH1903+) → WGS84 Transformation
     * Vereinfachte Näherung für die Schweiz (Genauigkeit ~1m)
     * @param {number} e - Easting (LV95)
     * @param {number} n - Northing (LV95)
     * @returns {number[]} [lon, lat] in WGS84
     */
    function lv95ToWgs84(e, n) {
        var y_aux = (e - 2600000) / 1000000;
        var x_aux = (n - 1200000) / 1000000;

        var lon = 2.6779094 
            + 4.728982 * y_aux 
            + 0.791484 * y_aux * x_aux 
            + 0.1306 * y_aux * Math.pow(x_aux, 2) 
            - 0.0436 * Math.pow(y_aux, 3);

        var lat = 16.9023892 
            + 3.238272 * x_aux 
            - 0.270978 * Math.pow(y_aux, 2) 
            - 0.002528 * Math.pow(x_aux, 2) 
            - 0.0447 * Math.pow(y_aux, 2) * x_aux 
            - 0.0140 * Math.pow(x_aux, 3);

        lon = lon * 100 / 36;
        lat = lat * 100 / 36;

        return [lon, lat];
    }

    /**
     * Toast-Benachrichtigung anzeigen
     * @param {string} message - Nachricht
     * @param {number} [duration=2000] - Anzeigedauer in ms
     */
    function showToast(message, duration) {
        var ms = duration || 2000;
        var existing = document.querySelector('.ctx-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'ctx-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('fade-out');
            setTimeout(function() { toast.remove(); }, 300);
        }, ms);
    }

    // Public API
    return {
        getMainMap: getMainMap,
        getMainMapWrapper: getMainMapWrapper,
        waitForMap: waitForMap,
        waitForMapAndDOM: waitForMapAndDOM,
        lv95ToWgs84: lv95ToWgs84,
        showToast: showToast
    };

})();
