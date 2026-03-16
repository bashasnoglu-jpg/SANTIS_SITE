
import React from 'react';
import Navbar from '../components/Navbar';

const Finance = () => {
    return (
        <div className="min-h-screen bg-santis-bg text-santis-text">
            <Navbar />
            <div className="p-8 max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-white">Finance</h1>
                <p className="text-santis-muted mt-4">Financial reports and settings coming soon.</p>
            </div>
        </div>
    );
};

export default Finance;
