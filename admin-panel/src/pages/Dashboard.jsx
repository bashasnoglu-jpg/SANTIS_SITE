import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Users, Calendar } from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/dashboard/StatCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import Navbar from '../components/Navbar';

const fetchDashboardData = async () => {
    // Fetch last 30 days by default (backend handles null dates)
    const response = await api.get('/revenue/daily');
    return response.data;
};

const Dashboard = () => {
    const { data, isLoading, error } = useQuery({
        queryKey: ['dashboardRevenue'],
        queryFn: fetchDashboardData,
        refetchInterval: 60000, // Refresh every minute
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-santis-bg flex items-center justify-center">
                <div className="text-santis-gold animate-pulse text-xl">Loading Ultra Mega Dashboard...</div>
            </div>
        );
    }

    if (error) {
        const errorDetail = error.response?.data?.error || error.response?.data?.detail || error.message;
        const errorTrace = error.response?.data?.trace;

        return (
            <div className="min-h-screen bg-santis-bg flex flex-col items-center justify-center text-santis-error p-8">
                <h2 className="text-2xl font-bold mb-4">Dashboard Error</h2>
                <div className="bg-red-900/30 p-6 rounded-lg border border-red-500/50 max-w-4xl w-full overflow-auto">
                    <p className="text-lg font-mono mb-4">{errorDetail}</p>
                    {errorTrace && (
                        <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap border-t border-red-500/30 pt-4 mt-4">
                            {errorTrace}
                        </pre>
                    )}
                </div>
            </div>
        );
    }

    // Defensive defaults so the UI never crashes if the API returns an unexpected payload
    const revenue_stats = data?.revenue_stats ?? {
        total_revenue: 0,
        total_bookings: 0,
        daily_breakdown: [],
    };
    const top_staff = data?.top_staff ?? [];
    const top_services = data?.top_services ?? [];

    const { total_revenue, total_bookings, daily_breakdown } = revenue_stats;

    return (
        <div className="min-h-screen bg-santis-bg text-santis-text">
            <Navbar />
            <div className="p-8 max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Owner Dashboard</h1>
                        <p className="text-santis-muted mt-1">Real-time revenue intelligence</p>
                    </div>
                    <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-santis-card border border-santis-border rounded-lg text-sm hover:border-santis-gold transition-colors">
                            Last 30 Days
                        </button>
                        <button className="px-4 py-2 bg-santis-gold text-black font-medium rounded-lg text-sm hover:bg-yellow-500 transition-colors">
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Total Revenue"
                        value={`€${total_revenue}`}
                        icon={DollarSign}
                        trend="up"
                        trendValue="+12.5%"
                    />
                    <StatCard
                        title="Total Bookings"
                        value={total_bookings}
                        icon={Calendar}
                        color="text-blue-400"
                        trend="down"
                        trendValue="-2.1%"
                    />
                    <StatCard
                        title="Avg Ticket"
                        value={`€${total_bookings > 0 ? (total_revenue / total_bookings).toFixed(1) : 0}`}
                        icon={Users}
                        color="text-purple-400"
                        trendValue="Stable"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Chart (2/3 width) */}
                    <div className="lg:col-span-2">
                        <RevenueChart data={daily_breakdown} />
                    </div>

                    {/* Top Staff / Services (1/3 width) */}
                    <div className="space-y-6">
                        {/* Top Staff */}
                        <div className="bg-santis-card p-6 rounded-xl border border-santis-border shadow-lg">
                            <h3 className="text-lg font-semibold text-white mb-4">Top Staff</h3>
                            <div className="space-y-4">
                                {top_staff.map((staff, i) => (
                                    <div key={staff.id} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-santis-bg border border-santis-border flex items-center justify-center text-xs text-santis-muted">
                                                {i + 1}
                                            </div>
                                            <span className="ml-3 font-medium">{staff.name}</span>
                                        </div>
                                        <span className="text-santis-gold font-bold">€{staff.revenue}</span>
                                    </div>
                                ))}
                                {top_staff.length === 0 && <p className="text-santis-muted text-sm">No data yet.</p>}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
