async function routes(fastify, options) {
    // ----------------------------------------------------
    // ☠️ LEGACY OMNIVERSE ROUTES DEPRECATED (Phase 10)
    // ----------------------------------------------------
    // All routes previously bound here (/media, /analytics) 
    // are now handled exclusively by Sovereign Modules:
    //  - backend/src/routes/media.js
    //  - backend/src/routes/analytics.js
    // Retaining plugin structure to prevent import errors.
}

module.exports = routes;
