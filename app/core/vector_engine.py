import os
import json
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Union

# Optional: To avoid HuggingFace token warnings warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

class SovereignVectorEngine:
    """
    Santis OS Faz 3: Semantik Vektör Uzayı (The Vector Core)
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SovereignVectorEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        print("🌌 [Vector Engine] Neural CLIP Modeli Yükleniyor...")
        try:
            from sentence_transformers import SentenceTransformer
            # clip-ViT-B-32 modeli ile hem görsel hem metinler 512 boyutlu 
            # aynı vektör uzayına haritalanabilir.
            self.model = SentenceTransformer('clip-ViT-B-32')
            self._initialized = True
            print("⚡ [Vector Engine] CLIP Modeli Çevrimiçi.")
        except ImportError:
            print("⚠️ [Vector Engine] 'sentence-transformers' kütüphanesi bulunamadı! Lütfen kurun.")
            self.model = None
            self._initialized = False

    def extract_dna(self, image_path: str) -> List[float]:
        """Görselin semantik ruhunu 512 boyutlu bir vektöre (DNA) çevirir."""
        if not self._initialized or not self.model:
            raise RuntimeError("Vektör motoru başlatılamadı.")
            
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Görsel bulunamadı: {image_path}")

        try:
            image = Image.open(image_path).convert("RGB")
            # Encode image to a 512-d vector
            vector_dna = self.model.encode(image)
            return vector_dna.tolist()
        except Exception as e:
            print(f"❌ [Vector Engine] Core DNA extraction failed: {e}")
            raise

    def extract_text_dna(self, text: str) -> List[float]:
        """Metnin semantik ruhunu (örn: 'Lüks Hamam Deneyimi') vektöre çevirir."""
        if not self._initialized or not self.model:
            raise RuntimeError("Vektör motoru başlatılamadı.")
            
        try:
            vector_dna = self.model.encode(text)
            return vector_dna.tolist()
        except Exception as e:
            print(f"❌ [Vector Engine] Text DNA extraction failed: {e}")
            raise

    def cosine_similarity(self, vec1: Union[np.ndarray, List[float]], vec2: Union[np.ndarray, List[float]]) -> float:
        """Kosinüs Benzerliği (Cosine Similarity) hesaplar. Dönen sonuç -1 ile 1 arasındadır."""
        v1 = np.array(vec1) if isinstance(vec1, list) else vec1
        v2 = np.array(vec2) if isinstance(vec2, list) else vec2
        
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
            
        return float(dot_product / (norm_v1 * norm_v2))

    def search_similar_agents(self, query_vector: List[float], vectors_db: Dict[str, List[float]], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        In-Memory Kosinüs Benzerliği araması. Gerçek prodüksiyonda pgvector/Qdrant üzerinde çalışacak.
        :param query_vector: Aranacak olan ajanın DNA'sı (512 boyut)
        :param vectors_db: Aranacak havuz {"asset_id": [0.1, 0.4, ...]}
        """
        results = []
        q_vec = np.array(query_vector)
        
        for asset_id, v in vectors_db.items():
            sim_score = self.cosine_similarity(q_vec, v)
            results.append({
                "asset_id": asset_id,
                "similarity": sim_score
            })
            
        # Benzerliğe göre azalan sırada sırala (1'e ne kadar yakınsa o kadar iyi)
        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]

# Singleton instance export 
vector_core = SovereignVectorEngine()
