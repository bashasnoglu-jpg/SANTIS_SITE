
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const Navbar = () => {
    const location = useLocation();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);

    const isActive = (path) => location.pathname === path
        ? "text-santis-gold border-b-2 border-santis-gold"
        : "text-gray-400 hover:text-white";

    return (
        <header id="nv-header">
            <nav id="nv-main-nav" aria-label="Main Navigation" className="nv-navbar-container">
                <div className="flex items-center space-x-8">
                    <Link to="/" className="nv-logo" aria-label="SANTIS OS Home">
                        SANTIS <span className="text-santis-gold">OS</span>
                    </Link>
                    <div className="flex space-x-6">
                        <Link 
                            to="/" 
                            className={`nv-nav-link ${isActive('/') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`}
                            aria-current={isActive('/') ? 'page' : undefined}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to="/operations" 
                            className={`nv-nav-link ${isActive('/operations') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`}
                            aria-current={isActive('/operations') ? 'page' : undefined}
                        >
                            Operations
                        </Link>
                        <Link 
                            to="/services" 
                            className={`nv-nav-link ${isActive('/services') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`}
                            aria-current={isActive('/services') ? 'page' : undefined}
                        >
                            Services
                        </Link>
                        <Link 
                            to="/finance" 
                            className={`nv-nav-link ${isActive('/finance') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`}
                            aria-current={isActive('/finance') ? 'page' : undefined}
                        >
                            Finance
                        </Link>
                        {user?.canAccessSetupWizard === true && (
                            <Link 
                                to="/setup" 
                                className={`nv-nav-link ${isActive('/setup') ? 'nv-nav-link-active' : 'nv-nav-link-inactive'}`}
                                aria-current={isActive('/setup') ? 'page' : undefined}
                            >
                                Kurulum Sihirbazı
                            </Link>
                        )}
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider"
                    aria-label="Log out of application"
                >
                    Logout
                </button>
            </nav>
        </header>
    );
};

export default Navbar;
