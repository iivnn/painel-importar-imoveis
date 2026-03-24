$dbPath = "C:\Users\iivan\OneDrive\Documentos\Casa\tmp\pagination-test.db"

if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
}

$job = Start-Job -ScriptBlock {
    Set-Location "C:\Users\iivan\OneDrive\Documentos\Casa"
    $env:ConnectionStrings__CasaDb = "Data Source=C:\Users\iivan\OneDrive\Documentos\Casa\tmp\pagination-test.db"
    dotnet run --project backend/Casa.Api --urls http://localhost:5079
}

try {
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2

        try {
            Invoke-RestMethod -Uri "http://localhost:5079/api/health" | Out-Null
            break
        }
        catch {
        }
    }

    $page1 = Invoke-RestMethod -Uri "http://localhost:5079/api/properties?page=1&pageSize=1"
    $page2 = Invoke-RestMethod -Uri "http://localhost:5079/api/properties?page=2&pageSize=1"

    Write-Output ("page1=" + ($page1 | ConvertTo-Json -Compress))
    Write-Output ("page2=" + ($page2 | ConvertTo-Json -Compress))
}
finally {
    Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}
