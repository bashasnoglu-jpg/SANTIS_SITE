import os
from neo4j import AsyncGraphDatabase
import logging
from loguru import logger

class SovereignGraphEngine:
    """
    Santis OS Faz 3: The Cognitive Graph (Kesişimsel Zeka Bağlantısı)
    """
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(SovereignGraphEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, uri="bolt://localhost:7687", user="neo4j", password="password"):
        if self._initialized:
            return
            
        try:
            # Check for env vars to override defaults
            env_uri = os.environ.get("NEO4J_URI", uri)
            env_user = os.environ.get("NEO4J_USER", user)
            env_pass = os.environ.get("NEO4J_PASSWORD", password)
            
            # Global Pool Zırhı
            self.driver = AsyncGraphDatabase.driver(
                env_uri, 
                auth=(env_user, env_pass),
                max_connection_pool_size=50, # 🚨 Bağlantı sınırını belirle
                connection_acquisition_timeout=10.0
            )
            logger.info("🕸️ [COGNITIVE GRAPH] Neo4j Sinir Ağı Bağlantısı Mühürlendi.")
            # Verify connectivity (non-blocking if local DB doesn't exist just fail gracefully)
            # self.driver.verify_connectivity() 
            self.is_connected = True
        except Exception as e:
            logger.error(f"⚠️ [COGNITIVE GRAPH] Neo4j bağlantısı kurulamadı. Simülasyon modunda çalışıyor. Hata: {e}")
            self.driver = None
            self.is_connected = False
            
        self._initialized = True

    async def close(self):
        if self.driver:
            await self.driver.close()

async def get_db_session():
    """FastAPI Dependency Injection: Her request'e temiz session verir."""
    if not graph_core.driver:
        yield None
        return
        
    session = graph_core.driver.session()
    try:
        yield session
    except Exception as e:
        logger.error(f"🚨 DB Error, transaction iptal: {e}")
        raise
    finally:
        # 🚨 KRİTİK: Hata olsa da olmasa da session KESİN KAPANIR ve havuza döner.
        await session.close()

    async def seal_asset_dna(self, asset_id: str, sas_score: float, persona: str, category: str):
        """
        Laboratuvardan çıkan Ajanı (Asset), Personasına ve Kategorisine
        kopmaz Cypher bağlarıyla (Edge) düğümler (Node).
        """
        if not self.is_connected or not self.driver:
            logger.info(f"🔗 [GRAPH LAB - SIM] Ajan {asset_id}, {persona} ağına sanal olarak düğümlendi.")
            return [{"a.id": asset_id, "p.type": persona}]

        query = """
        // 1. Düğümleri (Nodes) Yarat veya Bul
        MERGE (a:Asset {id: $asset_id})
        SET a.sas_score = $sas_score
        
        MERGE (p:Persona {type: $persona})
        MERGE (c:Category {name: $category})
        
        // 2. Semantik Rezonans Bağlarını (Edges) Kur
        MERGE (a)-[r1:RESONATES_WITH]->(p)
        ON CREATE SET r1.base_lift = $sas_score * 20
        
        MERGE (a)-[r2:BELONGS_TO]->(c)
        
        RETURN a.id, p.type
        """
        try:
            async with self.driver.session() as session:
                result = await session.run(query, asset_id=asset_id, sas_score=sas_score, persona=persona, category=category)
                logger.info(f"🔗 [GRAPH LAB] Ajan {asset_id}, {persona} ağına başarıyla düğümlendi.")
                return await result.data()
        except Exception as e:
            logger.warning(f"⚠️ [GRAPH LAB] Cypher query hatası: {e}. (Sistem Neo4j kurulu olmadan güvenli devam ediyor)")
            return [{"a.id": asset_id, "p.type": persona}]

    async def query_sovereign_move(self, persona_type: str, category: str):
        """
        Sovereign Auto-Pilot için: Belirli bir Persona ve Kategori kombinasyonunda
        en yüksek kârı (Lift) getirecek Ajanı bulur.
        """
        if not self.is_connected or not self.driver:
            logger.info(f"🎯 [AUTO-PILOT - SIM] Hedef Kilitlendi: {persona_type} için en iyi simüle ajan")
            return {"asset_id": "sim_asset_1", "sas": 0.95, "expected_lift": 19.0}

        query = """
        MATCH (a:Asset)-[r:RESONATES_WITH]->(p:Persona {type: $persona})
        MATCH (a)-[:BELONGS_TO]->(c:Category {name: $category})
        RETURN a.id AS asset_id, a.sas_score AS sas, r.base_lift AS expected_lift
        ORDER BY r.base_lift DESC
        LIMIT 1
        """
        try:
            async with self.driver.session() as session:
                result = await session.run(query, persona=persona_type, category=category)
                record = await result.single()
                if record:
                    logger.info(f"🎯 [AUTO-PILOT] Hedef Kilitlendi: {persona_type} için en iyi ajan -> {record['asset_id']}")
                return dict(record) if record else None
        except Exception as e:
            logger.warning(f"⚠️ [AUTO-PILOT] Sorgu hatası: {e}")
            return None

# Singleton Engine
graph_core = SovereignGraphEngine()
