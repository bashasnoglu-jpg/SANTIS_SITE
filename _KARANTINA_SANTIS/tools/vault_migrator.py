import os
import re

file_path = 'c:/Users/tourg/Desktop/SANTIS_SITE/guest-zen/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Init block
init_pattern = r"""let chatContext = \[\];
        try \{ 
            chatContext = JSON\.parse.*?
            \}
        \} catch\(e\)\{\}"""

init_repl = """let chatContext = [];
        SantisVault.getItem('nv_neural_history').then(hist => {
            if(hist) {
                chatContext = typeof hist === 'string' ? JSON.parse(hist) : hist;
                if(chatContext.length > 10) {
                    chatContext = chatContext.slice(-10);
                    SantisVault.setItem('nv_neural_history', chatContext);
                }
            }
        });"""
content = re.sub(init_pattern, init_repl, content, flags=re.DOTALL)

# 2. nv_neural_history setItem
content = re.sub(
    r"localStorage\.setItem\('nv_neural_history',\s*JSON\.stringify\(chatContext\)\);?",
    "SantisVault.setItem('nv_neural_history', chatContext);",
    content
)
content = re.sub(
    r"try\s*\{\s*localStorage\.setItem\('nv_neural_history',\s*JSON\.stringify\(chatContext\)\);\s*\}\s*catch\([^)]+\)\s*\{\s*\}",
    "SantisVault.setItem('nv_neural_history', chatContext);",
    content
)

# 3. nv_ghost_triggered getItem
content = re.sub(
    r"try\s*\{\s*if\s*\(localStorage\.getItem\('nv_ghost_triggered'\)\s*===\s*'true'\)\s*\{\s*nvGhostTriggered\s*=\s*true;\s*\}\s*\}\s*catch\([^)]+\)\s*\{\s*\}",
    "SantisVault.getItem('nv_ghost_triggered').then(res => { if(res) nvGhostTriggered = true; });",
    content
)

# 4. nv_ghost_triggered setItem
content = re.sub(
    r"try\s*\{\s*localStorage\.setItem\('nv_ghost_triggered',\s*'true'\);\s*\}\s*catch\([^)]+\)\s*\{\s*\}",
    "SantisVault.setItem('nv_ghost_triggered', true);",
    content
)

# 5. nv_exit_triggered getItem
content = re.sub(
    r"try\s*\{\s*if\s*\(localStorage\.getItem\('nv_exit_triggered'\)\s*===\s*'true'\)\s*nvExitTriggered\s*=\s*true;\s*\}\s*catch\([^)]+\)\s*\{\s*\}",
    "SantisVault.getItem('nv_exit_triggered').then(res => { if(res) nvExitTriggered = true; });",
    content
)

# 6. nv_exit_triggered setItem
content = re.sub(
    r"try\s*\{\s*localStorage\.setItem\('nv_exit_triggered',\s*'true'\);\s*\}\s*catch\([^)]+\)\s*\{\s*\}",
    "SantisVault.setItem('nv_exit_triggered', true);",
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vault Migration for guest-zen Complete!")
