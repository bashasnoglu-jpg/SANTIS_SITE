-- server/shadow-schema.sql
-- Sovereign OS: Shadow Analytics Ingestion Constitution

CREATE TABLE IF NOT EXISTS shadow_analytics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    max_stress_level INT,          
    avg_stress_level FLOAT,        
    final_plan_id VARCHAR(50),     
    conversion_status BOOLEAN DEFAULT FALSE, 
    calm_protocol_activated BOOLEAN DEFAULT FALSE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_conversion ON shadow_analytics(tenant_id, conversion_status);
CREATE INDEX IF NOT EXISTS idx_session_id ON shadow_analytics(session_id);

-- Boardroom için Hazır Isı Haritası (Heatmap) View'u
CREATE OR REPLACE VIEW sovereign_stress_heatmap AS
SELECT 
    CASE 
        WHEN max_stress_level >= 80 THEN 'Kritik Stres (%80+)'
        WHEN max_stress_level >= 50 THEN 'Orta Stres (%50-79)'
        ELSE 'Düşük Stres (<%50)'
    END AS stress_category,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN conversion_status = TRUE THEN 1 END) as successful_sales,
    ROUND(COUNT(CASE WHEN conversion_status = TRUE THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 2) as conversion_rate
FROM shadow_analytics
GROUP BY 
    CASE 
        WHEN max_stress_level >= 80 THEN 'Kritik Stres (%80+)'
        WHEN max_stress_level >= 50 THEN 'Orta Stres (%50-79)'
        ELSE 'Düşük Stres (<%50)'
    END
ORDER BY conversion_rate DESC;
