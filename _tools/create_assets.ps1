Add-Type -AssemblyName System.Drawing

$srcPath = 'c:\Users\tourg\Desktop\SANTIS_SITE\assets\img\hero-general.png'
$outPath = 'c:\Users\tourg\Desktop\SANTIS_SITE\assets\img\og-standard.jpg'

$src = [System.Drawing.Image]::FromFile($srcPath)
$og = New-Object System.Drawing.Bitmap(1200, 630)
$graphics = [System.Drawing.Graphics]::FromImage($og)
$graphics.InterpolationMode = 'HighQualityBicubic'
$graphics.DrawImage($src, 0, 0, 1200, 630)
$og.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$graphics.Dispose()
$og.Dispose()
$src.Dispose()
Write-Host "og-standard.jpg created (1200x630)"

# Now create a proper favicon.ico from a simple 32x32 dark icon
$ico = New-Object System.Drawing.Bitmap(32, 32)
$gIco = [System.Drawing.Graphics]::FromImage($ico)
$gIco.Clear([System.Drawing.Color]::FromArgb(10, 12, 16))
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 180, 140))
$font = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
$gIco.DrawString("S", $font, $brush, 5, 2)
$font.Dispose()
$brush.Dispose()
$gIco.Dispose()

$icoPath = 'c:\Users\tourg\Desktop\SANTIS_SITE\favicon.ico'
$ms = New-Object System.IO.MemoryStream
$ico.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$ico.Dispose()

# Write as .ico format (simple single-image ICO)
$pngBytes = $ms.ToArray()
$ms.Dispose()

$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)

# ICO header
$bw.Write([UInt16]0)      # Reserved
$bw.Write([UInt16]1)      # Type: ICO
$bw.Write([UInt16]1)      # Number of images

# ICO directory entry
$bw.Write([byte]32)       # Width
$bw.Write([byte]32)       # Height
$bw.Write([byte]0)        # Color palette
$bw.Write([byte]0)        # Reserved
$bw.Write([UInt16]1)      # Color planes
$bw.Write([UInt16]32)     # Bits per pixel
$bw.Write([UInt32]$pngBytes.Length)  # Size of PNG data
$bw.Write([UInt32]22)     # Offset to PNG data (6 + 16 = 22)

# PNG data
$bw.Write($pngBytes)
$bw.Close()
$fs.Close()

Write-Host "favicon.ico created (32x32, proper ICO format)"
