/**

 * 🧠 SANTIS BRAIN - NEURAL BRIDGE v2.0 (HYBRID CLOUD)

 * The Central Nervous System.

 * Connects:

 * 1. Local Tabs (via BroadcastChannel) -> Zero Latency

 * 2. Remote Devices (via WebSocket) -> Cloud Sync

 * 

 * ✅ ONLINE MODE: WebSocket enabled (server.py running)

 */

const BRAIN_OFFLINE_MODE = false; // Set to true if no server
// const BRAIN_OFFLINE_MODE = true; // Use this for dev without server



window.SantisBrain = (function () {

    // 1. LOCAL CHANNEL (Tab-to-Tab)

    const CHANNEL_NAME = "santis_brain";

    const localChannel = new BroadcastChannel(CHANNEL_NAME);



    // 2. NETWORK LINK (Device-to-Device)

    let ws = null;

    let isConnected = false;

    const WS_URL = `ws://${window.location.hostname || 'localhost'}:8000/ws`;



    // Event Types

    const EVENTS = {

        PRODUCT_UPDATED: "PRODUCT_UPDATED",

        SYSTEM_RESET: "SYSTEM_RESET",

        PING: "PING"

    };



    function init() {
        console.log("🧠 [Brain] Initializing Hybrid System...");
        // Skip WebSocket if offline mode

        if (!BRAIN_OFFLINE_MODE) {

            connectWebSocket();

        } else {

            console.log("🧠 [Brain] Running in OFFLINE mode (WebSocket disabled)");

        }



        // Listen to Local Broadcasts (always active)

        localChannel.onmessage = (event) => {

            handleSignal(event.data, 'local');

        };

    }



    function connectWebSocket() {

        try {

            ws = new WebSocket(WS_URL);



            ws.onopen = () => {

                console.log("🌩️ [Brain] Connected to Cloud (WebSocket).");

                isConnected = true;

                notifyListeners('CLOUD_STATUS', { online: true });

            };



            ws.onmessage = (event) => {

                try {

                    const data = JSON.parse(event.data);

                    // Handle Echo Prevention (Don't re-broadcast what I sent)

                    if (data.source === 'self') return;



                    handleSignal(data, 'cloud');

                } catch (e) {

                    // Ignore non-JSON

                }

            };



            ws.onclose = () => {

                console.log("🌩️ [Brain] Cloud Disconnected. Retrying in 5s...");

                isConnected = false;

                notifyListeners('CLOUD_STATUS', { online: false });

                setTimeout(connectWebSocket, 5000); // Auto-Retry

            };



            ws.onerror = (err) => {

                // accessible via console

            };



        } catch (e) {

            console.error("Brain Connection Fail:", e);

        }

    }



    // CENTRAL SIGNAL PROCESSOR

    const listeners = [];



    function listen(callback) {

        listeners.push(callback);

    }



    function notifyListeners(type, payload) {

        listeners.forEach(cb => { if (typeof cb === 'function') cb(type, payload); });

    }



    function handleSignal(data, source) {
        // DEBUG: Raw Signal Trap
        if (source === 'cloud') console.log("🔥 [Brain] RAW CLOUD MSG:", data);

        let { type, payload } = data;

        // 🛠️ PROTOCOL COMPATIBILITY LAYER
        // Server sometimes sends flat messages: { type: 'update', file: '...' }
        // Brain expects: { type: 'update', payload: { file: '...' } }
        // We normalize this here to ensure listeners get data.
        if (!payload) {
            if (data.file) payload = { file: data.file };
            else if (data.text) payload = { text: data.text }; // For AI responses
            else payload = data; // Fallback: Pass everything
        }

        // 1. Notify Internal Listeners (UI Code)

        notifyListeners(type, payload);



        // 2. Relay Logic (Bridge)

        // If received from Local, send to Cloud.
        if (source === 'local' && isConnected && ws) {

            // Prevent infinite loop by adding tag, but simplified:

            // We just fire-and-forget to cloud.

            // Ideally server prevents echo back to sender, but for now simple relay.

            ws.send(JSON.stringify({ type, payload }));

        }



        // If received from Cloud, send to Local (so other tabs update)

        if (source === 'cloud') {

            // We don't rebroadcast to localChannel usually to avoid loops if circular,

            // But valid use case: Cloud -> Tab 1 -> Tab 2.

            // For now, let's keep it simple: UI updates directly from listeners.

        }

    }



    /**

     * Broadcast a signal to the ENTIRE network (Local + Cloud)

     */

    function broadcast(type, payload = {}) {

        const packet = { type, payload, timestamp: Date.now() };



        // 1. Send Local

        localChannel.postMessage(packet);



        // 2. Send Cloud

        if (isConnected && ws) {

            ws.send(JSON.stringify(packet));

        }



        // 3. Trigger Self (Optional, usually UI handles own change, but for consistency)

        // notifyListeners(type, payload); 

    }



    // Auto Init

    init();



    return {

        broadcast,

        listen,
        EVENTS,
        get isConnected() { return isConnected; },
        get socket() { return ws; }

    };

})();

