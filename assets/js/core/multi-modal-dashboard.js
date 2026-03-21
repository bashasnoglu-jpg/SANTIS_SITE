// multi-modal-dashboard.js | Phase 29 Demo Snippet

import { SantisBus } from './santis-bus.js';
import { AureliaSentient } from './aurelia-sentient.js';
import { InteractionEngine } from './interaction-engine.js';
import { UIEngine } from './massage-matrix.js';
import { AudioEngine } from './sovereign-acoustics.js';

class MultiModalDashboard {
    constructor(targetId) {
        this.container = document.getElementById(targetId);
        if (!this.container) {
            console.warn('[Dashboard] Target container not found!');
            return;
        }

        this.state = {
            voice: '',
            clicks: 0,
            scrollDelta: 0,
            memoryEvents: []
        };

        this.initUI();
        this.bindEvents();
        this.renderLoop();
    }

    initUI() {
        this.container.innerHTML = `
            <h2>🧠 Santis Multi-Modal Awareness</h2>
            <div id="mm-voice">🎤 Voice: <span>waiting...</span></div>
            <div id="mm-clicks">🖱️ Clicks: 0</div>
            <div id="mm-scroll">🌀 Scroll Delta: 0</div>
            <div id="mm-memory">💾 Last Events: <ul></ul></div>
        `;
        this.voiceEl = this.container.querySelector('#mm-voice span');
        this.clickEl = this.container.querySelector('#mm-clicks');
        this.scrollEl = this.container.querySelector('#mm-scroll');
        this.memoryEl = this.container.querySelector('#mm-memory ul');
    }

    bindEvents() {
        // Voice input
        SantisBus.on('aurelia:utterance', (text) => {
            this.state.voice = text;
            this.pushMemory({type:'voice', content:text});
        });

        // Scroll
        InteractionEngine.on('user:scroll', (delta) => {
            this.state.scrollDelta += delta;
            this.pushMemory({type:'scroll', delta});
        });

        // Click
        InteractionEngine.on('user:click', (target) => {
            this.state.clicks++;
            this.pushMemory({type:'click', target: target.tagName});
        });

        // Cognitive reflection (every 5s)
        SantisBus.on('cognitive:reflect', (reflection) => {
            reflection.forEach(evt => this.pushMemory(evt));
        });
    }

    pushMemory(evt) {
        this.state.memoryEvents.push(evt);
        if(this.state.memoryEvents.length > 10) this.state.memoryEvents.shift();
    }

    renderLoop() {
        const render = () => {
            this.voiceEl.textContent = this.state.voice || 'listening...';
            this.clickEl.textContent = `🖱️ Clicks: ${this.state.clicks}`;
            this.scrollEl.textContent = `🌀 Scroll Delta: ${this.state.scrollDelta.toFixed(2)}`;
            this.memoryEl.innerHTML = '';
            this.state.memoryEvents.slice(-10).forEach(evt => {
                const li = document.createElement('li');
                li.textContent = `[${evt.type}] ${evt.content || evt.delta || evt.target || ''}`;
                this.memoryEl.appendChild(li);
            });
            requestAnimationFrame(render);
        };
        render();
    }
}

// ----------------------------
// INIT
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
    new MultiModalDashboard('multi-modal-panel');
    console.log('🖥️ [Dashboard] Multi-Modal Awareness Panel Initialized');
});
