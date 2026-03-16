const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_santis_key_2026');
        req.user = decoded; // Contains id, role, hotel_id, etc.
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Forbidden: Token expired or invalid' });
    }
};

module.exports = authMiddleware;
