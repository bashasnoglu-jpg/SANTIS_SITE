-- SANTIS OS (Phase 32)
-- LUA Filter for Fluent Bit: High Cardinality Behavioral Telemetry Shaping
-- This filter crushes raw user metrics (like exact ms timestamps for dwell time or pixel-perfect mouse coordinates)
-- into deterministic grouped buckets to prevent index explosion in OpenObserve.

function shape_cardinality(tag, timestamp, record)
    -- Grouping Dwell Time (Saniye bazlı kesin sayıları bucketlara çevir)
    if record["dwell_time_ms"] ~= nil then
        local ms = tonumber(record["dwell_time_ms"])
        if ms < 5000 then
            record["dwell_bucket"] = "<5s (Bounce)"
        elseif ms < 15000 then
            record["dwell_bucket"] = "5s-15s (Scan)"
        elseif ms < 60000 then
            record["dwell_bucket"] = "15s-60s (Read)"
        else
            record["dwell_bucket"] = ">60s (Absorbed)"
        end
        -- Orijinal mikrosaniyeyi tutmaya gerek yoksa silinebilir, 
        -- God's Eye Aggregation için Bucket yeterlidir.
        record["dwell_time_ms"] = nil
    end

    -- Rage Click Thresholding (3'ün altındaki değerleri sıfırla/sil, sadece krizi gönder)
    if record["rage_clicks"] ~= nil then
        local clicks = tonumber(record["rage_clicks"])
        if clicks < 3 then
            record["rage_clicks"] = nil
        else
            record["behavior_flag"] = "RAGE_DETECTED"
        end
    end

    -- Friction Score Aggregation
    if record["system_friction"] ~= nil then
        local score = tonumber(record["system_friction"])
        if score > 80 then
            record["friction_level"] = "CRITICAL"
        elseif score > 50 then
            record["friction_level"] = "WARNING"
        else
            record["friction_level"] = "NORMAL"
        end
    end

    return 2, timestamp, record
end
