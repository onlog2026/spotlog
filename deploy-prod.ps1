# Deploy de producao do Spotlog na Vercel.
#
# COMO USAR (uma vez so):
#   1) Abra o arquivo  vercel-token.txt  (nesta mesma pasta)
#   2) Apague o texto e cole o SEU token da Vercel, salve.
#   3) Pronto. O token NUNCA vai pro git (esta no .gitignore) e nao aparece na tela.
#
# Depois disso, e so rodar este script (ou pedir pro Claude rodar) sempre que quiser publicar.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$tokenFile = Join-Path $root "vercel-token.txt"
if (-not (Test-Path $tokenFile)) {
  Write-Host "ERRO: vercel-token.txt nao encontrado nesta pasta." -ForegroundColor Red
  exit 1
}

$token = (Get-Content $tokenFile -Raw).Trim()
if (-not $token -or $token -eq "COLE_AQUI_SEU_TOKEN_DA_VERCEL") {
  Write-Host "ERRO: voce ainda nao colou o token em vercel-token.txt." -ForegroundColor Red
  Write-Host "Abra o arquivo, cole o token da Vercel, salve e rode de novo." -ForegroundColor Yellow
  exit 1
}

$env:VERCEL_TOKEN = $token
Write-Host "Publicando Spotlog em producao (pode levar ~1-2 min)..." -ForegroundColor Cyan
npx vercel@54.6.1 deploy --prod --yes
