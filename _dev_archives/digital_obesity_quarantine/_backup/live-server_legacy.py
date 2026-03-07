
import http.server
import socketserver
import json
import os
import shutil
import datetime
from email.parser import BytesParser
from email.policy import default
try:
    from PIL import Image
    import io
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

PORT = 8000
# Hardcoded absolute path to ensure correct serving regardless of CWD
DIRECTORY = r"c:\Users\tourg\Desktop\SANTIS_SITE"

# --- 🤖 SANTIS AI SETTINGS ---
# Google Gemini API Key
# (Buraya kendi anahtarinizi yazacaksiniz: https://aistudio.google.com/app/apikey)
GEMINI_API_KEY = "AIzaSyBmJ2B4z_g1UAu2Q1Xcp67iAI7ZKF8GUwQ"

try:
    import google.generativeai as genai
    HAS_AI = True
except ImportError:
    HAS_AI = False

class SantisHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_request_to_file(self, message):
        try:
            with open(os.path.join(DIRECTORY, "server_log.txt"), "a", encoding="utf-8") as f:
                timestamp = datetime.datetime.now().strftime("%H:%M:%S")
                f.write(f"[{timestamp}] {message}\n")
        except Exception as e:
            print(f"Log Error: {e}")

    def do_GET(self):
        self.log_request_to_file(f"📥 GET Request: {self.path}") # LOG REACTIVATED
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "active", "version": "1.0"}).encode())
            return
        super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_error(self, code, message=None, explain=None):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message, 'code': code}).encode())

    def do_POST(self):
        if self.path == '/api/save':
            self.handle_save()
        elif self.path == '/api/upload':
            self.handle_upload()

        elif self.path == '/api/generate-text':
             self.handle_ai_generate()

        elif self.path == '/api/shutdown':
             self.handle_shutdown()

        elif self.path == '/api/backup':
             self.handle_backup()
        else:
            self.send_error(404, "API Endpoint not found")

    def handle_backup(self):
        try:
            # 1. Setup Backup Directory
            backup_root = os.path.join(DIRECTORY, 'backup')
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            folder_name = f"backup_{timestamp}"
            target_dir = os.path.join(backup_root, folder_name)
            
            os.makedirs(target_dir, exist_ok=True)
            self.log_request_to_file(f"🛡️ Sentinel: Starting backup to {folder_name}...")

            # 2. Define Critical Paths to Backup
            # (Data files and Admin logic)
            files_to_copy = []
            
            # js data files
            js_dir = os.path.join(DIRECTORY, 'assets', 'js')
            if os.path.exists(js_dir):
                for f in os.listdir(js_dir):
                    if f.endswith('.js') or f.endswith('.json'):
                        files_to_copy.append(os.path.join(js_dir, f))
            
            # admin folder
            admin_dir = os.path.join(DIRECTORY, 'admin')
            if os.path.exists(admin_dir):
                for f in os.listdir(admin_dir):
                    if f.endswith('.js') or f.endswith('.html') or f.endswith('.css'):
                        files_to_copy.append(os.path.join(admin_dir, f))

            # 3. Copy Files
            count = 0
            for file_path in files_to_copy:
                if os.path.isfile(file_path):
                    shutil.copy2(file_path, target_dir)
                    count += 1
            
            msg = f"Backup Complete. {count} files secured in {folder_name}"
            self.log_request_to_file(f"✅ Sentinel: {msg}")
            self.send_api_response(200, {"success": True, "message": msg, "path": folder_name})

        except Exception as e:
            self.log_request_to_file(f"❌ Sentinel Error: {e}")
            self.send_api_response(500, {"error": str(e)})

    def handle_shutdown(self):
        try:
            self.send_api_response(200, {"success": True, "message": "System shutting down..."})
            self.log_request_to_file("🔴 System Shutdown Requested via Admin Panel")
            
            def kill_me():
                import time
                time.sleep(1)
                print("🔴 SHUTTING DOWN SYSTEM NOW...")
                os._exit(0)
            
            import threading
            threading.Thread(target=kill_me).start()
            
        except Exception as e:
            self.send_api_response(500, {"error": str(e)})

    def handle_save(self):
        try:
            length_header = self.headers.get('Content-Length')
            if not length_header:
                 self.send_api_response(400, {"error": "No Content-Length"})
                 return
            content_length = int(length_header)
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            filename = data.get('filename')
            content = data.get('content')

            if not filename or not content:
                self.send_api_response(400, {"error": "Missing filename or content"})
                return

            # Security Check
            if '..' in filename:
                 self.send_api_response(403, {"error": "Invalid path security violation"})
                 return
            
            # 🚀 DUAL SAVE STRATEGY
            # 1. Save to assets/js (For Website)
            target_path_assets = os.path.join(DIRECTORY, 'assets', 'js', filename)
            
            # 2. Save to admin/ (For Admin Panel Local)
            target_path_admin = os.path.join(DIRECTORY, 'admin', filename)
            
            self.log_request_to_file(f"💾 Dual Saving: {filename}")
            
            # 1. Create Backup (Only for assets version)
            if os.path.exists(target_path_assets):
                backup_dir = os.path.join(DIRECTORY, 'backup')
                os.makedirs(backup_dir, exist_ok=True)
                timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_path = os.path.join(backup_dir, f"{timestamp}_{filename}")
                shutil.copy2(target_path_assets, backup_path)

            # 2. Write File (Assets)
            with open(target_path_assets, 'w', encoding='utf-8') as f:
                f.write(content)
                
            # 3. Write File (Admin)
            with open(target_path_admin, 'w', encoding='utf-8') as f:
                f.write(content)

            self.send_api_response(200, {"success": True, "message": f"Saved {filename} to both locations"})

        except Exception as e:
            self.log_request_to_file(f"Error saving file: {e}")
            self.send_api_response(500, {"error": str(e)})

    def handle_upload(self):
        try:
            content_type = self.headers.get('Content-Type')
            if not content_type:
                 self.send_api_response(400, {"error": "No Content-Type"})
                 return
            
            length_header = self.headers.get('Content-Length')
            if not length_header:
                 self.send_api_response(400, {"error": "No Content-Length"})
                 return
            content_length = int(length_header)
            
            body = self.rfile.read(content_length)
            
            # Parse multipart using email lib
            headers = b'Content-Type: ' + content_type.encode() + b'\r\n\r\n'
            msg = BytesParser(policy=default).parsebytes(headers + body)
            
            file_part = None
            folder_part = None
            
            if msg.is_multipart():
                for part in msg.iter_parts():
                    cd = part.get('Content-Disposition')
                    if not cd: continue
                    if 'name="file"' in cd:
                        file_part = part
                    elif 'name="folder"' in cd:
                        folder_part = part
            
            if not file_part:
                 self.send_api_response(400, {"error": "No file field found"})
                 return

            filename = file_part.get_filename()
            if not filename:
                 self.send_api_response(400, {"error": "No filename"})
                 return
                 
            file_data = file_part.get_payload(decode=True)
            
            folder = "cards"
            if folder_part:
                val = folder_part.get_payload(decode=True).decode().strip()
                if val in ['cards', 'blog', 'gallery']:
                    folder = val

            target_dir = os.path.join(DIRECTORY, 'assets', 'img', folder)
            os.makedirs(target_dir, exist_ok=True)
            
            clean_filename = os.path.basename(filename)
            target_path = os.path.join(target_dir, clean_filename)
            
            # --- 🎨 SANTIS CURATOR ENGINE (v5.0) ---
            # Auto-Compression & Optimization Logic
            saved_optimized = False
            
            if HAS_PIL:
                try:
                    ext = os.path.splitext(clean_filename)[1].lower()
                    if ext in ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff']:
                        # Read bytes
                        image_data = io.BytesIO(file_data)
                        img = Image.open(image_data)
                        
                        # 1. Resize Rule: Max Width 1200px
                        if img.width > 1200:
                            ratio = 1200 / float(img.width)
                            new_height = int(float(img.height) * ratio)
                            img = img.resize((1200, new_height), Image.Resampling.LANCZOS)
                            self.log_request_to_file(f"🎨 Curator: Resized {clean_filename} to 1200px.")
                        
                        # 2. Format Conversion: Force WebP (The Modern Standard)
                        # Except for transparent PNGs where user might want to keep original format if needed, 
                        # but WebP handles transparency well too.
                        
                        target_filename = os.path.splitext(clean_filename)[0] + ".webp"
                        target_path = os.path.join(target_dir, target_filename)
                        
                        # Save as WebP
                        img.save(target_path, "WEBP", quality=80, optimize=True)
                        
                        self.log_request_to_file(f"✨ Curator: Optimized & Converted {clean_filename} -> {target_filename} (WebP)")
                        saved_optimized = True
                        
                        # Update filename to return the new WebP name
                        clean_filename = target_filename
                        
                except Exception as e:
                     self.log_request_to_file(f"⚠️ Curator Error: {e}. Falling back to raw save.")
            
            if not saved_optimized:
                with open(target_path, 'wb') as f:
                     f.write(file_data)
                self.log_request_to_file(f"💾 Curator (Lite): Saved Raw {clean_filename}")

            self.send_api_response(200, {"success": True, "filename": clean_filename})

        except Exception as e:
            self.log_request_to_file(f"Error uploading file: {e}")
    def handle_ai_generate(self):
        if not HAS_AI:
             self.send_api_response(500, {"error": "google-generativeai library missing"})
             return
             
        if GEMINI_API_KEY == "BURAYA_API_KEY_YAZILACAK":
             self.send_api_response(400, {"error": "API Key Eksik! live-server.py dosyasina anahtarinizi yapistirin."})
             return

        try:
            length_header = self.headers.get('Content-Length')
            body = self.rfile.read(int(length_header))
            data = json.loads(body)
            prompt = data.get('prompt')
            
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-pro')
            
            response = model.generate_content(prompt)
            text = response.text
            
            self.send_api_response(200, {"success": True, "text": text})
            self.log_request_to_file("🤖 AI Generated Text")
            
        except Exception as e:
            self.log_request_to_file(f"AI Error: {e}")
            self.send_api_response(500, {"error": str(e)})

    def send_api_response(self, code, data):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

print(f"⚡ Santis Bridge Active on http://localhost:{PORT}")
print(f"📂 Root Directory: {DIRECTORY}")

# Ensure we reuse port to avoid "Address already in use" during restarting
socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.ThreadingTCPServer(("", PORT), SantisHandler) as httpd:
        httpd.serve_forever()
except OSError as e:
    # Create a temporary handler instance to log the error, as `self` is not available here.
    # This is a workaround for the instruction to use `self.log_request_to_file` outside the class.
    temp_handler = SantisHandler(None, None, None) 
    temp_handler.log_request_to_file(f"Port Error: {e}")
    print(f"Port {PORT} busy? Error: {e}") # Keep original print for immediate console feedback
