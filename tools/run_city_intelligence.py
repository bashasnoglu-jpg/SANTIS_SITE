
import asyncio
import sys
import os
import json
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from city_intelligence import city_intelligence

async def main():
    print("🕵️‍♂️ ULTRA DEEP RESEARCH: INITIALIZING...")
    print("=========================================")
    print("📡 Quantum Crawler: ONLINE")
    print("🧠 Semantic Cortex: ONLINE")
    print("=========================================")
    
    try:
        # Run the full scan
        report = await city_intelligence.run_full_scan()
        
        print("\n✅ SCAN COMPLETE. ANALYZING DATA...\n")
        
        # Display Summary
        crawler_stats = report.get("crawler", {})
        semantic_stats = report.get("semantic", {})
        
        print(f"📊 HEALTH SCORE: {report.get('health_score')}/100")
        print("-----------------------------------------")
        print(f"🕸️  Pages Scanned:      {crawler_stats.get('pages_scanned', 0)}")
        print(f"🔗 Broken Links:       {len(crawler_stats.get('broken_links', []))}")
        print(f"📦 Missing Assets:     {len(crawler_stats.get('missing_assets', []))}")
        print("-----------------------------------------")
        print(f"🚫 Tone Violations:    {len(semantic_stats.get('tone_violations', []))}")
        print(f"⚠️  Consistency Issues: {len(semantic_stats.get('consistency_issues', []))}")
        print("-----------------------------------------")
        
        # Save pretty summary
        summary_path = Path("reports/intelligence_summary.txt")
        summary_text = f"""
        ULTRA DEEP RESEARCH SUMMARY
        ===========================
        Date: {report.get('timestamp')}
        Health Score: {report.get('health_score')}
        
        [TECHNICAL]
        - Scanned: {crawler_stats.get('pages_scanned')} pages
        - Broken Links: {len(crawler_stats.get('broken_links', []))}
        - Missing Assets: {len(crawler_stats.get('missing_assets', []))}
        
        [SEMANTIC]
        - Brand Incidents: {len(semantic_stats.get('consistency_issues', []))}
        - Tone Violations: {len(semantic_stats.get('tone_violations', []))}
        """
        summary_path.write_text(summary_text, encoding="utf-8")
        print(f"📄 Full report saved to: reports/PROJECT_INTELLIGENCE_REPORT.json")
        
    except Exception as e:
        print(f"❌ FATAL ERROR: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    asyncio.run(main())
