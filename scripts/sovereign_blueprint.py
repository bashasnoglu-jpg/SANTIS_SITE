import argparse
import shutil
from pathlib import Path

def create_blueprint_parser(description: str):
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument("--apply", action="store_true", help="Apply changes to disk. If not set, runs in dry-run mode.")
    parser.add_argument("--root", type=str, default=None, help="Optional override for the root directory. If none, parent of scripts folder is used.")
    return parser

def resolve_root(script_path: str, args_root: str = None) -> Path:
    if args_root:
        return Path(args_root).resolve()
    return Path(script_path).resolve().parents[1]

def safe_write(target_path: Path, content: str, apply: bool = False, backup: bool = True) -> bool:
    """
    Safely writes content to target_path.
    Returns True if a change was/would be made.
    """
    is_new = not target_path.exists()
    
    if not is_new:
        try:
            existing_content = target_path.read_text(encoding="utf-8")
            if existing_content == content:
                print(f"[NO-OP] Degisiklik gerekmiyor: {target_path.name}")
                return False
        except Exception:
            pass # Maybe binary or wrong encoding. We'll overwrite.
            
        if apply and backup:
            backup_path = target_path.with_suffix(target_path.suffix + ".bak")
            shutil.copy2(target_path, backup_path)
            print(f"[BACKUP] Yedek olusturuldu: {backup_path.name}")

    if apply:
        target_path.parent.mkdir(parents=True, exist_ok=True)
        target_path.write_text(content, encoding="utf-8")
        print(f"[{'OLUSTURULDU' if is_new else 'GUNCELLENDI'}] {target_path.relative_to(target_path.parents[3]) if len(target_path.parents) > 3 else target_path.name}")
    else:
        print(f"[DRY-RUN] Degistirilecek/Olusturulacak: {target_path.relative_to(target_path.parents[3]) if len(target_path.parents) > 3 else target_path.name}")
        
    return True
