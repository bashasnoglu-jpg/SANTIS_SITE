@echo off
echo ===================================================
echo SANTIS OMNI-INTELLIGENCE - MONTHLY SITE AUDIT
echo ===================================================
echo.
echo Running SEO Deep Audit...
python tools\seo_deep_audit.py > reports\monthly_seo_audit.txt
echo Running Open Graph and Meta Integrity Check...
python tools\og_meta_fix.py >> reports\monthly_seo_audit.txt
echo Running Image and CLS Optimization Check...
python tools\optimize_images_cls.py >> reports\monthly_seo_audit.txt
echo Running Hreflang Snychronization Check...
python hreflang_sync.py >> reports\monthly_seo_audit.txt
echo.
echo ===================================================
echo AUDIT COMPLETE. See reports\monthly_seo_audit.txt
echo ===================================================
pause
