$dbPath = "C:\Users\iivan\OneDrive\Documentos\Casa\tmp\post-put-test.db"

if (Test-Path $dbPath) {
    Remove-Item $dbPath -Force
}

$job = Start-Job -ScriptBlock {
    Set-Location "C:\Users\iivan\OneDrive\Documentos\Casa"
    $env:ConnectionStrings__CasaDb = "Data Source=C:\Users\iivan\OneDrive\Documentos\Casa\tmp\post-put-test.db"
    dotnet run --project backend/Casa.Api --urls http://localhost:5078
}

try {
    for ($i = 0; $i -lt 20; $i++) {
        Start-Sleep -Seconds 2

        try {
            Invoke-RestMethod -Uri "http://localhost:5078/api/health" | Out-Null
            break
        }
        catch {
        }
    }

    $createBody = @{
        title = "Studio mobiliado"
        category = "Studio"
        source = "Teste"
        originalUrl = "https://example.com/studio"
        swotStatus = "Novo"
        price = 1800
        addressLine = "Rua Augusta, 100"
        neighborhood = "Consolacao"
        city = "Sao Paulo"
        state = "SP"
        postalCode = "01305-000"
        latitude = -23.5489
        longitude = -46.6388
        hasExactLocation = $true
    } | ConvertTo-Json

    $created = Invoke-RestMethod -Method Post -Uri "http://localhost:5078/api/properties" -ContentType "application/json" -Body $createBody

    $updateBody = @{
        title = "Studio mobiliado atualizado"
        category = "Studio"
        source = "Teste"
        originalUrl = "https://example.com/studio-2"
        swotStatus = "Em analise"
        price = 1900
        addressLine = "Rua Augusta, 101"
        neighborhood = "Consolacao"
        city = "Sao Paulo"
        state = "SP"
        postalCode = "01305-001"
        latitude = -23.5490
        longitude = -46.6387
        hasExactLocation = $false
    } | ConvertTo-Json

    $updated = Invoke-RestMethod -Method Put -Uri "http://localhost:5078/api/properties/$($created.id)" -ContentType "application/json" -Body $updateBody
    $fetched = Invoke-RestMethod -Uri "http://localhost:5078/api/properties/$($created.id)"

    Write-Output ("created=" + ($created | ConvertTo-Json -Compress))
    Write-Output ("updated=" + ($updated | ConvertTo-Json -Compress))
    Write-Output ("fetched=" + ($fetched | ConvertTo-Json -Compress))
}
finally {
    Stop-Job $job -ErrorAction SilentlyContinue | Out-Null
    Remove-Job $job -Force -ErrorAction SilentlyContinue | Out-Null
}
