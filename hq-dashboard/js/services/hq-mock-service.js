export function getMockHQData() {
    return {
        network: { total_tenants: 18, total_hotels: 20 },
        performance: { today_revenue: 18400, today_bookings: 181 },
        yieldStatus: { multiplier: 1.05, action: 'MAINTAIN' },
        aiInsight: { 
            text: 'Primary Revenue Engine. All systems nominal.', 
            latency: 12, 
            staffing: 'Optimal' 
        },
        feed: [
            { id: '1', booked_at: '11:49', hotel_name: 'Delphin Imperial', room_number: 'Room 414', service_name: 'Turkish Hammam', status: 'PENDING', price_charged: 122 },
            { id: '2', booked_at: '11:48', hotel_name: 'Titanic Mardan', room_number: 'Room 120', service_name: 'Couple Romance', status: 'CONFIRMED', price_charged: 177 },
            { id: '3', booked_at: '11:47', hotel_name: 'Titanic Mardan', room_number: 'Room 635', service_name: 'Jet Lag Recovery', status: 'CONFIRMED', price_charged: 206 },
            { id: '4', booked_at: '11:46', hotel_name: 'Budva Luxury Spa', room_number: 'Room 627', service_name: 'Deep Tissue', status: 'PENDING', price_charged: 148 }
        ],
        forecast: {
            historical: { 
                labels: ['00:00','04:00','08:00','12:00'], 
                data: [12000, 13000, 15000, 18400] 
            },
            ai: { 
                labels: ['16:00','20:00','00:00'], 
                data: [21000, 24000, 26000] 
            }
        },
        heatmap: {
            insight: 'Sovereign Sentinel: Antalya Core performing 15% above yesterday. Budva node shows high potential.',
            data: [
                { country: 'Germany', aov: 520, conversion_rate: 4.8, trend: '+1.2%' },
                { country: 'United Kingdom', aov: 410, conversion_rate: 3.9, trend: '+2.5%' },
                { country: 'Turkey (TR)', aov: 180, conversion_rate: 8.5, trend: '+4.0%' }
            ]
        }
    };
}
