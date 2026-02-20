# SANTIS Audit Package

This package provides a simple, self-contained audit setup.

Contents
- admin/audit-button.html: button snippet for Admin panel
- scripts/audit_crawler.py: basic crawler audit (requires requests + bs4)
- scripts/fix_links.ps1: PowerShell fixer (from site root)
- reports/: report output directory

Usage
1) Copy admin/audit-button.html into your Admin panel.
2) Run audit_crawler.py to generate reports/site_audit_report.csv
3) Run fix_links.ps1 to generate reports/fixed_links_report.csv

Dependencies (Python)
- requests
- beautifulsoup4

Install:
  pip install requests beautifulsoup4
