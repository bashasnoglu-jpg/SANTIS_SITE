import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTheme } from '../../../../packages/design-system/chart-theme';

const RevenueChart = ({ data }) => {
    // Data format expected: [{ date: '2023-01-01', revenue: 100, bookings: 2 }]

    if (!data || data.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-santis-muted">No data available</div>;
    }

    return (
        <div className="bg-santis-card p-6 rounded-xl border border-santis-border shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-6">Revenue Trend</h3>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height={300} minWidth={100} minHeight={100}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartTheme.primaryStrong} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={chartTheme.primaryStrong} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke={chartTheme.axis}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke={chartTheme.axis}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `€${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, color: chartTheme.tooltipText }}
                            itemStyle={{ color: chartTheme.primaryStrong }}
                            formatter={(value) => [`€${value}`, 'Revenue']}
                        />
                        <Area
                            type="monotone"
                            dataKey="daily_revenue"
                            stroke={chartTheme.primaryStrong}
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
