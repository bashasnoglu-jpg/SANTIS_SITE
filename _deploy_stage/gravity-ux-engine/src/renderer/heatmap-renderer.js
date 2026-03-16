/**
 * ========================================================================
 * UX GRAVITY ENGINE — HEATMAP RENDERER
 * Hardware-Accelerated Canvas Çizim Motoru
 * ========================================================================
 * Desynchronized Canvas + requestAnimationFrame = GPU-First Rendering
 */

export class HeatmapRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
        this.width = 0;
        this.height = 0;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = 'rgba(3, 3, 3, 0.35)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawBots(bots) {
        for (let i = 0; i < bots.length; i++) {
            const bot = bots[i];
            if (!bot.active) continue;
            this.ctx.fillStyle = bot.color || 'rgba(0, 229, 255, 0.6)';
            this.ctx.fillRect(bot.x, bot.y, 2, 2);
        }
    }

    drawProducts(products) {
        const ctx = this.ctx;

        for (const p of products) {
            const heat = Math.min(p.conversions / Math.max(p.totalBots * 0.3, 1), 1);
            const baseRadius = p.radius || p.mass * 0.6;
            const glowRadius = baseRadius + heat * 30;

            // Heatmap halo
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);

            const r = Math.floor(20 + 235 * heat);
            const g = Math.floor(20 + 80 * heat);
            const b = Math.floor(20 - 20 * heat);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowBlur = heat * 60;
            ctx.shadowColor = `rgba(255, 50, 50, ${heat})`;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = '14px "Inter", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(p.name, p.x, p.y - glowRadius - 14);

            // Conversion counter
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 13px "Inter", monospace';
            ctx.fillText(`CVR: ${p.conversions}`, p.x, p.y + glowRadius + 20);

            // Revenue
            if (p.price) {
                const revenue = p.conversions * p.price;
                ctx.fillStyle = '#4ade80';
                ctx.font = '12px "Inter", monospace';
                ctx.fillText(`€${revenue.toLocaleString()}`, p.x, p.y + glowRadius + 38);
            }
        }
    }

    drawStats(stats) {
        const ctx = this.ctx;
        const x = this.width - 240;
        const y = 20;

        ctx.fillStyle = 'rgba(10, 10, 12, 0.85)';
        ctx.strokeStyle = 'rgba(197, 160, 89, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, y, 220, 160, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('LIVE ANALYTICS', x + 16, y + 28);

        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText(`Active Bots: ${stats.activeBots}`, x + 16, y + 54);
        ctx.fillText(`Converted:   ${stats.converted}`, x + 16, y + 74);
        ctx.fillText(`Bounced:     ${stats.bounced}`, x + 16, y + 94);

        const cvr = stats.totalBots > 0 ? ((stats.converted / stats.totalBots) * 100).toFixed(1) : '0.0';
        ctx.fillStyle = parseFloat(cvr) > 5 ? '#4ade80' : '#ff3366';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(`CVR: ${cvr}%`, x + 16, y + 130);

        ctx.fillStyle = '#d4af37';
        ctx.font = '12px monospace';
        ctx.fillText(`Revenue: €${stats.revenue.toLocaleString()}`, x + 16, y + 150);
    }
}
