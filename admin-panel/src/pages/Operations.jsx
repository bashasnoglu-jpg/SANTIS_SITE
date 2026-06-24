import React from 'react';
import Navbar from '../components/Navbar';
import ReceptionTimeline from './ReceptionTimeline';

const Operations = () => {
    return (
        <div className="h-screen flex flex-col bg-santis-bg text-santis-text overflow-hidden">
            <Navbar />
            <div className="flex-1 w-full relative overflow-hidden">
                <ReceptionTimeline />
            </div>
        </div>
    );
};

export default Operations;
