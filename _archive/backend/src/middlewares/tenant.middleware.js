// Tenant Isolation Middleware (The V9 Security Gatekeeper)
const tenantMiddleware = (req, res, next) => {
    // Rely on req.user injected by authMiddleware
    if (!req.user) {
        return res.status(401).json({ error: 'Session required to identify tenant.' });
    }

    const { role, hotel_id } = req.user;

    // 1. Platform Admins can see everything OR specific tenant if requested via query/param
    if (role === 'platform_admin') {
        // Option to impersonate tenant
        req.tenantId = req.query.hotel_id || req.body.hotel_id || null;
        return next();
    }

    // 2. Hotel Admins/Staff MUST have a valid hotel_id
    if (!hotel_id) {
        return res.status(403).json({ error: 'Unauthorized: Missing tenant ID for local staff.' });
    }

    // 3. Prevent Tenant Manipulation (e.g., trying to access another hotel's data)
    const requestedHotelId = req.query.hotel_id || req.body.hotel_id;
    if (requestedHotelId && requestedHotelId !== hotel_id) {
        return res.status(403).json({ error: 'Unauthorized: Cannot manipulate parameters outside of assigned tenant.' });
    }

    // 4. Inject safe tenant ID into the request for Controllers to use
    req.tenantId = hotel_id;
    next();
};

module.exports = tenantMiddleware;
