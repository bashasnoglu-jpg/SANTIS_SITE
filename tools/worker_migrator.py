import re
import codecs

file_path = 'c:/Users/tourg/Desktop/SANTIS_SITE/guest-zen/index.html'

with codecs.open(file_path, 'r', 'utf-8') as f:
    html = f.read()

worker_init = """        // --- THE WORKER THREAD (YAPAY ZEKA İZOLESİ) ---
        const aiWorker = new Worker('/assets/js/santis-ai-worker.js');
        function fetchAIResponse(payload) {
            return new Promise((resolve, reject) => {
                aiWorker.onmessage = (e) => {
                    if (e.data.status === 'success') resolve(e.data.data);
                    else reject(e.data.error);
                };
                aiWorker.postMessage({ action: 'FETCH_AI_RESPONSE', payload, apiBase: API_BASE });
            });
        }
        
        let chatContext = [];"""

html = re.sub(r'let chatContext = \[\];', worker_init, html, count=1)

fetch_pattern_1 = r"""const res = await fetch\(`\$\{API_BASE\}/ai/concierge-chat`, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application/json' \},\s*body: JSON\.stringify\(payload\)\s*\}\);\s*const data = await res\.json\(\);"""

replace_fetch_1 = """const data = await fetchAIResponse(payload);"""

html = re.sub(fetch_pattern_1, replace_fetch_1, html)

with codecs.open(file_path, 'w', 'utf-8') as f:
    f.write(html)

print("AI Worker Integration applied to guest-zen.")
