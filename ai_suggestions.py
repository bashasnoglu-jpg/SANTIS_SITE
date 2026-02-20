def generate_suggestions(audit_data):
    """
    Analyzes audit data (Security, Performance, Deep) and generates actionable suggestions.
    """
    suggestions = []

    # 1. SECURITY SUGGESTIONS
    security = audit_data.get("security", {})
    headers = security.get("headers", {})
    
    # CSP
    if headers.get("Content-Security-Policy", {}).get("present") == False:
        suggestions.append({
            "category": "SECURITY",
            "issue": "Content-Security-Policy (CSP) Eksik",
            "priority": "HIGH",
            "fix": "XSS koruması için server.py'a CSP middleware ekleyin.",
            "code": """app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["Content-Security-Policy"]
)""",
            "fix_action": {
                "action": "add_security_header",
                "params": {
                    "header": "Content-Security-Policy",
                    "value": "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' https: data:;"
                }
            },
            "auto_fix_safe": True
        })

    # X-Frame
    if headers.get("X-Frame-Options", {}).get("present") == False:
        suggestions.append({
            "category": "SECURITY",
            "issue": "Clickjacking Koruması Yok (X-Frame-Options)",
            "priority": "MEDIUM",
            "fix": "Siteyi iframe içine gömmeyi engellemek için header ekleyin.",
            "code": 'response.headers["X-Frame-Options"] = "DENY"',
            "fix_action": {
                "action": "add_security_header",
                "params": {
                    "header": "X-Frame-Options",
                    "value": "DENY"
                }
            },
            "auto_fix_safe": True
        })

    # HSTS
    if headers.get("Strict-Transport-Security", {}).get("present") == False:
        suggestions.append({
            "category": "SECURITY",
            "issue": "HSTS Eksik (Strict-Transport-Security)",
            "priority": "HIGH",
            "fix": "Tarayıcıları HTTPS kullanmaya zorlayın.",
            "code": 'response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"',
            "fix_action": {
                "action": "add_security_header",
                "params": {
                    "header": "Strict-Transport-Security",
                    "value": "max-age=31536000; includeSubDomains"
                }
            },
            "auto_fix_safe": True
        })

    # X-Content-Type-Options
    if headers.get("X-Content-Type-Options", {}).get("present") == False:
        suggestions.append({
            "category": "SECURITY",
            "issue": "MIME Sniffing Koruması Eksik",
            "priority": "MEDIUM",
            "fix": "Dosya türü tahminini engelleyin.",
            "code": 'response.headers["X-Content-Type-Options"] = "nosniff"',
             "fix_action": {
                "action": "add_security_header",
                "params": {
                    "header": "X-Content-Type-Options",
                    "value": "nosniff"
                }
            },
            "auto_fix_safe": True
        })

    # SSL
    if security.get("ssl_info", {}).get("valid") == False:
        suggestions.append({
            "category": "SECURITY",
            "issue": "HTTPS Kullanılmıyor",
            "priority": "CRITICAL",
            "fix": "Prodüksiyonda mutlaka SSL sertifikası (LetsEncrypt) kullanın.",
            "code": "# Nginx config or Certbot required",
            "auto_fix_safe": False
        })

    # Exposed Files
    exposed = security.get("exposed_files", [])
    if exposed:
        suggestions.append({
            "category": "SECURITY",
            "issue": f"{len(exposed)} Adet Hassas Dosya İfşa Olmuş",
            "priority": "CRITICAL",
            "fix": "Bu dosyaları sunucudan silin veya .htaccess/nginx ile engelleyin.",
            "code": f"# Block access to: {', '.join(exposed)}",
            "auto_fix_safe": False
        })

    # 2. PERFORMANCE SUGGESTIONS
    perf = audit_data.get("performance", {})
    
    # LCP
    lcp = perf.get("lcp", 0)
    if lcp > 2500:
        suggestions.append({
            "category": "PERFORMANCE",
            "issue": f"LCP Çok Yavaş ({lcp}ms)",
            "priority": "HIGH",
            "fix": "Ana görseli (Hero Image) optimize edin ve preload yapın.",
            "code": '<link rel="preload" as="image" href="hero.jpg">'
        })

    # TTFB
    ttfb = perf.get("ttfb", 0)
    if ttfb > 600:
        suggestions.append({
            "category": "PERFORMANCE",
            "issue": f"Sunucu Yanıtı Yavaş (TTFB: {ttfb}ms)",
            "priority": "MEDIUM",
            "fix": "Veritabanı sorgularını optimize edin veya Cache kullanın.",
            "code": "# Implement Server-Side Caching"
        })
    
    # CLS
    cls = perf.get("cls", 0)
    if cls > 0.1:
         suggestions.append({
            "category": "PERFORMANCE",
            "issue": f"Sayfa Kayması Var (CLS: {cls})",
            "priority": "MEDIUM",
            "fix": "Görsellere width/height verin.",
            "code": '<img src="..." width="800" height="600">'
        })

    # 3. SEMANTIC SUGGESTIONS (Santis Tone Guard)
    # Assuming semantic data might be passed here in future
    
    # General Fallback
    if not suggestions:
        suggestions.append({
            "category": "GENERAL",
            "issue": "Mükemmel Durumdasınız 🎉",
            "priority": "LOW",
            "fix": "Sistemi izlemeye devam edin.",
            "code": ""
        })

    return suggestions

from sentinel_analytics import SentinelAnalytics
from sentinel_memory import SentinelMemory
import json

class AISuggestionsEngine:
    """
    The 'Advisor' layer. Generates high-level optimization suggestions
    based on trends, memory, and health history.
    """

    @staticmethod
    def generate():
        from auto_optimizer import AutoOptimizer
        import uuid
        from datetime import datetime

        # Load existing queue to check for duplicates
        existing_queue = AutoOptimizer.load_suggestions()
        pending_titles = [s["title"] for s in existing_queue if s["status"] == "pending"]
        
        new_suggestions = []

        # 1. ACQUIRE INTELLIGENCE
        trend = SentinelAnalytics.analyze_trend()
        
        # 2. ANALYZE TRENDS
        if trend and trend.get("type") == "PERFORMANCE_RISK":
            title = "Performance Degradation Detected"
            if title not in pending_titles:
                new_suggestions.append({
                    "id": f"opt_{uuid.uuid4().hex[:6]}",
                    "type": "performance",
                    "title": title,
                    "confidence": 0.82,
                    "problem": trend["message"],
                    "suggestion": "Enable GZIP compression to reduce payload size.",
                    "expected_impact": "Response times may improve by 20–40%",
                    "action_key": "performance.enable_gzip",
                    "proposed_value": True,
                    "risk": "low",
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat()
                })
        
        # 3. ANALYZE MEMORY (Recurring Navbar)
        recent_nav_issues = len([
            i for i in SentinelMemory.get_recent(200) 
            if "navbar" in str(i.get("issue", "")).lower() 
            and i.get("status") == "FAILED"
        ])
        
        if recent_nav_issues >= 2:
            title = "Recurring Navbar Instability"
            if title not in pending_titles:
                 new_suggestions.append({
                    "id": f"opt_{uuid.uuid4().hex[:6]}",
                    "type": "stability",
                    "title": title,
                    "confidence": 0.88,
                    "problem": f"Navbar subsystem failed {recent_nav_issues} times recently.",
                    "suggestion": "Enable Minified Assets to reduce load race conditions.",
                    "expected_impact": "Significant UI stability improvement.",
                    "action_key": "ui.enable_minified_assets",
                    "proposed_value": True,
                    "risk": "low",
                    "status": "pending",
                    "created_at": datetime.utcnow().isoformat()
                })

        # Save if any new
        if new_suggestions:
            existing_queue.extend(new_suggestions)
            AutoOptimizer.save_suggestions(existing_queue)

        # Return all pending items for UI
        return [s for s in existing_queue if s["status"] == "pending"]
