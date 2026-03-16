/**

 * 🧠 SANTIS CURATOR - AI GOVERNANCE BRIDGE v1.0

 * Connects Admin Panel to Server.py (Gemini) and ConciergeEngine (Logic).

 */



window.SantisCurator = (function () {

    const API_URL = "http://localhost:8000/api/generate-text";



    // 1. GENERATE TEXT (Creative AI)

    async function generate(context = {}) {

        const { productName, category, type } = context;



        // Prompt Engineering (The "Quiet Luxury" Guard)

        let systemPrompt = "";



        if (type === 'desc') {

            systemPrompt = `

            Write a product description for a luxury spa service.

            Brand Tone: Quiet Luxury, sensory, refined, minimalist. NO marketing fluff.

            Language: Turkish.

            Service Name: "${productName}"

            Category: "${category}"

            Format: Max 2 elegant sentences. Focus on the feeling/benefit.

            `;

        } else if (type === 'translate') {

            systemPrompt = `

            Translate this text to English. Maintain 'Quiet Luxury' tone.

            Text: "${context.text}"

            `;

        }



        console.log("✨ [Curator] Asking AI...", { productName, type });



        try {

            const response = await fetch(API_URL, {

                method: "POST",

                headers: { "Content-Type": "application/json" },

                body: JSON.stringify({ prompt: systemPrompt })

            });



            if (!response.ok) throw new Error("Server Error");



            const data = await response.json();

            if (data.success && data.text) {

                return data.text.trim();

            } else {

                throw new Error("AI Empty Response");

            }



        } catch (e) {

            console.error("🔴 [Curator] Generate Fail:", e);

            throw e;

        }

    }



    // 2. AUTO-TAG (Deterministic Logic)

    // Uses the existing Concierge Engine to find tags based on the text.

    function autoTag(description) {

        if (!window.NV_CONCIERGE || !window.NV_CONCIERGE.brain) {

            console.warn("⚠️ Concierge Brain not ready. Cannot auto-tag.");

            return [];

        }



        // Use the Brain's Intent Detection logic

        const analysis = window.NV_CONCIERGE.brain.detectIntents(description);



        // Return unique tags found + 'curated' tag

        const tags = new Set(analysis.tags);

        // tags.add('curated'); // Optional: Mark as AI touched



        console.log("🏷️ [Curator] Auto-Tags:", [...tags]);

        return [...tags];

    }



    return {

        generate,

        autoTag

    };



})();



console.log("✨ [Santis Curator] AI Bridge Online.");

