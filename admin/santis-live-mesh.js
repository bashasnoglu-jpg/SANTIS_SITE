/**
 * SANTIS SOVEREIGN LIVE MESH (Phase 48+)
 * D3.js Neural Network & Financial Stream Visualization
 * 
 * Includes FX Neon Pulse & VIP Surge Particle Engine.
 * Hover/Interactive tracking is delegated to command-center.html
 */

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("d3-mesh-canvas");
    if (!container || typeof d3 === "undefined") return;

    // Remove loading text
    const loadingElem = document.getElementById("mesh-loading");
    if (loadingElem) loadingElem.style.display = "none";

    const statusElem = document.getElementById("mesh-status");
    if (statusElem) {
        statusElem.innerText = "LIVE NETWORK";
        statusElem.classList.add("text-emerald-500");
    }

    // Container dimensions
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 200;

    const svg = d3.select("#d3-mesh-canvas")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0");

    // Define custom filters & gradients for Cyberpunk / Luxury Look
    const defs = svg.append("defs");

    // Gold Glow Filter
    const filterGold = defs.append("filter").attr("id", "glow-gold");
    filterGold.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMergeGold = filterGold.append("feMerge");
    feMergeGold.append("feMergeNode").attr("in", "coloredBlur");
    feMergeGold.append("feMergeNode").attr("in", "SourceGraphic");

    // Cyan / Edge Glow Filter
    const filterCyan = defs.append("filter").attr("id", "glow-cyan");
    filterCyan.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMergeCyan = filterCyan.append("feMerge");
    feMergeCyan.append("feMergeNode").attr("in", "coloredBlur");
    feMergeCyan.append("feMergeNode").attr("in", "SourceGraphic");

    // Red / Surge Glow Filter (🔥)
    const filterRed = defs.append("filter").attr("id", "glow-red");
    filterRed.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMergeRed = filterRed.append("feMerge");
    feMergeRed.append("feMergeNode").attr("in", "coloredBlur");
    feMergeRed.append("feMergeNode").attr("in", "SourceGraphic");

    // Fixed Node Positions for a balanced diamond/mesh layout
    const nodesData = [
        { id: "INPUT", label: "Intent", x: width * 0.15, y: height * 0.5, color: "#94a3b8", glow: "" },
        { id: "ENGINE", label: "AI Brain", x: width * 0.5, y: height * 0.25, color: "#d4af37", glow: "url(#glow-gold)" },
        { id: "VAULT", label: "Vault", x: width * 0.5, y: height * 0.75, color: "#10b981", glow: "" },
        { id: "EDGE", label: "Edge", x: width * 0.85, y: height * 0.5, color: "#38bdf8", glow: "url(#glow-cyan)" }
    ];

    const linksData = [
        { source: "INPUT", target: "ENGINE" },
        { source: "INPUT", target: "VAULT" },
        { source: "ENGINE", target: "EDGE" },
        { source: "ENGINE", target: "VAULT" },
        { source: "VAULT", target: "EDGE" }
    ];

    // Helper to get node by ID
    const getNode = (id) => nodesData.find(n => n.id === id);

    // Draw Links
    const linksGroup = svg.append("g").attr("class", "links");
    linksData.forEach(link => {
        const source = getNode(link.source);
        const target = getNode(link.target);

        linksGroup.append("line")
            .attr("x1", source.x)
            .attr("y1", source.y)
            .attr("x2", target.x)
            .attr("y2", target.y)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 1.5)
            .attr("id", `link-${link.source}-${link.target}`);
    });

    // Draw Nodes
    const nodesGroup = svg.append("g").attr("class", "nodes");
    const nodes = nodesGroup.selectAll("g")
        .data(nodesData)
        .enter()
        .append("g")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Node outer pulsing circle
    nodes.append("circle")
        .attr("r", 14)
        .attr("fill", "none")
        .attr("stroke", d => d.color)
        .attr("stroke-width", 1)
        .attr("opacity", 0.3)
        .attr("class", "node-aura");

    // Node core
    nodes.append("circle")
        .attr("r", 6)
        .attr("fill", d => d.color)
        .attr("filter", d => d.glow)
        .attr("id", d => `node-${d.id}`);

    // Node Labels
    nodes.append("text")
        .attr("dy", 22)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .style("font-family", "monospace")
        .style("font-size", "8px")
        .style("letter-spacing", "1px")
        .text(d => d.label);

    // Continuous Aura Pulse Animation
    function animateAura() {
        svg.selectAll(".node-aura")
            .transition()
            .duration(1500)
            .attr("r", 18)
            .attr("opacity", 0)
            .transition()
            .duration(0)
            .attr("r", 8)
            .attr("opacity", 0.6)
            .on("end", animateAura);
    }
    animateAura();

    // -------------------------------------------------------------
    // PULSE ANIMATION (PARTICLES) FUNCTIONALITY
    // -------------------------------------------------------------

    function fireParticle(sourceId, targetId, color, size = 3) {
        const source = getNode(sourceId);
        const target = getNode(targetId);
        if (!source || !target) return;

        const particle = svg.append("circle")
            .attr("r", size)
            .attr("fill", color)
            .attr("cx", source.x)
            .attr("cy", source.y);

        // Apply Filters based on color
        if (color === "#d4af37") particle.attr("filter", "url(#glow-gold)");
        else if (color === "#38bdf8") particle.attr("filter", "url(#glow-cyan)");
        else if (color === "#ef4444") particle.attr("filter", "url(#glow-red)");

        particle.transition()
            .duration(600 + Math.random() * 400) // 0.6s - 1s travel time
            .ease(color === "#ef4444" ? d3.easeExpIn : d3.easeCubicInOut) // Surge is faster
            .attr("cx", target.x)
            .attr("cy", target.y)
            .on("end", function () {
                d3.select(this).remove();

                // Node flash effect upon particle arrival
                const tNode = svg.select(`#node-${targetId}`);
                const origR = tNode.attr("r");
                const flashR = color === "#ef4444" ? 14 : 10; // Bigger flash for surge

                tNode.transition().duration(100).attr("r", flashR)
                    .attr("fill", color)
                    .transition().duration(400).attr("r", origR)
                    .attr("fill", target.color);
            });
    }

    // -------------------------------------------------------------
    // NEON PULSE SCENARIOS (Phase 48+ Erweiterung)
    // -------------------------------------------------------------

    // Simulate events from different parts of the network
    const simulateIntelligence = () => {
        const intentScore = Math.random() * 100;

        // 1. Normal Intent Flow (< 85)
        if (intentScore < 85 && Math.random() > 0.4) {
            fireParticle("INPUT", "ENGINE", "#f8fafc", 2); // White data packet
        }

        // 2. High Intent VIP Pulse (85 - 95)
        if (intentScore >= 85 && intentScore < 95) {
            setTimeout(() => fireParticle("INPUT", "ENGINE", "#38bdf8", 3), 0); // Cyan high intent
            setTimeout(() => fireParticle("ENGINE", "VAULT", "#d4af37", 4), 200); // Heavy Gold Payment

            // Intelligence Fee Extractor
            const hqFeeNode = document.getElementById("metric-intel-fee");
            if (hqFeeNode) {
                let current = parseFloat(hqFeeNode.innerText) || 0;
                current += parseFloat((Math.random() * 5 + 1.0).toFixed(2));
                hqFeeNode.innerText = current.toFixed(2);
                hqFeeNode.parentElement.classList.add("scale-105", "shadow-[0_0_20px_rgba(212,175,55,0.4)]");
                setTimeout(() => hqFeeNode.parentElement.classList.remove("scale-105", "shadow-[0_0_20px_rgba(212,175,55,0.4)]"), 300);
            }
        }

        // 3. SURGE TRIGGER (Ultra-High Demand / Scarcity) (> 95)
        if (intentScore >= 95) {
            // Triple Fire Burst!
            fireParticle("ENGINE", "EDGE", "#ef4444", 5);
            setTimeout(() => fireParticle("ENGINE", "EDGE", "#ef4444", 4), 150);
            setTimeout(() => fireParticle("ENGINE", "EDGE", "#d4af37", 3), 300);

            setTimeout(() => fireParticle("VAULT", "EDGE", "#10b981", 4), 500); // Conversion successful despite surge
        }

        // 4. Vault Settlement (Green/Gold) -> Default Loop
        if (Math.random() > 0.85) {
            fireParticle("VAULT", "EDGE", "#10b981", 3.5);
        }
    };

    // Run simulation loop
    setInterval(simulateIntelligence, 800);

    // Initial Wake-up Burst
    setTimeout(() => {
        fireParticle("INPUT", "ENGINE", "#ffffff", 4);
        setTimeout(() => fireParticle("ENGINE", "VAULT", "#d4af37", 4), 500);
        setTimeout(() => fireParticle("ENGINE", "EDGE", "#38bdf8", 4), 600);
        setTimeout(() => fireParticle("VAULT", "EDGE", "#10b981", 4), 900);
    }, 1000);

    // -------------------------------------------------------------
    // WEBSOCKET (REAL-TIME INTEGRATION HOOK)
    // -------------------------------------------------------------
    /*
    const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const ws = new WebSocket(`${protocol}${window.location.host}/ws/pulse`);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "intent_high") fireParticle("INPUT", "ENGINE", "#ffffff");
        if (data.type === "surge_active") fireParticle("ENGINE", "EDGE", "#d4af37");
        if (data.type === "payment_cleared") {
            fireParticle("VAULT", "EDGE", "#10b981");
            fireParticle("ENGINE", "VAULT", "#d4af37"); // Intelligence fee flow
        }
    };
    */
});
