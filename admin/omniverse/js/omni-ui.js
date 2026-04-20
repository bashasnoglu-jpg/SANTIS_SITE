/**
 * ========================================================================
 * 🌌 SANTIS OMNIVERSE CONSOLE — UI BRIDGE v1.0
 * ========================================================================
 * DOM panel ↔ engine bridge: sliders, buttons, JSON telemetry, FPS badge
 * ========================================================================
 */

import { OmniScene } from './omni-scene.js';

export const OmniUI = (() => {
    'use strict';

    let els = {};

    function init() {
        els = {
            fps: document.getElementById('omni-fps'),
            entityCount: document.getElementById('omni-entity-count'),
            dnaOutput: document.getElementById('omni-dna-output'),
            entityPanel: document.getElementById('omni-entity-panel'),
            labelInput: document.getElementById('omni-label'),
            typeSelect: document.getElementById('omni-type'),
            massSlider: document.getElementById('omni-mass'),
            massValue: document.getElementById('omni-mass-val'),
            ratioSlider: document.getElementById('omni-ratio'),
            ratioValue: document.getElementById('omni-ratio-val'),
            gravitySlider: document.getElementById('omni-gravity'),
            gravityValue: document.getElementById('omni-gravity-val'),
            evolutionSlider: document.getElementById('omni-evolution'),
            evolutionValue: document.getElementById('omni-evolution-val'),
            btnSpawn: document.getElementById('omni-btn-spawn'),
            btnSpawnPlanet: document.getElementById('omni-btn-spawn-planet'),
            btnDelete: document.getElementById('omni-btn-delete'),
            btnExport: document.getElementById('omni-btn-export')
        };

        // Spawn buttons
        els.btnSpawn?.addEventListener('click', () => {
            const ent = OmniScene.createEntity({ type: 'star' });
            OmniScene.select(ent.id);
            showEntityPanel(ent);
            updateDNA();
        });

        els.btnSpawnPlanet?.addEventListener('click', () => {
            const ent = OmniScene.createEntity({
                type: 'planet',
                label: 'New Planet',
                physics: { mass: 2.0, gravity: 400 },
                style: { fill: '#0d0d0d', stroke: '#d4af37', glow: true }
            });
            OmniScene.select(ent.id);
            showEntityPanel(ent);
            updateDNA();
        });

        // Delete
        els.btnDelete?.addEventListener('click', () => {
            const sel = OmniScene.getSelected();
            if (sel) {
                OmniScene.deleteEntity(sel);
                hideEntityPanel();
                updateDNA();
            }
        });

        // Export
        els.btnExport?.addEventListener('click', () => {
            const dna = OmniScene.exportDNA();
            const blob = new Blob([JSON.stringify(dna, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `santis_universe_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Slider change handlers
        bindSlider(els.massSlider, els.massValue, 'physics.mass', v => parseFloat(v));
        bindSlider(els.ratioSlider, els.ratioValue, 'physics.ratio', v => parseFloat(v));
        bindSlider(els.gravitySlider, els.gravityValue, 'physics.gravity', v => parseInt(v));
        bindSlider(els.evolutionSlider, els.evolutionValue, 'morph.evolution', v => parseInt(v));

        // Label input
        els.labelInput?.addEventListener('input', () => {
            const sel = OmniScene.getSelected();
            if (sel) OmniScene.updateEntity(sel, 'label', els.labelInput.value);
        });

        // Type select
        els.typeSelect?.addEventListener('change', () => {
            const sel = OmniScene.getSelected();
            if (sel) {
                OmniScene.updateEntity(sel, 'type', els.typeSelect.value);
                updateDNA();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const sel = OmniScene.getSelected();
                if (sel) {
                    OmniScene.deleteEntity(sel);
                    hideEntityPanel();
                    updateDNA();
                }
            }
        });

        updateDNA();
    }

    function bindSlider(slider, display, path, transform) {
        if (!slider) return;
        slider.addEventListener('input', () => {
            const val = transform(slider.value);
            if (display) display.textContent = val.toFixed?.(2) ?? val;
            const sel = OmniScene.getSelected();
            if (sel) {
                OmniScene.updateEntity(sel, path, val);
                updateDNA();
            }
        });
    }

    // ── FPS ──
    function updateFPS(fps) {
        if (els.fps) {
            els.fps.textContent = fps;
            els.fps.style.color = fps >= 55 ? '#00ffc2' : fps >= 30 ? '#ffaa00' : '#ff3e3e';
        }
        if (els.entityCount) {
            els.entityCount.textContent = OmniScene.getEntities().length;
        }
    }

    // ── ENTITY PANEL ──
    function showEntityPanel(ent) {
        if (!els.entityPanel) return;
        els.entityPanel.classList.add('visible');

        if (els.labelInput) els.labelInput.value = ent.label;
        if (els.typeSelect) els.typeSelect.value = ent.type;
        if (els.massSlider) {
            els.massSlider.value = ent.physics.mass;
            if (els.massValue) els.massValue.textContent = ent.physics.mass.toFixed(2);
        }
        if (els.ratioSlider) {
            els.ratioSlider.value = ent.physics.ratio;
            if (els.ratioValue) els.ratioValue.textContent = ent.physics.ratio.toFixed(2);
        }
        if (els.gravitySlider) {
            els.gravitySlider.value = ent.physics.gravity;
            if (els.gravityValue) els.gravityValue.textContent = ent.physics.gravity;
        }
        if (els.evolutionSlider) {
            els.evolutionSlider.value = ent.morph.evolution;
            if (els.evolutionValue) els.evolutionValue.textContent = ent.morph.evolution;
        }
    }

    function hideEntityPanel() {
        if (els.entityPanel) els.entityPanel.classList.remove('visible');
    }

    // ── DNA TELEMETRY ──
    function updateDNA() {
        if (!els.dnaOutput) return;
        const dna = OmniScene.exportDNA();
        els.dnaOutput.textContent = JSON.stringify(dna, null, 2);
    }

    return { init, updateFPS, showEntityPanel, hideEntityPanel, updateDNA };
})();
