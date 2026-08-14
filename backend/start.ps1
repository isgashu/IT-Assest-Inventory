$env:DATABASE_URL = "file:./dev.db"
$env:JWT_SECRET = "it-asset-management-secret-key"
$env:CORS_ORIGIN = "http://localhost:5173"

$error.Clear()
$process = Start-Job -ScriptBlock {
    param($dbPath)
    $db = New-Object Data.Common.DB('Data Source=' + $dbPath)
    
    # Test connection
    Write-Host "Connecting to database: $dbPath"
    
    # Load modules
    $express = Import-Module -Name 'express' -Force -ErrorAction Stop
    $cors = Import-Module -Name 'cors' -Force -ErrorAction Stop
    $helmet = Import-Module -Name 'helmet' -Force -ErrorAction Stop
    
    $app = [express]::express()
    
    $app.use([helmet]::())
    $app.use([cors]::@{ origin = $using:CORS_ORIGIN; credentials = $true })
    $app.use([express]::json()@{ limit = '10kb' })
    
    $app.get('/api/health', {
        param($req, $res)
        $res.json(@{ status = 'ok'; message = 'Backend is running' })
    })
    
    $app.listen(5000, {
        Write-Host "Server running on port 5000"
    })
} -ArgumentList "./dev.db"

Write-Host "Server process started"