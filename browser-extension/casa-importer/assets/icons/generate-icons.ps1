Add-Type -AssemblyName System.Drawing
$basePath = 'C:\Users\iivan\OneDrive\Documentos\Casa\browser-extension\casa-importer\assets\icons'
New-Item -ItemType Directory -Force -Path $basePath | Out-Null
Get-ChildItem -Path $basePath -Filter 'icon-*.png' -ErrorAction SilentlyContinue | Remove-Item -Force
$sizes = @(16, 32, 48, 128)
foreach ($size in $sizes) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(156,116,71))
  $ringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(53,83,71), [Math]::Max(1, [int]($size / 18)))
  $houseBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,252,246))
  $roofPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,248,238), [Math]::Max(2, [int]($size / 10)))
  $doorBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(53,83,71))
  $g.FillEllipse($bgBrush, 0, 0, $size - 1, $size - 1)
  $g.DrawEllipse($ringPen, 0, 0, $size - 1, $size - 1)
  $g.DrawLine($roofPen, [single]($size * 0.22), [single]($size * 0.48), [single]($size * 0.50), [single]($size * 0.24))
  $g.DrawLine($roofPen, [single]($size * 0.50), [single]($size * 0.24), [single]($size * 0.78), [single]($size * 0.48))
  $g.FillRectangle($houseBrush, [single]($size * 0.30), [single]($size * 0.46), [single]($size * 0.40), [single]($size * 0.28))
  $g.FillRectangle($doorBrush, [single]($size * 0.45), [single]($size * 0.57), [single]($size * 0.10), [single]($size * 0.17))
  $target = Join-Path $basePath ("icon-$size.png")
  $bmp.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $bgBrush.Dispose(); $ringPen.Dispose(); $houseBrush.Dispose(); $roofPen.Dispose(); $doorBrush.Dispose()
  $g.Dispose(); $bmp.Dispose()
}
