# Convert docs/SOW.md to docs/SOW.pdf using PowerShell's built-in markdown converter
# and Microsoft Edge's headless --print-to-pdf flag. No external installs required.
# Run from the repository root: pwsh docs/build-sow-pdf.ps1

$ErrorActionPreference = 'Stop'

$mdPath  = Join-Path $PSScriptRoot 'SOW.md'
$pdfPath = Join-Path $PSScriptRoot 'SOW.pdf'
$htmlPath = Join-Path $env:TEMP 'sow-print.html'

if (-not (Test-Path $mdPath)) {
    Write-Error "Not found: $mdPath"
    exit 1
}

Write-Host "Converting $mdPath -> HTML..."
$body = (ConvertFrom-Markdown -Path $mdPath).Html

$css = @'
body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 900px; margin: 6px auto; padding: 0 14px; color: #24292f; line-height: 1.35; font-size: 9.5pt; }
h1 { font-size: 1.45em; border-bottom: 2px solid #d0d7de; padding-bottom: 0.2em; margin-top: 0; margin-bottom: 0.15em; }
h2 { font-size: 1.15em; margin-top: 0.15em; margin-bottom: 0.4em; color: #57606a; font-weight: 600; }
h3 { font-size: 1.02em; margin-top: 0.85em; margin-bottom: 0.25em; border-bottom: 1px solid #eaeef2; padding-bottom: 0.1em; }
table { border-collapse: collapse; width: 100%; margin: 0.4em 0; font-size: 0.85em; page-break-inside: avoid; }
th, td { border: 1px solid #d0d7de; padding: 3px 6px; text-align: left; vertical-align: top; }
th { background: #f6f8fa; font-weight: 600; }
code { background: #f6f8fa; padding: 1px 4px; border-radius: 3px; font-family: Consolas, 'Cascadia Code', monospace; font-size: 0.88em; }
pre { background: #f6f8fa; padding: 8px; border-radius: 5px; overflow-x: auto; font-family: Consolas, monospace; font-size: 0.78em; line-height: 1.3; page-break-inside: avoid; margin: 0.4em 0; }
pre code { background: transparent; padding: 0; font-size: 1em; }
hr { border: 0; border-top: 1px solid #d0d7de; margin: 0.7em 0; }
ul, ol { padding-left: 1.5em; margin: 0.3em 0; }
li { margin: 0.1em 0; }
p { margin: 0.35em 0; }
strong { color: #0b1220; }
@page { size: A4; margin: 10mm 12mm; }
'@

$html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>SOW</title><style>$css</style></head><body>$body</body></html>"
[System.IO.File]::WriteAllText($htmlPath, $html, [System.Text.Encoding]::UTF8)

$edgeCandidates = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
    Write-Error "Microsoft Edge not found in the standard install locations."
    exit 1
}
Write-Host "Using Edge: $edge"

$fileUri = 'file:///' + ($htmlPath -replace '\\', '/')

# Edge headless can silently fail when the output path contains spaces or
# lives on OneDrive, so render to a plain temp path first, then move.
$tempPdf = Join-Path $env:TEMP ("sow-out-{0}.pdf" -f ([System.Guid]::NewGuid().ToString('N')))
$tempProfile = Join-Path $env:TEMP ("edge-print-profile-{0}" -f ([System.Guid]::NewGuid().ToString('N')))

Write-Host "Rendering PDF: $pdfPath"

if (Test-Path $pdfPath) { Remove-Item $pdfPath -Force }

$edgeArgs = @(
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    "--user-data-dir=$tempProfile",
    '--no-pdf-header-footer',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=10000',
    "--print-to-pdf=$tempPdf",
    $fileUri
)

$proc = Start-Process -FilePath $edge -ArgumentList $edgeArgs -Wait -PassThru -NoNewWindow

Remove-Item $htmlPath -Force -ErrorAction SilentlyContinue

if (Test-Path $tempPdf) {
    Move-Item -Path $tempPdf -Destination $pdfPath -Force
}

Remove-Item $tempProfile -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $pdfPath) {
    $size = (Get-Item $pdfPath).Length
    Write-Host "OK: $pdfPath ($size bytes)"
} else {
    Write-Error "Edge exited $($proc.ExitCode) but no PDF was written to $pdfPath"
    exit 1
}
