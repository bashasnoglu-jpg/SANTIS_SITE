import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
    // Data format expected: [{ date: '2023-01-01', revenue: 100, bookings: 2 }]

    if (!data || data.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-santis-muted">No data available</div>;
    }

    return (
        <div className="bg-santis-card p-6 rounded-xl border border-santis-border shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6">Revenue Trend</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#404040" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#a3a3a3"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#a3a3a3"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `€${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#262626', borderColor: '#404040', color: '#e5e5e5' }}
                            itemStyle={{ color: '#d4af37' }}
                            formatter={(value) => [`€${value}`, 'Revenue']}
                        />
                        <Area
                            type="monotone"
                            dataKey="daily_revenue"
                            stroke="#d4af37"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
