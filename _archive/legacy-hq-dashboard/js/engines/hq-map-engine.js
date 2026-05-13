import { hqStore } from '../core/hq-store.js';

export class HQMapEngine {
    constructor() {
        this.map = null;
        this.packetPoint = null;
        this.animationLine = null;
        this.animationStep = 0;
        this.isInitialized = false;
        
        if (document.getElementById('mapbox-gl-container')) {
            this.initMapbox();
        }

        // [ALFA PROTOKOLÜ] Dinleyicisi
        hqStore.subscribe((state) => {
            if (state.latestAlfaStrike && this.map && this.isInitialized) {
                this.executeKamikazeDive(state.latestAlfaStrike);
                // Clear state so it doesn't re-trigger on other state updates unnecessarily
                // Though in real CQRS we would use event streams rather than state for this.
                delete state.latestAlfaStrike; 
            }
        });
    }

    executeKamikazeDive(data) {
        console.log(`[ALFA STRIKE] Firing Kamikaze Dalışı for Node: ${data.node}`);
        // Antalya (TR-01) Koordinatları
        this.map.flyTo({
            center: [30.7133, 36.8969],
            zoom: 18,
            pitch: 65,
            bearing: 45,
            duration: 4000,
            essential: true 
        });

        // 6 saniye sonra yörüngeye dön
        setTimeout(() => {
            this.resetViewport();
        }, 8000);
    }

    initMapbox() {
        try {
            this.map = new window.maplibregl.Map({
                container: 'mapbox-gl-container',
                style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
                center: [24.7, 39.5],
                zoom: 4.5,
                pitch: 45,
                bearing: -10
            });

            this.map.on('load', () => {
                this.isInitialized = true;
                this.drawNodes();
                this.drawBezierTraffic();
            });
        } catch(e) {
            console.error('[Map Engine] Failed to mount maplibre', e);
        }
    }

    drawNodes() {
        const nodes = [
            { id: 'antalya', name: 'Antalya Core', lng: 30.7133, lat: 36.8969, status: 'emerald', text: 'Optimum' },
            { id: 'budva', name: 'Montenegro Satellite', lng: 18.8400, lat: 42.2911, status: 'cyan', text: 'Stabil' }
        ];

        nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = `map-pulse-node ${node.status}`;
            
            const popup = new window.maplibregl.Popup({ offset: 25, closeButton: false, closeOnClick: false })
                .setHTML(`<div class="font-bold text-slate-100">${node.name}</div><div class="text-[10px] uppercase tracking-widest text-${node.status}-400">${node.text}</div>`);
            
            new window.maplibregl.Marker({ element: el, anchor: 'center' })
                .setLngLat([node.lng, node.lat])
                .setPopup(popup)
                .addTo(this.map);

            el.addEventListener('mouseenter', () => popup.addTo(this.map));
            el.addEventListener('mouseleave', () => popup.remove());
            el.addEventListener('click', () => {
                const domCtrl = window.__HQ_DOM_CONTROLLER__;
                if(domCtrl) domCtrl.openOmniZoom(node);
                
                this.map.flyTo({
                    center: [node.lng, node.lat],
                    zoom: 7,
                    pitch: 60,
                    duration: 2000
                });
            });
        });
    }

    drawBezierTraffic() {
        if(!window.turf) return;
        const origin = [30.7133, 36.8969]; 
        const destination = [18.8400, 42.2911]; 
        
        const midpoint = [
            (origin[0] + destination[0]) / 2,
            ((origin[1] + destination[1]) / 2) + 2.5
        ];
        
        const lineString = window.turf.bezierSpline(window.turf.lineString([origin, midpoint, destination]), { resolution: 10000 });
        this.animationLine = lineString.geometry.coordinates;

        this.map.addSource('route', { 'type': 'geojson', 'data': lineString });
        this.map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'paint': {
                'line-width': 2,
                'line-color': '#06b6d4',
                'line-opacity': 0.3,
                'line-dasharray': [2, 2]
            }
        });

        this.packetPoint = window.turf.point(origin);
        this.map.addSource('packet', { 'type': 'geojson', 'data': this.packetPoint });
        this.map.addLayer({
            'id': 'packet',
            'type': 'circle',
            'source': 'packet',
            'paint': {
                'circle-radius': 4,
                'circle-color': '#10b981',
                'circle-pitch-alignment': 'map'
            }
        });

        this.animatePacket();
    }

    animatePacket() {
        if(!this.map || !this.animationLine || this.animationLine.length === 0) return;
        
        this.packetPoint.geometry.coordinates = this.animationLine[this.animationStep];
        this.map.getSource('packet').setData(this.packetPoint);
        
        this.animationStep += 2;
        if (this.animationStep >= this.animationLine.length) {
            this.animationStep = 0;
        }
        
        requestAnimationFrame(() => this.animatePacket());
    }

    resetViewport() {
        if(this.map) {
            this.map.flyTo({
                center: [24.7, 39.5],
                zoom: 4.5,
                pitch: 45,
                duration: 2500
            });
        }
    }
}
