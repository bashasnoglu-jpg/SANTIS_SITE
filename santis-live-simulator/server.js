// server.js (Node.js Kuantum Verici)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8082 }); // Changed port to 8082 to avoid Live Server conflict

console.log("⚡ Sovereign Backend Uyanık (Port: 8082). Ajan bekleniyor...");

wss.on('connection', (ws) => {
    console.log("💎 Kuantum Ajanı (Titan Worker) Ağımıza Bağlandı!");

    // Saniyede 2 kez canlı veri pompala (Gerçek zamanlı stres testi)
    const interval = setInterval(() => {
        const payload = JSON.stringify({
            friction: Math.floor(Math.random() * 40),      // Kognitif Stres (0-40)
            activeUsers: Math.floor(Math.random() * 300 + 1200), // Canlı Kullanıcı (1200-1500)
            throughput: parseFloat((Math.random() * 20 + 5).toFixed(2)) // Satış Hızı
        });
        ws.send(payload);
    }, 500);

    ws.on('close', () => {
        console.log("⚠️ Ajan Bağlantıyı Kesti.");
        clearInterval(interval);
    });
});
