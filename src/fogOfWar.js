
export class FogOfWar {
    constructor() {
        this.predictions = [];
        this.logPrefix = "[FogOfWar]";
        this.initializeOverlay();
        this.active = false;
    }

    log(message, ...optionalParams) {
        console.log(`${this.logPrefix} ${message}`, ...optionalParams);
    }

    initializeOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.position = 'absolute';
        this.overlay.className = 'fog-of-war';
        this.overlay.style.top = '0';
        this.overlay.style.left = '0';
        this.overlay.style.pointerEvents = 'none';
        this.overlay.style.overflow = 'hidden';
        this.overlay.style.zIndex = '99998';
    
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
    
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        this.mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
        this.mask.setAttribute('id', 'fog-mask');
        
        const maskBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        maskBackground.setAttribute('fill', 'white');
        this.mask.appendChild(maskBackground);
    
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'blur');
        const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '10');
        filter.appendChild(feGaussianBlur);
        defs.appendChild(filter);
        defs.appendChild(this.mask);
        svg.appendChild(defs);
    
        this.fogLayer = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.fogLayer.setAttribute('fill', 'rgba(0, 0, 0, 0.5)');
        this.fogLayer.setAttribute('mask', 'url(#fog-mask)');
        svg.appendChild(this.fogLayer);
    
        this.overlay.appendChild(svg);
    
        // Auto resize fog to fill the document
        const resizeFog = () => {
            const width = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
            const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    
            this.overlay.style.width = `${width}px`;
            this.overlay.style.height = `${height}px`;
            svg.setAttribute('width', `${width}px`);
            svg.setAttribute('height', `${height}px`);
            maskBackground.setAttribute('width', `${width}px`);
            maskBackground.setAttribute('height', `${height}px`);
            this.fogLayer.setAttribute('width', `${width}px`);
            this.fogLayer.setAttribute('height', `${height}px`);
        };
    
        const initializeResizeFog = () => {
            resizeFog();
            window.addEventListener('resize', resizeFog);
            window.addEventListener('scroll', resizeFog);
        };

        // Only initialize when page is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            initializeResizeFog();
        } else {
            document.addEventListener('DOMContentLoaded', initializeResizeFog);
        }

    }
    

    addCircle(cx, cy, radius) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'black');
        circle.style.filter = 'url(#blur)';
        this.mask.appendChild(circle);
    }

    // Circles are only added/rendered when we want to enable FogOfWar, otherwise queue.
    addPrediction(prediction) {
        if (this.active) {
            this.addCircle(prediction.x, prediction.y, 50);
        } else {
            this.predictions.push(prediction);
        }
    }

    enable() {
        this.active = true;
        this.predictions.forEach((prediction) => {
            this.addCircle(prediction.x, prediction.y, 50);
        });
        this.predictions = [];
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            document.body.appendChild(this.overlay);
        } else {
            this.disable();
        }}

    disable() {
        this.active = false;
        this.overlay.remove();
    }
}
