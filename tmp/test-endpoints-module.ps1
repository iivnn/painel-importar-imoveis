$dbPath = "C:\Users\iivan\OneDrive\Documentos\Casa\tmp\endpoints-module-test.db"

if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
}

$job = Start-Job -ScriptBlock {
    Set-Location "C:\Users\iivan\OneDrive\Documentos\Casa"
    $env:ConnectionStrings__CasaDb = "Data Source=C:\Users\iivan\OneDrive\Documentos\Casa\tmp\endpoints-module-test.db"
    dotnet run --project backend/Casa.Api --urls http://localhost:5081
}

try {
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2

        try {
            Invoke-RestMethod -Uri "http://localhost:5081/api/health" | Out-Null
            break
        }
        catch {
        }
    }

    $health = Invoke-RestMethod -Uri "http://localhost:5081/api/health"
    $properties = Invoke-RestMethod -Uri "http://localhost:5081/api/properties?page=1&pageSize=1"

    Write-Output ("health=" + ($health | ConvertTo-Json -Compress))
    Write-Output ("properties=" + ($properties | ConvertTo-Json -Compress))
}
finally {
    Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}
