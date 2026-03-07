import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = "text-santis-gold" }) => {
    return (
        <div className="bg-santis-card p-6 rounded-xl border border-santis-border shadow-lg hover:border-santis-gold/50 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-santis-muted text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
                </div>
                <div className={`p-2 bg-santis-bg rounded-lg ${color}`}>
                    <Icon size={20} />
                </div>
            </div>

            {(trend || trendValue) && (
                <div className="mt-4 flex items-center text-sm">
                    {trend === 'up' ? (
                        <span className="text-santis-success flex items-center">
                            <ArrowUpRight size={16} className="mr-1" />
                            {trendValue}
                        </span>
                    ) : trend === 'down' ? (
                        <span className="text-santis-error flex items-center">
                            <ArrowDownRight size={16} className="mr-1" />
                            {trendValue}
                        </span>
                    ) : (
                        <span className="text-santis-muted">{trendValue}</span>
                    )}
                    <span className="text-santis-muted ml-2">vs last period</span>
                </div>
            )}
        </div>
    );
};

export default StatCard;
