/**
 * ========================================================================
 * 🌌 SANTIS OMNIVERSE CONSOLE — SCENE GRAPH v1.0
 * ========================================================================
 * Entity CRUD, hierarchy, hit testing, serialization.
 * ========================================================================
 */

export const OmniScene = (() => {
    'use strict';

    const PHI = 1.618033988749895;
    const BASE_UNIT = 120;

    let entities = [];
    let selectedId = null;
    let idCounter = 0;

    function init() {
        entities = [];
        idCounter = 0;
    }

    // ── ENTITY FACTORY ──
    function createEntity(overrides = {}) {
        idCounter++;
        const id = `ent_${idCounter}_${Date.now().toString(36)}`;

        const defaults = {
            id,
            type: 'star',
            label: `Entity ${idCounter}`,
            locked: false,
            visible: true,

            physics: {
                mass: 1.0 + Math.random() * 0.8,
                ratio: PHI,
                gravity: 200,
                fixed: false,
                damping: 0.85
            },

            transform: {
                x: 400 + Math.random() * 200,
                y: 300 + Math.random() * 200,
                rotation: 0,
                scale: 1.0
            },

            morph: {
                evolution: 0,
                animation: false,
                speed: 1.0
            },

            orbit: {
                parentId: null,
                radius: 0,
                speed: 0,
                phase: 0
            },

            style: {
                fill: '#1a1a1a',
                stroke: '#d4af37',
                opacity: 1.0,
                glow: false,
                glowColor: '#d4af37'
            },

            meta: {
                page: '',
                price: '',
                category: '',
                image: '',
                slug: ''
            }
        };

        // Deep merge overrides
        const ent = deepMerge(defaults, overrides);
        ent.id = id; // Always use generated ID

        // Compute derived dimensions
        recompute(ent);

        entities.push(ent);
        return ent;
    }

    function recompute(ent) {
        const w = BASE_UNIT * ent.physics.mass;
        const h = w / ent.physics.ratio;
        ent._computed = {
            width: w,
            height: h,
            auraRadius: w * PHI * 0.5
        };
    }

    function deepMerge(target, source) {
        const result = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key]) {
                result[key] = deepMerge(target[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    }

    // ── CRUD ──
    function deleteEntity(id) {
        entities = entities.filter(e => e.id !== id);
        if (selectedId === id) selectedId = null;
    }

    function getById(id) {
        return entities.find(e => e.id === id) || null;
    }

    function getEntities() {
        return entities;
    }

    function getSelected() {
        return selectedId;
    }

    function select(id) {
        selectedId = id;
    }

    // ── UPDATE ENTITY PHYSICS ──
    function updateEntity(id, path, value) {
        const ent = getById(id);
        if (!ent) return;

        const keys = path.split('.');
        let obj = ent;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
            if (!obj) return;
        }
        obj[keys[keys.length - 1]] = value;

        // Recompute if physics changed
        if (path.startsWith('physics.')) {
            recompute(ent);
        }
    }

    // ── HIT TEST ──
    function hitTest(wx, wy) {
        // Reverse order: topmost entity first
        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            if (!e.visible) continue;
            const hw = e._computed.width / 2;
            const hh = e._computed.height / 2;
            if (wx >= e.transform.x - hw && wx <= e.transform.x + hw &&
                wy >= e.transform.y - hh && wy <= e.transform.y + hh) {
                return e;
            }
        }
        return null;
    }

    // ── UPDATE (per frame) ──
    function update(dt) {
        // Orbital animation
        for (const ent of entities) {
            if (ent.orbit.parentId && ent.orbit.speed > 0) {
                const parent = getById(ent.orbit.parentId);
                if (parent) {
                    ent.orbit.phase += ent.orbit.speed * dt;
                    ent.transform.x = parent.transform.x + ent.orbit.radius * Math.cos(ent.orbit.phase);
                    ent.transform.y = parent.transform.y + ent.orbit.radius * Math.sin(ent.orbit.phase);
                }
            }
        }
    }

    // ── SERIALIZATION ──
    function exportDNA() {
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            entity_count: entities.length,
            entities: entities.map(e => ({
                id: e.id,
                type: e.type,
                label: e.label,
                physics: { ...e.physics },
                transform: { x: Math.round(e.transform.x), y: Math.round(e.transform.y) },
                morph: { evolution: e.morph.evolution },
                _computed: { ...e._computed }
            }))
        };
    }

    return {
        init,
        createEntity,
        deleteEntity,
        getById,
        getEntities,
        getSelected,
        select,
        updateEntity,
        hitTest,
        update,
        exportDNA,
        recompute,
        PHI,
        BASE_UNIT
    };
})();
