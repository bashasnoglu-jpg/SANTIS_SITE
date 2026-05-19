import re

with open('c:/Users/tourg/Desktop/SANTIS_SITE/admin/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the inner part of <main> after <header> with the viewport, and clear the massive inline script block.

# First, remove the massive `<script>` block at the bottom
html = re.sub(r'<script>\s*// SIDEBAR RESIZE.*?</script>', '', html, flags=re.DOTALL)
html = re.sub(r'<script\b(?![^>]*src=).*?</script>', '', html, flags=re.DOTALL)

# Now, target the <main> block.
# We want to keep <header> but replace everything after it with the viewport.
header_match = re.search(r'(<header.*?</header>)', html, flags=re.DOTALL)
if header_match:
    header = header_match.group(1)
    
    # Let's replace the whole main block
    main_replacement = f"""
        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden relative z-10 bg-gray-900">
            {header}

            <!-- SANTIS RUNTIME ENGINE VIEWPORT -->
            <div id="santis-master-viewport" class="w-full h-full flex flex-col transition-opacity duration-300 opacity-0 overflow-y-auto custom-scroll relative">
                <!-- Modules will inject here -->
            </div>
            
            <!-- GLOBAL CONTROL BUS SCRIPTS -->
            <script type="module">
                console.log("🟢 [Master Shell] Booting Control Bus...");
                
                // Sidebar Resize Logic
                const sidebar = document.getElementById('admin-sidebar');
                const dragHandle = document.getElementById('sidebar-drag-handle');
                let isResizing = false;

                if (dragHandle && sidebar) {{
                    dragHandle.addEventListener('mousedown', (e) => {{
                        isResizing = true;
                        document.body.style.cursor = 'col-resize';
                        dragHandle.classList.add('bg-gray-700');
                        e.preventDefault();
                    }});

                    document.addEventListener('mousemove', (e) => {{
                        if (!isResizing) return;
                        let newWidth = e.clientX;
                        if (newWidth < 240) newWidth = 240;
                        if (newWidth > 600) newWidth = 600;
                        sidebar.classList.remove('w-64');
                        sidebar.style.width = newWidth + 'px';
                    }});

                    document.addEventListener('mouseup', () => {{
                        if (isResizing) {{
                            isResizing = false;
                            document.body.style.cursor = 'default';
                            dragHandle.classList.remove('bg-gray-700');
                        }}
                    }});
                }}

                // Cortex Connections for Topbar & Sidebar
                // Assuming window.StateObserver will be available from santis-runtime.js
                const checkCortex = setInterval(() => {{
                    if (window.StateObserver) {{
                        clearInterval(checkCortex);
                        
                        const ac = new AbortController();
                        
                        // Example: Global status badge on topbar
                        window.StateObserver.subscribe('systemPulse', (status) => {{
                            const statusEl = document.getElementById('global-status-badge');
                            if (statusEl) {{
                                if (status === 'CRITICAL') {{
                                    statusEl.innerHTML = '<span class="text-red-500 font-bold animate-pulse">● SHIELD ALERT</span>';
                                }} else if (status === 'SURGE') {{
                                    statusEl.innerHTML = '<span class="text-amber-500 font-bold animate-pulse">● YIELD SURGE</span>';
                                }} else {{
                                    statusEl.innerHTML = '<span class="text-green-500 font-medium">● All Systems Nominal</span>';
                                }}
                            }}
                        }}, ac.signal);
                    }}
                }}, 100);
            </script>
        </main>
"""
    
    html = re.sub(r'<main.*?</main>', main_replacement, html, flags=re.DOTALL)
    
    # Give the topbar status a specific ID
    html = html.replace('<span class="text-green-500 font-medium">● All Systems Nominal</span>', '<span id="global-status-badge"><span class="text-green-500 font-medium">● All Systems Nominal</span></span>')
    
# Finally inject santis-runtime.js into <head>
if '</head>' in html:
    html = html.replace('</head>', '    <script type="module" src="/admin/assets/js/santis-runtime.js"></script>\n</head>')

with open('c:/Users/tourg/Desktop/SANTIS_SITE/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
