import os
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(r"c:\Users\tourg\Desktop\SANTIS_SITE")
TOOLS_DIR = ROOT / "tools"
REPORTS_DIR = ROOT / "reports"

os.makedirs(REPORTS_DIR, exist_ok=True)

class TerminalColors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def run_module(name, command):
    print(f"\n{TerminalColors.OKCYAN}🚀 BAŞLIYOR: [[ {name} ]]{TerminalColors.ENDC}")
    print(f"{TerminalColors.OKBLUE}Çalıştırılan Komut:{TerminalColors.ENDC} {command}")
    
    try:
        # Use subprocess to capture output stream live
        process = subprocess.Popen(
            command, 
            shell=True, 
            cwd=str(ROOT),
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        output_log = []
        for line in iter(process.stdout.readline, ''):
            clean_line = line.strip()
            if clean_line:
                # Basic coloring for output live stream
                if "WARN" in clean_line or "İHLAL" in clean_line:
                    print(f"  {TerminalColors.WARNING}>> {clean_line}{TerminalColors.ENDC}")
                elif "ERROR" in clean_line or "Failed" in clean_line:
                    print(f"  {TerminalColors.FAIL}>> {clean_line}{TerminalColors.ENDC}")
                elif "SUCCESS" in clean_line or "Tamamlandı" in clean_line or "OK" in clean_line:
                    print(f"  {TerminalColors.OKGREEN}>> {clean_line}{TerminalColors.ENDC}")
                else:
                    print(f"  >> {clean_line}")
                output_log.append(clean_line)
                
        process.stdout.close()
        process.wait()
        
        print(f"{TerminalColors.OKGREEN}✅ MODÜL TAMAMLANDI: [[ {name} ]]{TerminalColors.ENDC}\n")
        return "\n".join(output_log)
        
    except Exception as e:
        err_msg = f"{TerminalColors.FAIL}❌ MODÜL ÇÖKTÜ: {str(e)}{TerminalColors.ENDC}"
        print(err_msg)
        return str(e)

def main():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    file_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    report_file = REPORTS_DIR / f"sentinel_audit_{file_timestamp}.md"
    
    print(f"{TerminalColors.HEADER}{TerminalColors.BOLD}")
    print("="*60)
    print("💎 SANTIS CLUB V3 - OMNI-SENTINEL (OTONOM DENETİM KONSOLU) 💎")
    print(f"Tarih: {timestamp}")
    print("="*60)
    print(f"{TerminalColors.ENDC}")
    
    report_content = [
        f"# 🛡️ OMNI-SENTINEL DENETİM RAPORU",
        f"**Tarih:** {timestamp}",
        f"**Sistem:** Santis V3 (Zero-Backend)",
        f"---"
    ]
    
    # Define tasks to run
    tasks = [
        ("Görsel & CLS Optimizasyonu", f'python "tools/optimize_images_cls.py"'),
        ("Marka Sesi (Tone Health) Taraması", f'python "tools/tone_health_audit.py"'),
        ("Open Graph & Meta Standartları", f'python "tools/og_meta_fix.py"'),
        ("Cross-Language (Hreflang) Senkronizasyonu", f'python "hreflang_sync.py"')
    ]
    
    for module_name, cmd in tasks:
        report_content.append(f"\n## ⚙️ MODÜL: {module_name}")
        report_content.append("```text")
        log_output = run_module(module_name, cmd)
        report_content.append(log_output)
        report_content.append("```")
        
    # Finalize report
    report_content.append("\n---\n*Santis Club Omni-Intelligence tarafından otonom olarak üretilmiştir.*")
    
    with open(report_file, "w", encoding="utf-8") as rf:
        rf.write("\n".join(report_content))
        
    print(f"{TerminalColors.HEADER}{TerminalColors.BOLD}")
    print("="*60)
    print("🏁 TÜM DENETİMLER TAMAMLANDI")
    print(f"📄 Rapor Kaydedildi: {report_file.relative_to(ROOT)}")
    print("="*60)
    print(f"{TerminalColors.ENDC}")

if __name__ == "__main__":
    main()
