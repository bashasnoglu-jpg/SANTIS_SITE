import abc
import json
import hashlib
from pathlib import Path
from typing import Dict, Any

class StorageProvider(abc.ABC):
    """
    Abstract interface for Content Storage (iCOS 2.0). 
    Enables zero-code transition to S3 in the future.
    """
    @abc.abstractmethod
    async def write_blob(self, slug: str, content: Dict[str, Any]) -> str:
        """Writes content immutably and returns the SHA-256 hash."""
        pass
    
    @abc.abstractmethod
    async def read_blob(self, slug: str, version_hash: str) -> Dict[str, Any]:
        """Reads content by hash."""
        pass

class LocalBlobStorage(StorageProvider):
    def __init__(self, base_path: str = "assets/data/content/services"):
        import os
        # Ensure we always anchor to the project root where 'assets' actually lives
        project_root = Path(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
        self.base_path = project_root / base_path
    
    def _generate_hash(self, content: Dict[str, Any]) -> str:
        serialized = json.dumps(content, sort_keys=True).encode("utf-8")
        return hashlib.sha256(serialized).hexdigest()
        
    def _get_shard_path(self, slug: str, version_hash: str) -> Path:
        # Sharding pattern: ab/91/ab91c2f1...json to prevent local FS bottlenecks
        shard1 = version_hash[:2]
        shard2 = version_hash[2:4]
        return self.base_path / slug / shard1 / shard2 / f"{version_hash}.json"

    async def write_blob(self, slug: str, content: Dict[str, Any]) -> str:
        version_hash = self._generate_hash(content)
        file_path = self._get_shard_path(slug, version_hash)
        
        if not file_path.exists():
            file_path.parent.mkdir(parents=True, exist_ok=True)
            # Safe write pattern
            temp_path = file_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(content, f, indent=2, ensure_ascii=False)
            temp_path.replace(file_path)
            
        return version_hash

    async def read_blob(self, slug: str, version_hash: str) -> Dict[str, Any]:
        file_path = self._get_shard_path(slug, version_hash)
        if not file_path.exists():
            raise FileNotFoundError(f"Blob not found for hash: {version_hash}")
            
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)

def get_storage_provider() -> StorageProvider:
    """Dependency injection shortcut. Can return S3BlobStorage in the future."""
    return LocalBlobStorage()
