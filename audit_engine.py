
import os
import re
import time
import asyncio
import json
from enum import Enum
from pathlib import Path
from typing import List, Dict, Any, Generator

class AuditMode(Enum):
    FLASH = "flash"
    DEEP = "deep"

class AuditLevel(Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class AuditEvent:
    def __init__(self, type: str, data: Dict[str, Any]):
        self.type = type
        self.data = data
        self.timestamp = time.time()

    def to_json(self):
        return json.dumps({
            "type": self.type,
            "timestamp": self.timestamp,
            **self.data
        })

class AuditEngine:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.ignore_patterns = [
            ".git", "__pycache__", ".vscode", "node_modules", 
            "PROMPT_DROP_ZONE.txt", "*.bat", "*.py"
        ]
        self.scanned_count = 0
        self.asset_count = 0
        self.errors = []

    def _is_ignored(self, file_path: Path) -> bool:
        for pattern in self.ignore_patterns:
            # Glob-style patterns (e.g., *.bat)
            if "*" in pattern or "?" in pattern:
                if file_path.match(pattern):
                    return True
            else:
                # Directory / segment match (e.g., node_modules, .git)
                if pattern in file_path.parts:
                    return True
        return False

    async def run_flash_scan(self) -> Generator[str, None, None]:
        """
        Executes a 'Flash Scan' using static file analysis.
        Yields SSE-compatible event strings.
        """
        self.scanned_count = 0
        self.asset_count = 0
        self.errors = []
        
        yield f'data: {{"type":"start", "mode":"FLASH"}}\n\n'

        html_files = list(self.root_path.rglob("*.html"))
        total_files = len(html_files)

        for index, file_path in enumerate(html_files):
            if self._is_ignored(file_path):
                continue
            
            # Simulate slight delay for UI feel (can be removed for pure speed)
            await asyncio.sleep(0.0) 
            
            relative_path = file_path.relative_to(self.root_path)
            self.scanned_count += 1
            
            # Basic Analysis
            try:
                # Optimized Non-Blocking Read
                loop = asyncio.get_event_loop()
                # Run sync read in thread pool to avoid blocking main loop
                content = await loop.run_in_executor(None, file_path.read_text, "utf-8")
                
                # Check 1: Title Tag
                if "<title>" not in content:
                    self.errors.append({
                        "file": str(relative_path),
                        "issue": "Missing <title> tag",
                        "level": AuditLevel.WARNING.value
                    })

                # Check 2: Broken Local Links (Simple Regex)
                # Finds src="..." or href="..."
                links = re.findall(r'(?:src|href)=["\'](.*?)["\']', content)
                self.asset_count += len(links)
                
                # Report Progress
                progress = {
                    "type": "progress",
                    "scanned": self.scanned_count,
                    "total": total_files,
                    "assets": self.asset_count,
                    "current_file": str(relative_path)
                }
                yield f'data: {json.dumps(progress)}\n\n'

            except Exception as e:
                self.errors.append({
                    "file": str(relative_path),
                    "issue": f"Read Error: {str(e)}",
                    "level": AuditLevel.CRITICAL.value
                })

        # Final Report
        result = {
            "type": "done",
            "scanned": self.scanned_count,
            "assets": self.asset_count,
            "errors": self.errors,
            "score": self._calculate_score()
        }
        yield f'data: {json.dumps(result)}\n\n'


    def _calculate_score(self) -> int:
        base_score = 100
        deductions = len(self.errors) * 5
        return max(0, base_score - deductions)

# Usage Example:
# engine = AuditEngine(".")
# async for event in engine.run_flash_scan():
#     print(event)
