
# Script to rename files/folders with NEUROVA/NUROVA and update references
$root = "C:\Users\tourg\Desktop\SANTIS_SITE"
$exclude = @("_build", "_backup", "_legacy", "node_modules", ".git", ".vscode", "_dev_archives")

# 1. Find Files to Rename
$filesToRename = Get-ChildItem -Path $root -Recurse -File | Where-Object { 
    $_.Name -match "NEUROVA" -or $_.Name -match "NUROVA" 
} | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) { if ($path -match [regex]::Escape($ex)) { $skip = $true; break } }
    -not $skip
}

foreach ($file in $filesToRename) {
    $oldName = $file.Name
    $newName = $oldName -replace "NEUROVA", "Santis" -replace "neurova", "santis" -replace "NUROVA", "Santis" -replace "nurova", "santis"
    # Basic Case Adjustment if needed (e.g. santis_logo.png)
    
    $newPath = Join-Path $file.DirectoryName $newName
    
    Write-Host "Renaming: $oldName -> $newName"
    Rename-Item -Path $file.FullName -NewName $newName -Force

    # 2. Update References in ALL text files
    $textFiles = Get-ChildItem -Path $root -Recurse -File -Include *.html, *.js, *.css, *.json, *.md, *.txt | Where-Object {
        $path = $_.FullName
        $skip = $false
        foreach ($ex in $exclude) { if ($path -match [regex]::Escape($ex)) { $skip = $true; break } }
        -not $skip
    }

    foreach ($tf in $textFiles) {
        $content = Get-Content $tf.FullName -Raw
        if ($content -match [regex]::Escape($oldName)) {
            $newContent = $content -replace [regex]::Escape($oldName), $newName
            Set-Content $tf.FullName -Value $newContent -NoNewline
            Write-Host "  Updated reference in $($tf.Name)"
        }
    }
}

# 3. Find Folders to Rename (Post-Order to handle nested renames safely)
# Not implemented deep nested logic for simplicity, assuming top-level folders mostly.
# If nested folders exist, we might need multiple passes.
$foldersToRename = Get-ChildItem -Path $root -Recurse -Directory | Where-Object {
    $_.Name -match "NEUROVA" -or $_.Name -match "NUROVA"
} | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($ex in $exclude) { if ($path -match [regex]::Escape($ex)) { $skip = $true; break } }
    -not $skip
}

foreach ($folder in $foldersToRename) {
    $oldName = $folder.Name
    $newName = $oldName -replace "NEUROVA", "Santis" -replace "neurova", "santis" -replace "NUROVA", "Santis" -replace "nurova", "santis"
    $newPath = Join-Path $folder.Parent.FullName $newName
    
    Write-Host "Renaming Folder: $oldName -> $newName"
    Rename-Item -Path $folder.FullName -NewName $newName -Force
    
    # Update references to folder path (e.g. "assets/img/neurova/")
    # This is tricky because content references might be relative or absolute.
    # Searching for "$oldName/" or "/$oldName" might be safer.
    
    $textFiles = Get-ChildItem -Path $root -Recurse -File -Include *.html, *.js, *.css, *.json, *.md, *.txt | Where-Object {
        $path = $_.FullName
        $skip = $false
        foreach ($ex in $exclude) { if ($path -match [regex]::Escape($ex)) { $skip = $true; break } }
        -not $skip
    }

    foreach ($tf in $textFiles) {
        $content = Get-Content $tf.FullName -Raw
        # Simple replace of folder name string. Might replace text content too, which is desired (rebranding).
        if ($content -match [regex]::Escape($oldName)) {
            $newContent = $content -replace [regex]::Escape($oldName), $newName
            Set-Content $tf.FullName -Value $newContent -NoNewline
            Write-Host "  Updated folder reference in $($tf.Name)"
        }
    }
}
