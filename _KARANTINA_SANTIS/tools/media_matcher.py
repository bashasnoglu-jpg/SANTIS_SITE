import http.server
import socketserver
import json
import os
import shutil
import urllib.parse
import argparse
from pathlib import Path
from functools import partial

class MediaMatcherHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, root_dir: Path, *args, **kwargs):
        self.root_dir = root_dir
        self.img_cards_dir = self.root_dir / "assets" / "img" / "cards"
        self.img_gallery_dir = self.root_dir / "assets" / "img" / "gallery"
        self.products_json_path = self.root_dir / "data" / "content" / "products.json"
        self.home_data_json_path = self.root_dir / "assets" / "data" / "home_data.json"
        self.ui_html_path = Path(__file__).parent / "media_matcher_ui.html"
        # Provide directory to base class to avoid relying on os.getcwd()
        super().__init__(*args, directory=str(self.root_dir), **kwargs)

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
            if self.ui_html_path.exists():
                with open(self.ui_html_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b"UI HTML not found.")
            return

        # 2. API: Get all available media files (images & videos)
        elif path == '/api/media':
            media = []
            valid_exts = {'.webp', '.jpg', '.png', '.mp4'}
            
            # Scan cards
            if self.img_cards_dir.exists():
                for f in self.img_cards_dir.iterdir():
                    if f.suffix.lower() in valid_exts:
                        media.append({
                            "name": f.name,
                            "path": f"/assets/img/cards/{f.name}",
                            "type": "video" if f.suffix.lower() == '.mp4' else "image"
                        })
            
            # Scan gallery
            if self.img_gallery_dir.exists():
                for f in self.img_gallery_dir.iterdir():
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
            
            if self.products_json_path.exists():
                with open(self.products_json_path, 'r', encoding='utf-8') as f:
                    data["products"] = json.load(f)
                    
            if self.home_data_json_path.exists():
                with open(self.home_data_json_path, 'r', encoding='utf-8') as f:
                    data["home_data"] = json.load(f)
                    
            self.send_json_response(data)
            return
            
        # Serve static files from root directory (for previews)
        else:
             # Ensure safety by rejecting path traversal
             if '..' in path:
                 self.send_error(403, "Forbidden")
                 return
             
             file_path = self.root_dir / path.lstrip('/')
             if file_path.exists() and file_path.is_file():
                 try:
                    with open(file_path, 'rb') as f:
                        self.send_response(200)
                        
                        # simple mime type guess
                        ext = file_path.suffix.lower()
                        mime_type = 'application/octet-stream'
                        if ext == '.webp': mime_type = 'image/webp'
                        elif ext in ('.jpg', '.jpeg'): mime_type = 'image/jpeg'
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
                    self.backup_json(self.products_json_path)
                    with open(self.products_json_path, 'w', encoding='utf-8') as f:
                        json.dump(payload["products"], f, ensure_ascii=False, indent=4)
                        
                if "home_data" in payload:
                    self.backup_json(self.home_data_json_path)
                    with open(self.home_data_json_path, 'w', encoding='utf-8') as f:
                        json.dump(payload["home_data"], f, ensure_ascii=False, indent=4)
                        
                self.send_json_response({"status": "success", "message": "Data saved successfully with backup."})
                print("💎 [Sovereign Media Matcher] JSON Files Successfully Updated & Backed Up.")
                
            except Exception as e:
                print(f"❌ [Error Saving Data]: {e}")
                self.send_json_response({"status": "error", "message": str(e)}, 500)
            return

        self.send_error(404, "Endpoint not found")

def main():
    parser = argparse.ArgumentParser(description="Sovereign Media Matcher Server")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Root directory of SANTIS_SITE")
    parser.add_argument("--port", type=int, default=8080, help="Port to run the server on")
    args = parser.parse_args()

    root_dir = args.root.resolve()
    port = args.port

    # Partial application of handler constructor to inject state cleanly 
    handler = partial(MediaMatcherHandler, root_dir)

    with socketserver.TCPServer(("", port), handler) as httpd:
        print("===========================================================")
        print(f"🎬 [Sovereign Media Matcher] Server Started at PORT {port}")
        print(f"🌐 Access UI at: http://localhost:{port}")
        print(f"📁 Watching Root Dir: {root_dir}")
        print("===========================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")

if __name__ == "__main__":
    main()
