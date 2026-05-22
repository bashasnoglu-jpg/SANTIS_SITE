import subprocess
import os

def generate_dry_run():
    output = subprocess.check_output(['git', 'branch', '-r']).decode('utf-8').splitlines()
    
    exclusions = [
        "phase", "seal", "governance", "release", "deployment", 
        "protected", "staging", "sovereign", "vercel", "runtime", 
        "admin", "boardroom", "billing", "booking", "ws", "token", 
        "guard", "main", "develop", "archive"
    ]
    
    candidates = []
    excluded_branches = []
    
    for line in output:
        branch = line.strip()
        if not branch or '->' in branch:
            continue
            
        branch_name = branch.replace('origin/', '', 1)
        
        is_excluded = False
        branch_lower = branch_name.lower()
        
        for excl in exclusions:
            if excl in branch_lower:
                is_excluded = True
                break
                
        if is_excluded:
            excluded_branches.append(branch)
        else:
            candidates.append(branch)
            
    # Categorize candidates
    categories = {
        "Copilot (AI Generated)": [],
        "Docs (Reports/Audits)": [],
        "Chore (Maintenance)": [],
        "Feat (Features)": [],
        "Fix (Bugfixes)": [],
        "Other": []
    }
    
    for c in candidates:
        if 'copilot/' in c:
            categories["Copilot (AI Generated)"].append(c)
        elif 'docs/' in c:
            categories["Docs (Reports/Audits)"].append(c)
        elif 'chore/' in c:
            categories["Chore (Maintenance)"].append(c)
        elif 'feat/' in c:
            categories["Feat (Features)"].append(c)
        elif 'fix/' in c:
            categories["Fix (Bugfixes)"].append(c)
        else:
            categories["Other"].append(c)
            
    md_path = 'docs/governance/branch-cleanup/batch-02/batch-02-dry-run-list.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write("# Phase G — Batch 02 Dry-Run Candidate List\n\n")
        f.write("## Overview\n")
        f.write("This list contains remote branch deletion candidates strictly filtered against all governance exclusion rules.\n\n")
        f.write(f"**Total Candidates:** {len(candidates)}\n")
        f.write(f"**Total Excluded/Protected:** {len(excluded_branches)}\n\n")
        
        for cat, brs in categories.items():
            if not brs:
                continue
            f.write(f"### {cat} ({len(brs)})\n")
            for b in brs:
                f.write(f"- `{b}`\n")
            f.write("\n")
            
        f.write("---\n")
        f.write("## Excluded Branches Sample (Protected by Rules)\n")
        for b in excluded_branches[:15]: # Show first 15 as proof
            f.write(f"- `{b}`\n")
        f.write(f"- ...and {len(excluded_branches) - 15} more.\n")

if __name__ == "__main__":
    generate_dry_run()
