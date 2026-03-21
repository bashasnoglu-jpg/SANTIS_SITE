// aurelia-sentient.js | Phase 28 Quantum Cognitive Loop

import { SantisBus } from './santis-bus.js';
import { AudioEngine } from './sovereign-acoustics.js';
import { InteractionEngine } from './interaction-engine.js';
import { UIEngine } from './massage-matrix.js';

// ----------------------------
// CORE VOICE MODULE
// ----------------------------
export class AureliaVoice {
    constructor() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.memoryLoop = [];
        this.isListening = false;

        // EventBus ile veri aktarımı
        SantisBus.on('metrics:update', (data) => this.contextualMemory(data));
    }

    start() {
        if(this.isListening) return;
        this.recognition.start();
        this.isListening = true;
        console.log('🎙️ [Aurelia] Voice Engine Activated');
    }

    stop() {
        if(!this.isListening) return;
        this.recognition.stop();
        this.isListening = false;
        console.log('🎙️ [Aurelia] Voice Engine Deactivated');
    }

    contextualMemory(data) {
        // Her metrics güncellemesini hafızaya al
        this.memoryLoop.push(data);
        if(this.memoryLoop.length > 50) this.memoryLoop.shift(); // sliding memory
    }

    bindUIFeedback() {
        this.recognition.onresult = (event) => {
            let transcript = '';
            for(let i=event.resultIndex; i<event.results.length; i++){
                transcript += event.results[i][0].transcript;
            }
            // EventBus ile UI ve Interaction Engine tetikleme
            SantisBus.emit('aurelia:utterance', transcript);
            this.memoryLoop.push({type: 'utterance', content: transcript});
            UIEngine.glow(transcript);
        };
    }

    bindCommands() {
        SantisBus.on('aurelia:utterance', (text) => {
            text = text.toLowerCase();
            // SES -> COMMAND -> INTERACTION
            if(text.includes('activate godmode')) InteractionEngine.activateGodMode();
            if(text.includes('dashboard')) InteractionEngine.navigateTo('/guest-zen.html');
            if(text.includes('zen mode')) InteractionEngine.enterZenMode();
        });
    }
}

// ----------------------------
// FULL SENTIENT COGNITIVE LOOP
// ----------------------------
export function initializeSentientLoop() {
    const aurelia = new AureliaVoice();
    aurelia.start();
    aurelia.bindUIFeedback();
    aurelia.bindCommands();

    // Fallback loop: Scroll & Click triggers memory
    InteractionEngine.on('user:scroll', (delta) => {
        aurelia.memoryLoop.push({type:'scroll', delta});
        if(aurelia.memoryLoop.length > 50) aurelia.memoryLoop.shift();
    });
    InteractionEngine.on('user:click', (target) => {
        aurelia.memoryLoop.push({type:'click', target});
        if(aurelia.memoryLoop.length > 50) aurelia.memoryLoop.shift();
    });

    // Periodic Cognitive Reflection
    setInterval(() => {
        const reflection = aurelia.memoryLoop.slice(-10); // last 10 events
        SantisBus.emit('cognitive:reflect', reflection);
        AudioEngine.speak('Sentient loop updated');
    }, 5000);

    console.log('🧠 [Sentient Loop] Full Cognitive Memory Loop Initialized');
    return aurelia;
}

// ----------------------------
// INIT
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
    window.AureliaSentient = initializeSentientLoop();
});
