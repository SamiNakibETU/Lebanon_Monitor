# Trigger synthesis generation (remplit le cache Redis)
# Usage: .\scripts\trigger-synthesis.ps1
# Ou avec secret explicite: $env:INGEST_SECRET="ton_secret"; .\scripts\trigger-synthesis.ps1

$baseUrl = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { "https://lebanonmonitor-production.up.railway.app" }
$secret = $env:INGEST_SECRET
if (-not $secret) {
  Write-Error "INGEST_SECRET non défini. Définis-le: `$env:INGEST_SECRET='ton_secret'"
  exit 1
}
$uri = "$baseUrl/api/admin/synthesis"
$headers = @{ "x-ingest-secret" = $secret }
try {
  $r = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -TimeoutSec 120
  Write-Host "OK:" $r
} catch {
  $statusCode = $_.Exception.Response.StatusCode.value__
  $body = ""
  if ($_.Exception.Response) {
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
      $reader = New-Object System.IO.StreamReader($stream)
      $body = $reader.ReadToEnd()
      $reader.Close()
      $stream.Close()
    }
  }
  Write-Host ""
  Write-Host "--- Réponse serveur (HTTP $statusCode) ---" -ForegroundColor Yellow
  if ($body) {
    Write-Host $body -ForegroundColor Cyan
    Write-Host "---" -ForegroundColor Yellow
  }
  Write-Error $_.Exception.Message
  exit 1
}
