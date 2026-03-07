
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);

    const isActive = (path) => location.pathname === path
        ? "text-santis-gold border-b-2 border-santis-gold"
        : "text-gray-400 hover:text-white";

    return (
        <nav className="bg-[#1a1a1a] border-b border-[#333] px-8 py-4 flex justify-between items-center mb-8">
            <div className="flex items-center space-x-8">
                <div className="text-xl font-bold text-white tracking-widest">SANTIS <span className="text-santis-gold">OS</span></div>
                <div className="flex space-x-6 text-sm font-medium">
                    <Link to="/" className={`py-2 transition-colors ${isActive('/')}`}>
                        Dashboard
                    </Link>
                    <Link to="/operations" className={`py-2 transition-colors ${isActive('/operations')}`}>
                        Operations
                    </Link>
                    <Link to="/finance" className={`py-2 transition-colors ${isActive('/finance')}`}>
                        Finance
                    </Link>
                </div>
            </div>
            <button
                onClick={logout}
                className="text-xs text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
            >
                Logout
            </button>
        </nav>
    );
};

export default Navbar;
