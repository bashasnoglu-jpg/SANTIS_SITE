from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Any, List, Dict
from pydantic import BaseModel
import sys

from app.db.session import get_db, get_db_for_admin
from app.db.models.content import ContentEdge

router = APIRouter()

class GraphRecommendationResponse(BaseModel):
    guest_id: str
    recommended_services: List[Dict[str, Any]]

@router.get("/{guest_id}/recommendations", response_model=GraphRecommendationResponse)
async def get_guest_recommendations(guest_id: str, db: AsyncSession = Depends(get_db_for_admin)) -> Any:
    """
    Santis AI Concierge Engine (Proof-of-Concept)
    Uses the Content Graph to predict what this guest might want next,
    based on their historical 'purchased' edges.
    """
    
    # 1. Find all services this guest has purchased
    stmt_purchased = select(ContentEdge.target_id).where(
        ContentEdge.source_id == guest_id,
        ContentEdge.source_type == "guest",
        ContentEdge.edge_type == "purchased",
        ContentEdge.target_type == "service"
    )
    result = await db.execute(stmt_purchased)
    purchased_slugs = result.scalars().all()
    
    if not purchased_slugs:
        return GraphRecommendationResponse(guest_id=guest_id, recommended_services=[])
        
    # 2. Collaborative Filtering (Graph Traversal):
    # Find OTHER guests who bought the SAME services
    stmt_peers = select(ContentEdge.source_id).where(
        ContentEdge.target_id.in_(purchased_slugs),
        ContentEdge.edge_type == "purchased",
        ContentEdge.source_type == "guest",
        ContentEdge.source_id != guest_id
    )
    result = await db.execute(stmt_peers)
    peer_ids = result.scalars().all()
    
    if not peer_ids:
         return GraphRecommendationResponse(guest_id=guest_id, recommended_services=[])
         
    # 3. Predict NEXT services based on what those peers bought
    # (Excluding things the current guest already bought)
    stmt_predict = select(
        ContentEdge.target_id, 
        func.count(ContentEdge.target_id).label('score')
    ).where(
        ContentEdge.source_id.in_(peer_ids),
        ContentEdge.edge_type == "purchased",
        ContentEdge.target_type == "service",
        ~ContentEdge.target_id.in_(purchased_slugs) # Exclude what they already have
    ).group_by(ContentEdge.target_id).order_by(desc('score')).limit(3)
    
    result = await db.execute(stmt_predict)
    recommendations = result.all()
    
    formatted_recs = []
    for target_id, score in recommendations:
        formatted_recs.append({
            "target": target_id,
            "confidence_score": score * 10 # Artificially boosting score for POC demo
        })
        
    return GraphRecommendationResponse(
        guest_id=guest_id,
        recommended_services=formatted_recs
    )
