import ast
import os

SOURCE_FILE = 'server.py'
TARGET_ROUTER = 'app/api/v1/endpoints/ai_concierge.py'

def decouple_ai():
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        source_lines = f.readlines()
        
    with open(SOURCE_FILE, 'r', encoding='utf-8') as f:
        source = f.read()

    tree = ast.parse(source)
    
    targets = [
        'generate_vip_profile', 'get_vip_roster', 'get_decision_rules', 'get_shadow_log',
        'get_banner_stats', 'log_banner_impression', 'log_banner_click',
        'create_promo_token', 'validate_promo_token', 'use_promo_token',
        'concierge_chat', 'get_ai_accuracy', 'get_gemini_strategy',
        'get_gemini_forecast', 'get_ai_revenue_boost', 'ai_forecast',
        'get_guest_memory', 'update_guest_memory', 'ai_observe_guest'
    ]
    
    blocks = []
    
    for node in tree.body:
        if isinstance(node, (ast.AsyncFunctionDef, ast.FunctionDef)):
            if node.name in targets:
                start_line = node.lineno
                if node.decorator_list:
                    start_line = min(d.lineno for d in node.decorator_list)
                end_line = node.end_lineno
                blocks.append((start_line, end_line))
    
    blocks.sort()
    
    extracted_text = []
    for start, end in blocks:
        # extract lines (1-indexed)
        extracted_text.append(''.join(source_lines[start-1:end]))
        extracted_text.append('\n')
        
    router_body = '\n'.join(extracted_text)
    router_body = router_body.replace('@app.', '@router.')
    
    router_header = '''from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, text
from sqlalchemy.orm import selectinload
from app.db.session import get_db, AsyncSessionLocal
from app.db.models.tenant import Tenant
from app.db.models.customer import Customer
from app.db.models.booking import Booking, BookingStatus
from app.db.models.service import Service
import os, json

router = APIRouter()

async def neural_thought(message: str, level: str = "info"):
    # Mock neural_thought for router context to prevent undefined errors
    print(f"[{level.upper()}] {message}")

'''
    
    full_router = router_header + router_body
    
    with open(TARGET_ROUTER, 'w', encoding='utf-8') as f:
        f.write(full_router)
        
    # Remove from server.py (reverse order)
    new_lines = source_lines[:]
    for start, end in reversed(blocks):
        del new_lines[start-1:end]
        
    new_source = ''.join(new_lines)
    
    old_router = 'app.include_router(\n    booking_engine.router,\n    prefix="/api/v1/booking",\n    tags=["Booking Engine"]\n)'
    new_router = old_router + '''\napp.include_router(
    ai_concierge.router,
    prefix="",
    tags=["AI Concierge AND Guest Profiling"]
)'''
    new_source = new_source.replace(old_router, new_router)
    
    new_source = new_source.replace('from app.api.v1.endpoints import media_gateway, booking_engine', 'from app.api.v1.endpoints import media_gateway, booking_engine, ai_concierge')
    
    with open('server_new.py', 'w', encoding='utf-8') as f:
        f.write(new_source)

    print(f'Decoupled {len(blocks)} blocks into ai_concierge.py')

if __name__ == "__main__":
    decouple_ai()
