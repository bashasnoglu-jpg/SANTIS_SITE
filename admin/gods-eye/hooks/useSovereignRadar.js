// hooks/useSovereignRadar.js
import { useState, useEffect } from 'react';

export function useSovereignRadar() {
    const [threats, setThreats] = useState([]);
    const [degradations, setDegradations] = useState([]);
    const [streams, setStreams] = useState({});

    useEffect(() => {
        // Port 4040 üzerinde dinleyen Core Gateway'e GODS_EYE yetkisiyle bağlanıyoruz
        const ws = new WebSocket('ws://localhost:4040');

        ws.onopen = () => {
            console.log("[GOD'S EYE] Connected to Core Gateway Uplink.");
            ws.send(JSON.stringify({
                type: 'AUTH',
                role: 'GODS_EYE',
                secret: 'SOVEREIGN_ADMIN_KEY_19X'
            }));
        };

        ws.onmessage = (event) => {
            try {
                const packet = JSON.parse(event.data);

                // Paket tiplerine göre state'i güncelle (React immutability prensipleriyle)
                switch (packet.type) {
                    case 'THREAT_PULSE':
                        setThreats(prev => [{
                            id: Date.now(),
                            client: packet.client,
                            payload: packet.payload
                        }, ...prev].slice(0, 10)); // Sadece en yeni 10 uyarı
                        break;

                    case 'DEGRADATION_WARN':
                        setDegradations(prev => [{
                            id: Date.now(),
                            client: packet.client,
                            payload: packet.payload
                        }, ...prev].slice(0, 10));
                        break;

                    case 'ORBITAL_STREAM':
                        setStreams(prev => {
                            const newStreams = { ...prev };
                            newStreams[packet.payload.fileId] = {
                                fileId: packet.payload.fileId,
                                percent: packet.payload.percent,
                                speed: packet.payload.speed,
                                visitorId: packet.client.visitorId
                            };
                            return newStreams;
                        });
                        break;

                    default:
                        console.log("[GOD'S EYE] Unknown Packet:", packet);
                        break;
                }
            } catch (err) {
                console.error("[GOD'S EYE] Radar Decrypt Error:", err);
            }
        };

        ws.onclose = () => {
            console.warn("[GOD'S EYE] Connection to Core Gateway lost! Reconnecting in 5s...");
            // İstersen buraya bir reconnect mantığı yazabilirsin
        };

        return () => {
            // Bileşen unmount olunca soketi temizle
            ws.close();
        };
    }, []);

    return { threats, degradations, streams: Object.values(streams) };
}
