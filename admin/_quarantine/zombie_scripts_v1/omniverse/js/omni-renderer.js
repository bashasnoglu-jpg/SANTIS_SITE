/**
 * ========================================================================
 * 🌌 SANTIS OMNIVERSE CONSOLE — RENDERER v1.0
 * ========================================================================
 * Canvas 2D layered renderer: grid → entities → selection → HUD
 * ========================================================================
 */

export const OmniRenderer = (() => {
    'use strict';

    let ctx = null;
    const PHI = 1.618033988749895;

    function init(context) {
        ctx = context;
    }

    function render(engineState, entities, selectedId) {
        const { width, height, camera, mouse } = engineState;

        // Clear
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, width, height);

        ctx.save();

        // Camera transform
        ctx.translate(width / 2, height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-width / 2 - camera.x, -height / 2 - camera.y);

        // Layer 0: Grid
        drawGrid(width, height, camera);

        // Layer 1: Entity connections (orbit lines)
        for (const ent of entities) {
            if (ent.orbit.parentId) {
                const parent = entities.find(e => e.id === ent.orbit.parentId);
                if (parent) {
                    drawOrbitLine(parent, ent);
                }
            }
        }

        // Layer 1: Entities
        for (const ent of entities) {
            if (!ent.visible) continue;
            drawEntity(ent, ent.id === selectedId);
        }

        // Layer 3: Selection highlight
        if (selectedId) {
            const sel = entities.find(e => e.id === selectedId);
            if (sel) drawSelectionFrame(sel);
        }

        ctx.restore();
    }

    // ── GRID ──
    function drawGrid(width, height, camera) {
        const gridSize = 80;
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.04)';
        ctx.lineWidth = 0.5;

        const startX = Math.floor(camera.x / gridSize) * gridSize - width;
        const startY = Math.floor(camera.y / gridSize) * gridSize - height;
        const endX = camera.x + width * 2;
        const endY = camera.y + height * 2;

        ctx.beginPath();
        for (let x = startX; x < endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = startY; y < endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();

        // Origin crosshair
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-width, height / 2);
        ctx.lineTo(width * 2, height / 2);
        ctx.moveTo(width / 2, -height);
        ctx.lineTo(width / 2, height * 2);
        ctx.stroke();
    }

    // ── ENTITY CARD ──
    function drawEntity(ent, isSelected) {
        const { x, y } = ent.transform;
        const { width: w, height: h, auraRadius } = ent._computed;
        const hw = w / 2;
        const hh = h / 2;

        // Gravity aura (planets only)
        if (ent.type === 'planet' && ent.physics.gravity > 0) {
            const grad = ctx.createRadialGradient(x, y, hw, x, y, auraRadius);
            grad.addColorStop(0, 'rgba(197, 160, 89, 0.06)');
            grad.addColorStop(1, 'rgba(197, 160, 89, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, auraRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Card body
        const cornerRadius = Math.min(8, hw * 0.15);
        ctx.fillStyle = ent.style.fill;
        ctx.strokeStyle = ent.style.stroke;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.globalAlpha = ent.style.opacity;

        roundRect(x - hw, y - hh, w, h, cornerRadius);
        ctx.fill();
        ctx.stroke();

        // Glow effect
        if (ent.style.glow || isSelected) {
            ctx.shadowColor = ent.style.glowColor;
            ctx.shadowBlur = 20;
            ctx.strokeStyle = ent.style.glowColor;
            ctx.lineWidth = 1.5;
            roundRect(x - hw, y - hh, w, h, cornerRadius);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Inner content
        ctx.globalAlpha = 1;

        // Type indicator
        const typeIcon = ent.type === 'planet' ? '🪐' : ent.type === 'star' ? '⭐' : '🛰️';
        ctx.font = `${Math.min(16, w * 0.12)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(typeIcon, x, y - hh * 0.35);

        // Label
        ctx.font = `bold ${Math.max(9, Math.min(13, w * 0.08))}px "Inter", "Segoe UI", sans-serif`;
        ctx.fillStyle = '#d4af37';
        const maxLabelWidth = w - 16;
        let displayLabel = ent.label;
        if (ctx.measureText(displayLabel).width > maxLabelWidth) {
            while (ctx.measureText(displayLabel + '…').width > maxLabelWidth && displayLabel.length > 3) {
                displayLabel = displayLabel.slice(0, -1);
            }
            displayLabel += '…';
        }
        ctx.fillText(displayLabel, x, y + 2);

        // Mass badge
        ctx.font = `10px monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillText(`m:${ent.physics.mass.toFixed(1)} Φ:${ent.physics.ratio.toFixed(2)}`, x, y + hh * 0.55);

        // Dimensions (small text)
        ctx.font = `8px monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(`${Math.round(w)}×${Math.round(h)}`, x, y + hh * 0.82);
    }

    // ── ORBIT LINE ──
    function drawOrbitLine(parent, child) {
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.15)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 8]);
        ctx.beginPath();
        ctx.arc(parent.transform.x, parent.transform.y, child.orbit.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Connection line
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.08)';
        ctx.beginPath();
        ctx.moveTo(parent.transform.x, parent.transform.y);
        ctx.lineTo(child.transform.x, child.transform.y);
        ctx.stroke();
    }

    // ── SELECTION FRAME ──
    function drawSelectionFrame(ent) {
        const { x, y } = ent.transform;
        const { width: w, height: h } = ent._computed;
        const pad = 6;

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(x - w / 2 - pad, y - h / 2 - pad, w + pad * 2, h + pad * 2);
        ctx.setLineDash([]);

        // Corner handles
        const handleSize = 5;
        ctx.fillStyle = '#00e5ff';
        const corners = [
            [x - w / 2 - pad, y - h / 2 - pad],
            [x + w / 2 + pad, y - h / 2 - pad],
            [x - w / 2 - pad, y + h / 2 + pad],
            [x + w / 2 + pad, y + h / 2 + pad]
        ];
        for (const [cx, cy] of corners) {
            ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
        }
    }

    // ── UTIL: Rounded Rectangle ──
    function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    return { init, render };
})();
