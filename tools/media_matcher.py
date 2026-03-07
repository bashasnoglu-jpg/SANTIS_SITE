import http.server
import socketserver
import json
import os
import shutil
import urllib.parse
from pathlib import Path

# --- Configuration ---
PORT = 8080
ROOT_DIR = Path(__file__).parent.parent
IMG_CARDS_DIR = ROOT_DIR / "assets" / "img" / "cards"
IMG_GALLERY_DIR = ROOT_DIR / "assets" / "img" / "gallery"
PRODUCTS_JSON_PATH = ROOT_DIR / "data" / "content" / "products.json"
HOME_DATA_JSON_PATH = ROOT_DIR / "assets" / "data" / "home_data.json"
UI_HTML_PATH = Path(__file__).parent / "media_matcher_ui.html"

class MediaMatcherHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200, "ok")
        self.end_headers()

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def backup_json(self, file_path: Path):
        """Creates a .bak backup of the given file."""
        if file_path.exists():
            backup_path = file_path.with_suffix('.json.bak')
            shutil.copy2(file_path, backup_path)
            print(f"🛡️ Backup created: {backup_path.name}")

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        # 1. Serve the UI HTML
        if path == '/' or path == '/ui':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            with open(UI_HTML_PATH, 'rb') as f:
                self.wfile.write(f.read())
            return

        # 2. API: Get all available media files (images & videos)
        elif path == '/api/media':
            media = []
            valid_exts = {'.webp', '.jpg', '.png', '.mp4'}
            
            # Scan cards
            if IMG_CARDS_DIR.exists():
                for f in IMG_CARDS_DIR.iterdir():
                    if f.suffix.lower() in valid_exts:
                        media.append({
                            "name": f.name,
                            "path": f"/assets/img/cards/{f.name}",
                            "type": "video" if f.suffix.lower() == '.mp4' else "image"
                        })
            
            # Scan gallery
            if IMG_GALLERY_DIR.exists():
                for f in IMG_GALLERY_DIR.iterdir():
                    if f.suffix.lower() in valid_exts:
                        media.append({
                            "name": f.name,
                            "path": f"/assets/img/gallery/{f.name}",
                            "type": "video" if f.suffix.lower() == '.mp4' else "image"
                        })
            
            self.send_json_response({"media": media})
            return

        # 3. API: Get Data (products.json & home_data.json)
        elif path == '/api/data':
            data = {"products": [], "home_data": {}}
            
            if PRODUCTS_JSON_PATH.exists():
                with open(PRODUCTS_JSON_PATH, 'r', encoding='utf-8') as f:
                    data["products"] = json.load(f)
                    
            if HOME_DATA_JSON_PATH.exists():
                with open(HOME_DATA_JSON_PATH, 'r', encoding='utf-8') as f:
                    data["home_data"] = json.load(f)
                    
            self.send_json_response(data)
            return
            
        # Serve static files from root directory (for previews)
        else:
             # Ensure safety by rejecting path traversal
             if '..' in path:
                 self.send_error(403, "Forbidden")
                 return
             
             file_path = ROOT_DIR / path.lstrip('/')
             if file_path.exists() and file_path.is_file():
                 self.path = path # Let simpleHTTPRequestHandler handle it using current working directory IF we are running from ROOT_DIR
                 
                 # Better to serve it manually to enforce ROOT_DIR usage
                 try:
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        
                        # simple mime type guess
                        ext = file_path.suffix.lower()
                        mime_type = 'application/octet-stream'
                        if ext == '.webp': mime_type = 'image/webp'
                        elif ext == '.jpg' or ext == '.jpeg': mime_type = 'image/jpeg'
                        elif ext == '.png': mime_type = 'image/png'
                        elif ext == '.mp4': mime_type = 'video/mp4'
                        elif ext == '.css': mime_type = 'text/css'
                        elif ext == '.js': mime_type = 'application/javascript'
                        
                        self.send_header('Content-type', mime_type)
                        self.end_headers()
                        self.wfile.write(f.read())
                    return
                 except Exception as e:
                     self.send_error(500, str(e))
                     return
             
        self.send_error(404, "File not found")

    def do_POST(self):
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        # API: Save Data
        if path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                payload = json.loads(post_data.decode('utf-8'))
                
                # Check for updates and backup before writing
                if "products" in payload:
                    self.backup_json(PRODUCTS_JSON_PATH)
                    with open(PRODUCTS_JSON_PATH, 'w', encoding='utf-8') as f:
                        json.dump(payload["products"], f, ensure_ascii=False, indent=4)
                        
                if "home_data" in payload:
                    self.backup_json(HOME_DATA_JSON_PATH)
                    with open(HOME_DATA_JSON_PATH, 'w', encoding='utf-8') as f:
                        json.dump(payload["home_data"], f, ensure_ascii=False, indent=4)
                        
                self.send_json_response({"status": "success", "message": "Data saved successfully with backup."})
                print("💎 [Sovereign Media Matcher] JSON Files Successfully Updated & Backed Up.")
                
            except Exception as e:
                print(f"❌ [Error Saving Data]: {e}")
                self.send_json_response({"status": "error", "message": str(e)}, 500)
            return

        self.send_error(404, "Endpoint not found")

if __name__ == "__main__":
    # Ensure tool runs reliably from anywhere
    os.chdir(ROOT_DIR)
    
    with socketserver.TCPServer(("", PORT), MediaMatcherHandler) as httpd:
        print(f"===========================================================")
        print(f"🎬 [Sovereign Media Matcher] Server Started at PORT {PORT}")
        print(f"🌐 Access UI at: http://localhost:{PORT}")
        print(f"📁 Watching Root Dir: {ROOT_DIR}")
        print(f"===========================================================")
        httpd.serve_forever()
