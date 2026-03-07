import re

with open("server.py", "r", encoding="utf-8") as f:
    text = f.read()

# 1. gallery importunu media_gateway ile degistir
text = re.sub(r'(\s+)gallery,', r'\1media_gateway,', text)

# 2. Router include degistir
old_router = """app.include_router(
    gallery.router,
    prefix="/api/v1/gallery",
    tags=["gallery"]
)"""
new_router = """app.include_router(
    media_gateway.router,
    prefix="/api/v1/media",
    tags=["Media"]
)"""
text = text.replace(old_router, new_router)

# 3. upload ile delete arasindaki obez blogu sil
start_str = '@app.post("/api/v1/gallery/upload")'
end_str = 'return {"deleted": asset_id}'
start_idx = text.find(start_str)
end_idx = text.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]

with open("server.py", "w", encoding="utf-8") as f:
    f.write(text)

print("Decoupling complete")
