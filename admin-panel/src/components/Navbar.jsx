import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const [loggingOut, setLoggingOut] = useState(false);

    const isActive = (path) => location.pathname === path
        ? "text-santis-gold border-b-2 border-santis-gold"
        : "text-gray-400 hover:text-white";

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logout();
            navigate('/login', { replace: true });
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <header id="nv-header">
            <nav id="nv-main-nav" aria-label="Main Navigation" className="nv-navbar-container">
                <div className="flex items-center space-x-8">
                    <Link to="/" className="nv-logo" aria-label="SANTIS OS Home">SANTIS <span className="text-santis-gold">OS</span></Link>
                    <div className="flex space-x-6">
                        <Link to="/" className={`nv-nav-link ${isActive('/') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`} aria-current={isActive('/') ? 'page' : undefined}>Dashboard</Link>
                        <Link to="/operations" className={`nv-nav-link ${isActive('/operations') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`} aria-current={isActive('/operations') ? 'page' : undefined}>Operations</Link>
                        <Link to="/services" className={`nv-nav-link ${isActive('/services') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`} aria-current={isActive('/services') ? 'page' : undefined}>Services</Link>
                        <Link to="/finance" className={`nv-nav-link ${isActive('/finance') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`} aria-current={isActive('/finance') ? 'page' : undefined}>Finance</Link>
                    </div>
                </div>
                <button onClick={handleLogout} disabled={loggingOut} className="text-xs text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider disabled:opacity-60" aria-label="Log out of application">
                    {loggingOut ? 'Logging out…' : 'Logout'}
                </button>
            </nav>
        </header>
    );
};

export default Navbar;
