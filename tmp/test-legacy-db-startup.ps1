$job = Start-Job -ScriptBlock {
    Set-Location "C:\Users\iivan\OneDrive\Documentos\Casa"
    dotnet run --project backend/Casa.Api --urls http://localhost:5082
}

try {
    $health = $null
    $properties = $null

    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2

        try {
            $health = Invoke-RestMethod -Uri "http://localhost:5082/api/health"
            $properties = Invoke-RestMethod -Uri "http://localhost:5082/api/properties?page=1&pageSize=5"
            break
        }
        catch {
        }
    }

    if ($health) {
        Write-Output ("health=" + ($health | ConvertTo-Json -Compress))
    }

    if ($properties) {
        Write-Output ("properties=" + ($properties | ConvertTo-Json -Compress))
    }

    Write-Output "jobOutput:"
    Receive-Job $job -Keep
}
finally {
    Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}
