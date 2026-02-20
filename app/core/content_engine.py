import os
import json
import re
from pathlib import Path
from typing import Dict, Optional, Tuple, Any

# Core settings (to avoid circular imports, we define min essentials or use strict injection)
# In a real app, import from app.core.config
SITE_ROOT = Path("C:/Users/tourg/Desktop/SANTIS_SITE").resolve()

class ContentEngine:
    """
    The Content Brain of Santis OS.
    Responsible for intelligent routing, slug resolution, and safe path calculation.
    Pure domain logic. No DB commits, no disk writes.
    """

    def __init__(self, site_root: Path = SITE_ROOT):
        self.site_root = site_root
        self._routes_cache: Dict[str, Any] = {}
        self._services_cache: Dict[str, Any] = {}
        self._fallback_cache: Dict[str, Any] = {}
        self._load_registries()

    def _load_registries(self):
        """Loads all critical data registries into memory."""
        try:
            with open(self.site_root / "assets/data/available-routes.json", "r", encoding="utf-8") as f:
                self._routes_cache = json.load(f)
        except Exception as e:
            print(f"[ContentEngine] Warning: Could not load available-routes.json: {e}")

        try:
            with open(self.site_root / "assets/data/services.json", "r", encoding="utf-8") as f:
                self._services_cache = json.load(f)
        except Exception as e:
            print(f"[ContentEngine] Warning: Could not load services.json: {e}")

        try:
            with open(self.site_root / "assets/data/fallback-data.json", "r", encoding="utf-8") as f:
                self._fallback_cache = json.load(f)
        except Exception as e:
            print(f"[ContentEngine] Warning: Could not load fallback-data.json: {e}")

    def resolve_filesystem_path(self, source_web_path: str, target_lang: str) -> Path:
        """
        Calculates the safe, absolute filesystem path for a target file.
        Step 1: Calculate Target Web Path
        Step 2: Security Check
        """
        target_web_path = self.resolve_target_web_path(source_web_path, target_lang)
        
        # Remove leading slash for joinpath
        relative_path = target_web_path.lstrip("/").lstrip("\\")
        
        full_path = (self.site_root / relative_path).resolve()
        
        # STRICT SECURITY CHECK (Path Traversal Protection)
        if not str(full_path).startswith(str(self.site_root)):
            raise ValueError(f"SECURITY ALERT: Unsafe path resolution detected: {full_path}")
            
        return full_path

    def resolve_target_web_path(self, source_web_path: str, target_lang: str) -> str:
        """
        Determines the correct web URL/Path for a target language.
        Priority 1: Route Registry (Exact Map)
        Priority 2: Semantic Registry (Service ID Map)
        Priority 3: Smart Mirror (Fallback)
        """
        # Normalize source path (e.g., "tr/foo.html" -> "foo.html") check
        # But our registry keys are like "masajlar/index.html" (relative to language root usually?)
        # Let's clean the path first to match registry keys.
        
        # Heuristic: Remove language prefix if present to find "Canonical Key" candidates
        clean_path = source_web_path.strip("/")
        parts = clean_path.split("/")
        
        # If first part is a known lang code, strip it
        current_lang = "tr" # Default assumption if checking canonical
        if parts[0] in ["tr", "en", "de", "fr", "ru"]:
            current_lang = parts[0]
            canonical_candidate = "/".join(parts[1:])
        else:
            canonical_candidate = clean_path

        # --- STRATEGY 1: Route Registry Lookup (Transitive) ---
        # 1. Direct Candidates
        candidates = set()
        
        # A) Is it a Key?
        if canonical_candidate in self._routes_cache:
            candidates.add(canonical_candidate)
            
        # B) Is it a Value? (Reverse lookup)
        for k, v_map in self._routes_cache.items():
            for regex_path in v_map.values():
                if regex_path.strip("/") == clean_path:
                    candidates.add(k)
                    break # Matches this key, move to next
        
        # 2. Transitive Expansion (Bridge Keys)
        # 2. Transitive Expansion (Bridge Keys)
        # 2. Transitive Expansion (Bridge Keys)
        secondary_candidates = set()
        print(f"DEBUG: Candidates: {candidates}")
        for cand_key in candidates:
            known_paths = self._routes_cache.get(cand_key, {}).values()
            
            for known_path in known_paths:
                clean_known = known_path.strip("/")
                print(f"DEBUG: Exploring known: {repr(clean_known)}")
                
                for k, v_map in self._routes_cache.items():
                    if k == cand_key: continue
                    for p in v_map.values():
                        clean_p = p.strip("/")
                        # Optimization: check length first? No.
                        if clean_p == clean_known:
                            print(f"DEBUG: MATCH FOUND with Key: {k}")
                            secondary_candidates.add(k)
                        # else:
                            # if "goldenes" in clean_p:
                            #    print(f"DEBUG: Mismatch '{repr(clean_p)}' != '{repr(clean_known)}'")
        
        candidates.update(secondary_candidates)
        print(f"DEBUG: Final Candidates: {candidates}")

        # 3. Check candidates for Target Lang
        for key in candidates:
            if key in self._routes_cache:
                mapping = self._routes_cache[key]
                if target_lang in mapping:
                    return f"/{mapping[target_lang]}"
                    
        # --- STRATEGY 1.8: Fuzzy Sibling Match (Heuristic Repair) ---
        # If we have a Key (A) but no target lang, search for a Sibling Key (B)
        # in the same directory that matches closely.
        # This handles disjoint entries like 'goldenes-dreieck' vs 'golden-triangle'.
        
        # --- STRATEGY 1.8: Fuzzy Sibling Match (Heuristic Repair) ---
        # --- STRATEGY 1.8: Fuzzy Sibling Match (Heuristic Repair) ---
        candidates_list = list(candidates)
        if candidates_list:
            import difflib
            primary_key = candidates_list[0]
            
            # Heuristic for "category/slug/index.html" structure
            parts = primary_key.split("/")
            if len(parts) >= 3 and parts[-1] == "index.html":
                # Only attempted for standard structured content
                parent_category = parts[0] # e.g. "masajlar"
                current_slug = parts[1]    # e.g. "goldenes-dreieck-ritual"
                
                # print(f"DEBUG: Fuzzy Category Search in '{parent_category}' for '{current_slug}'")
                
                best_match = None
                best_score = 0.0
                
                for k in self._routes_cache.keys():
                    if k == primary_key: continue
                    k_parts = k.split("/")
                    # Must match category and structure
                    if len(k_parts) >= 3 and k_parts[0] == parent_category and k_parts[-1] == "index.html":
                        candidate_slug = k_parts[1]
                        score = difflib.SequenceMatcher(None, current_slug, candidate_slug).ratio()
                        
                        if score > best_score:
                            best_score = score
                            best_match = k
                
                if best_match and best_score > 0.4:
                     # print(f"DEBUG: Fuzzy Match WINNER: {best_match} ({best_score})")
                     mapping = self._routes_cache[best_match]
                     if target_lang in mapping:
                         return f"/{mapping[target_lang]}"

        # If Strategy 1 failed, we fall through to Strategy 2
        return None

    def register_route(self, canonical_path: str, lang: str, target_path: str) -> None:
        """
        Updates the route registry with a new mapping and saves to disk.
        
        Args:
            canonical_path: The key in available-routes.json (e.g. 'masajlar/index.html')
            lang: The language code (e.g. 'en')
            target_path: The value path (e.g. 'massages/index.html'). DO NOT include leading slash.
        """
        clean_key = canonical_path.strip("/")
        clean_target = target_path.strip("/")
        
        # Update memory cache
        if clean_key not in self._routes_cache:
            self._routes_cache[clean_key] = {}
        
        self._routes_cache[clean_key][lang] = clean_target
        
        # Save to disk
        self._save_routes()

    def get_canonical_key(self, web_path: str) -> Optional[str]:
        """
        Attempts to find the canonical key in the registry for a given web path.
        Use this when registering a new translation for an existing page.
        """
        clean_path = web_path.strip("/")
        
        # 1. Is it a Key?
        if clean_path in self._routes_cache:
            return clean_path
            
        # 2. Is it a Value?
        for k, v_map in self._routes_cache.items():
            for regex_path in v_map.values():
                if regex_path.strip("/") == clean_path:
                    return k
                    
        # 3. Strip lang prefix and try again?
        # e.g. "tr/masajlar/..." -> "masajlar/..."
        parts = clean_path.split("/")
        if len(parts) > 1 and len(parts[0]) == 2:
            no_lang = "/".join(parts[1:])
            if no_lang in self._routes_cache:
                return no_lang
                
        return None

    def _save_routes(self) -> None:
        """Persist routes cache to available-routes.json atomically."""
        routes_path = self.site_root / "assets/data/available-routes.json"
        temp_path = routes_path.with_suffix(".tmp")
        
        try:
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(self._routes_cache, f, indent=2, ensure_ascii=False)
            
            # Atomic replace (replace is atomic on POSIX, mostly safe on Windows py3)
            os.replace(temp_path, routes_path)
            print(f"ContentEngine: Routes saved to {routes_path}")
        except Exception as e:
            print(f"ContentEngine: Failed to save routes: {e}")
            if os.path.exists(temp_path):
                os.remove(temp_path)



        # --- STRATEGY 2: Semantic Registry (Service Slug) ---
        # If it's a service details page, find the Service ID
        # Extract slug from candidate: "masajlar/goldenes-dreieck-ritual/index.html" -> "goldenes-dreieck-ritual"
        
        path_segments = canonical_candidate.split("/")
        # Assumption: Service detail pages are like category/slug/index.html or category/slug.html
        potential_slug = None
        if len(path_segments) >= 2:
             # Check for index.html pattern
             if path_segments[-1] == "index.html":
                 potential_slug = path_segments[-2]
             elif path_segments[-1].endswith(".html"):
                 potential_slug = path_segments[-1].replace(".html", "")
        
        if potential_slug:
            target_slug_path = self._resolve_via_service_registry(potential_slug, target_lang, path_segments, current_lang)
            if target_slug_path:
                return target_slug_path

        # --- STRATEGY 3: Smart Mirror (Fallback) ---
        # Just swap the language prefix
        return self._smart_mirror_fallback(clean_path, current_lang, target_lang)

    def _find_canonical_key_by_value(self, search_path: str) -> Optional[str]:
        """Reverse lookup in routes cache."""
        for key, maps in self._routes_cache.items():
            for lang, path in maps.items():
                if path.strip("/") == search_path.strip("/"):
                    return key
        return None

    def _resolve_via_service_registry(self, slug: str, target_lang: str, path_segments: list, current_lang: str) -> Optional[str]:
        """
        Looks up a slug in services.json (fallback-data.json 'services' key usually).
        """
        # In Santis, services.json (or fallback-data 'services') keys are IDs (e.g. 'hammam_foam')
        # We need to find the Service ID that has this slug in 'current_lang' content.
        
        found_service_id = None
        services_map = self._fallback_cache.get("services", {}) # Using fallback-data for now as it seemed richer in previous view
        
        # If services_cache is populated from services.json, use that instead if better
        if self._services_cache: 
             # Merge or prioritize? Let's check services.json structure in memory if needed. 
             # tailored for fallback-data structure seen in logs:
             # "services": { "hammam_traditional_ritual": { "name": {...}, "desc": {...} } }
             # IT DOES NOT SEEM TO HAVE SLUGS IN LOCALIZATIONS in fallback-data snippet I saw.
             # I need to check if 'services.json' has them or if they are generated.
             pass

        # Search for the service definition that matches our slug
        for svc_id, svc_data in services_map.items():
            # Check if explicit slug field exists
            if svc_data.get("slug") == slug:
                found_service_id = svc_id
                break
            
            # Check localized content if available (e.g. if we had "slug": {"tr": "..."})
            # Based on previous file reads, services.json had "slug" at top level or content.
            # Let's look deeper if we had real services.json loaded.
            
            # Heuristic: Match Name if slug not found (Weak, but better than nothing?)
            # No, stick to slug. If data missing, fallback to Strategy 3.
            pass

        if found_service_id:
            svc_data = services_map[found_service_id]
            
            # Construct Target Path
            # We need the target category slug and target service slug.
            # This requires a "Category Map" and "Service Slug Map".
            # Since we might not have full 'target slug' data yet, we might need to generate it or lookup.
            
            # If we simply found the ID, do we know the target slug?
            # If the JSON doesn't have target slugs, we can't do magic.
            # BUT, if we have the English name, we can slugify it as a better guess than Turkish slug.
            
            target_name = svc_data.get("name", {}).get(target_lang)
            if target_name:
                new_slug = self._slugify(target_name)
                # Reconstruct path: keep folder structure but replace slug
                # path_segments: ['masajlar', 'TR-SLUG', 'index.html']
                # We also need to translate 'masajlar' -> 'massages'
                
                # This is getting complex. If we can't fully resolve components, Strategy 3 is safer
                # UNLESS we have specific map.
                
                # Let's rely on Strategy 3 for component names, but Strategy 2 for the LEAF node.
                
                # Semi-Smart:
                # /{target_lang}/{path_segments[0]}/{new_slug}/index.html
                # Note: This ignores category translation (masajlar -> massages).
                # To do this right, we need a Category Taxonomy Map.
                
                pass

        return None

    def _smart_mirror_fallback(self, clean_path: str, current_lang: str, target_lang: str) -> str:
        """
        Replaces /tr/ with /en/ at the start.
        """
        parts = clean_path.split("/")
        if parts[0] == current_lang:
            parts[0] = target_lang
        else:
            parts.insert(0, target_lang)
            
        return "/" + "/".join(parts)

    def _slugify(self, text: str) -> str:
        """Simple slugify for fallback generation."""
        text = text.lower()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[-\s]+', '-', text).strip("-_")
        return text
